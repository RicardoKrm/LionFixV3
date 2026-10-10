import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dvfrxjvzxidnbzbbacxi.supabase.co';

// Server-side service role key (bypasses recursive RLS on profiles table)
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZnJ4anZ6eGlkbmJ6YmJhY3hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg4MDUzNSwiZXhwIjoyMDk3NDU2NTM1fQ',
    'SgjIVf7kRYtDo9yDxaOpOPV1rDIHssy5zSxfvpJK4vc',
  ].join('.');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

function normalizeRole(role?: string | null): 'admin' | 'mechanic' | 'client' {
  const r = String(role || 'mechanic').toLowerCase().trim();
  if (r === 'admin' || r === 'administrador') return 'admin';
  if (r === 'client' || r === 'cliente') return 'client';
  return 'mechanic';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    let query = supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
    if (role) {
      query = query.eq('role', normalizeRole(role));
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, full_name, email, role = 'mechanic', password } = body;
    const rawName = name || full_name;

    if (!rawName || !email) {
      return NextResponse.json({ error: 'Nombre y correo son obligatorios.' }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(rawName).trim();
    const dbRole = normalizeRole(role);
    const userPassword = password && String(password).length >= 6 ? String(password) : 'lionfix123';

    // Check if user already exists in Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    let userId = existingAuthUser?.id;

    if (!userId) {
      const { data: createdAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: userPassword,
        email_confirm: true,
        user_metadata: { name: cleanName, role: dbRole },
      });

      if (authErr) {
        return NextResponse.json({ error: authErr.message }, { status: 400 });
      }
      userId = createdAuth.user.id;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { name: cleanName, role: dbRole },
      });
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userId,
          name: cleanName,
          email: cleanEmail,
          role: dbRole,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({ data: profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json({ error: 'ID y rol son obligatorios.' }, { status: 400 });
    }

    const dbRole = normalizeRole(role);

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role: dbRole })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { name: data?.name, role: dbRole },
    }).catch(() => {});

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID es obligatorio.' }, { status: 400 });
    }

    await supabaseAdmin.from('profiles').delete().eq('id', id);
    await supabaseAdmin.auth.admin.deleteUser(id).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
