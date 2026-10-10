import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing. Ensure you have set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

// Global safe fetch to prevent Uncaught Promise Rejections when DB sleeps or network fails
const safeFetchWithTimeout = async (url: RequestInfo | URL, options?: RequestInit) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000); // 15s timeout

  if (options?.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error: any) {
    console.warn("Supabase network error caught:", error.message);
    // IMPORTANT: Must return status 503 (5xx range) so @supabase/auth-js treats it as
    // AuthRetryableFetchError and preserves the user session when tab wakes from background/minimize.
    // Returning 400 caused GoTrue to think the refresh_token was invalid and sign out the user.
    return new Response(JSON.stringify({
      error: "network_error",
      message: error.message || 'Error temporal de conexión con la base de datos'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    clearTimeout(timer);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    // Prevents Navigator LockManager deadlocks and immediately disables GoTrueClient's internal pendingInLock queue
    lock: async function <R>(this: any, _name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
      if (this && typeof this === 'object') {
        this._acquireLock = async (_timeout: number, work: () => Promise<any>) => {
          return await work();
        };
      }
      return await fn();
    },
  },
  global: {
    fetch: safeFetchWithTimeout
  }
});

// Ensure _acquireLock never queues or deadlocks on tab visibilitychange / initialization
(supabase.auth as any)._acquireLock = async (_timeout: number, work: () => Promise<any>) => {
  return await work();
};

const getStorageKey = (): string => {
  if ((supabase as any).storageKey) return (supabase as any).storageKey;
  try {
    return `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
  } catch {
    return 'sb-auth-token';
  }
};

const originalGetSession = supabase.auth.getSession.bind(supabase.auth);

// Fast, lock-free getSession that reads directly from localStorage without waiting on initializePromise
// Only refreshes over the network if the JWT is actually expired or within 30s of expiry.
supabase.auth.getSession = async () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storageKey = getStorageKey();
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return { data: { session: null }, error: null };
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.access_token) {
        const expiresAtMs = parsed.expires_at ? parsed.expires_at * 1000 : Infinity;
        // Token is valid for >30s: return immediately in 0ms without touching any lock
        if (expiresAtMs - Date.now() > 30000) {
          return { data: { session: parsed }, error: null };
        }
        // Token is expired or expiring soon: attempt refresh with an 8s safety timeout
        if (parsed.refresh_token && typeof (supabase.auth as any)._callRefreshToken === 'function') {
          try {
            const refreshResult = await Promise.race([
              (supabase.auth as any)._callRefreshToken(parsed.refresh_token),
              new Promise<{ data: any; error: any }>((resolve) =>
                setTimeout(() => resolve({ data: parsed, error: null }), 8000)
              ),
            ]);
            if (refreshResult?.data) {
              return { data: { session: refreshResult.data }, error: null };
            }
          } catch {
            // Return existing token on transient error rather than hanging
          }
        }
        return { data: { session: parsed }, error: null };
      }
    } catch (e) {
      console.warn('Fast getSession fallback error:', e);
    }
  }
  return await originalGetSession();
};

// Wire accessToken directly so SupabaseClient._getAccessToken() never blocks on GoTrue locks
const getFastAccessToken = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ?? supabaseAnonKey;
};

(supabase as any).accessToken = getFastAccessToken;
(supabase as any)._getAccessToken = getFastAccessToken;


