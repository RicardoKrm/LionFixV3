import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Iniciando login con admin99...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin99@lionfix.com',
    password: '12345678'
  });

  if (error) {
    console.error("Login failed:", error.message);
    return;
  }

  console.log("Login OK. User ID:", data.session.user.id);

  console.log("Fetching profile con ANON KEY...");
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.session.user.id)
    .single();

  if (profileErr) {
    console.error("Profile fetch error:", profileErr);
  } else {
    console.log("Profile fetch success:", profile);
  }
}

test().catch(console.error);
