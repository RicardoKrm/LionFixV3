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
  
  const finalSignal = options?.signal || controller.signal;
  
  try {
    const response = await fetch(url, { ...options, signal: finalSignal });
    return response;
  } catch (error: any) {
    console.warn("Supabase network error caught:", error.message);
    // Return a fake Response that gotrue/postgrest can parse as an error instead of crashing
    return new Response(JSON.stringify({ 
      error: "network_error", 
      message: error.message || 'Error de conexión con la base de datos' 
    }), {
      status: 400,
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
  },
  global: {
    fetch: safeFetchWithTimeout
  }
});
