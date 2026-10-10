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
    detectSessionInUrl: true,
    // Prevents "Acquiring an exclusive Navigator LockManager lock immediately failed" in browsers
    lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
      return await fn();
    },
  },
  global: {
    fetch: safeFetchWithTimeout
  }
});
