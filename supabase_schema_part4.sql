-- ==========================================
-- SCRIPT DE MIGRACIÓN SUPABASE - PARTE 4 (E2E y Calidad)
-- ==========================================

-- 1. CONFIGURACIÓN DE SUPABASE STORAGE PARA EVIDENCIAS
-- Insertamos el bucket para almacenar fotos y documentos (hacemos el bucket público por simplicidad de lectura, pero restringimos la subida)
insert into storage.buckets (id, name, public) 
values ('evidence', 'evidence', true)
on conflict (id) do update set public = true;

-- Políticas de seguridad para Storage
-- Permitir lectura pública a cualquier usuario
create policy "Lectura pública de evidencias"
on storage.objects for select
using ( bucket_id = 'evidence' );

-- Permitir subida solo a usuarios autenticados
create policy "Subida de evidencias usuarios autenticados"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'evidence' );

-- Permitir actualización y borrado a usuarios autenticados
create policy "Actualización de evidencias usuarios autenticados"
on storage.objects for update
to authenticated
using ( bucket_id = 'evidence' );

create policy "Borrado de evidencias usuarios autenticados"
on storage.objects for delete
to authenticated
using ( bucket_id = 'evidence' );


-- 2. TABLA DE REGISTROS DE AUDITORÍA ISO 9001 (iso_logs)
create table if not exists public.iso_logs (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    event_type text not null,          -- Ej: 'OT Completada', 'Documento Subido', 'Nuevo Cliente', 'Reclamo'
    description text not null,         -- Descripción detallada del evento
    reference_id uuid,                 -- ID de referencia (ej: ID de la OT, ID del Cliente)
    reference_table text,              -- Nombre de la tabla de referencia (ej: 'work_orders')
    user_id uuid references auth.users(id), -- Usuario que generó el evento (puede ser nulo si es automático)
    clausula_iso text                  -- Cláusula ISO a la que aplica este registro (ej: '8.5', '7.5', '9.1.2')
);

-- Políticas RLS para iso_logs
alter table public.iso_logs enable row level security;

-- Cualquier usuario logueado puede insertar logs de auditoría y leerlos
create policy "Permitir lectura de iso_logs a usuarios autenticados"
    on public.iso_logs for select to authenticated using (true);

create policy "Permitir inserción en iso_logs a usuarios autenticados"
    on public.iso_logs for insert to authenticated with check (true);


-- 3. PERMISOS DE ADMINISTRADOR
-- Si te registras en la app con el correo 'admin@lionfix.com' (usando la página de registro),
-- ejecuta este bloque de código DESPUÉS para darle permisos de administrador a esa cuenta:

/*
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@lionfix.com' LIMIT 1);
*/
