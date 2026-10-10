-- ==============================================================================
-- LIONFIX SERVICE - SCHEMA MAESTRO CONSOLIDADO (PRODUCCIÓN)
-- Ejecutar este archivo completo en el SQL Editor de tu proyecto Supabase.
-- ==============================================================================

-- 0. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PERFILES DE USUARIOS (Vinculado a auth.users de Supabase)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'mechanic' CHECK (role IN ('admin', 'mechanic', 'client')),
  avatar_url TEXT DEFAULT 'https://placehold.co/100x100.png',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger automático para crear perfil al registrar usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'mechanic'),
    'https://placehold.co/100x100.png'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public.profiles.name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==============================================================================
-- 2. CLIENTES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage clients" ON public.clients;
CREATE POLICY "Staff can manage clients" ON public.clients
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic')));


-- ==============================================================================
-- 3. VEHÍCULOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  vin TEXT,
  motor_number TEXT,
  mileage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage vehicles" ON public.vehicles;
CREATE POLICY "Staff can manage vehicles" ON public.vehicles
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic')));


-- ==============================================================================
-- 4. INVENTARIO Y REPUESTOS (PARTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  alert_threshold INTEGER NOT NULL DEFAULT 5,
  location TEXT,
  cost NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage parts" ON public.parts;
CREATE POLICY "Staff can manage parts" ON public.parts
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic')));


-- ==============================================================================
-- 5. ÓRDENES DE TRABAJO (WORK ORDERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ot_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Mantención Correctiva' CHECK (type IN ('Mantención Preventiva', 'Mantención Correctiva', 'Diagnóstico')),
  status TEXT NOT NULL DEFAULT 'Ingresado' CHECK (status IN (
    'Ingresado', 'En Diagnóstico', 'Esperando Aprobación', 'Esperando Repuestos',
    'En Reparación', 'Pausado', 'Listo para Retiro', 'Entregado', 'Cancelado'
  )),
  technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completion_date TIMESTAMP WITH TIME ZONE,
  labor_hours NUMERIC DEFAULT 0,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_comment TEXT,
  final_report TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage work orders" ON public.work_orders;
CREATE POLICY "Staff can manage work orders" ON public.work_orders
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic')));


-- ==============================================================================
-- 6. REPUESTOS EN ÓRDENES DE TRABAJO (WORK ORDER PARTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.work_order_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.work_order_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage work order parts" ON public.work_order_parts;
CREATE POLICY "Staff can manage work order parts" ON public.work_order_parts
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic')));


-- ==============================================================================
-- 7. BITÁCORA DE SERVICIOS (SERVICE LOGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.service_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entry_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.service_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage service logs" ON public.service_logs;
CREATE POLICY "Staff can manage service logs" ON public.service_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic')));


-- ==============================================================================
-- 8. CHECKLISTS DE RECEPCIÓN Y ENTREGA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('Recepción', 'Entrega')),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  vehicle_plate TEXT,
  technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  checked_items JSONB NOT NULL DEFAULT '{}',
  custom_items JSONB NOT NULL DEFAULT '[]',
  evidence_photos JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage checklists" ON public.checklists;
CREATE POLICY "Staff can manage checklists" ON public.checklists
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic')));


-- ==============================================================================
-- 9. CONFIGURACIÓN DEL TALLER (WORKSHOP SETTINGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workshop_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'LionFix Service',
  manager TEXT DEFAULT 'Administrador',
  phone TEXT DEFAULT '+56900000000',
  address TEXT DEFAULT 'Taller Central',
  logo_url TEXT DEFAULT '/logo2.png',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workshop_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read workshop settings" ON public.workshop_settings;
CREATE POLICY "Public can read workshop settings" ON public.workshop_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage workshop settings" ON public.workshop_settings;
CREATE POLICY "Admin can manage workshop settings" ON public.workshop_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Insertar fila por defecto si está vacía
INSERT INTO public.workshop_settings (name, manager, phone, address, logo_url)
SELECT 'LionFix Service', 'Administrador', '+56900000000', 'Dirección del Taller', '/logo2.png'
WHERE NOT EXISTS (SELECT 1 FROM public.workshop_settings);


-- ==============================================================================
-- 10. COTIZACIONES Y PRESUPUESTOS (QUOTES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Enviada', 'Aprobada', 'Rechazada', 'Pendiente')),
  items JSONB DEFAULT '[]',
  notes TEXT,
  diagnostics_main_failure TEXT,
  diagnostics_failure_start TEXT,
  diagnostics_failure_type TEXT,
  diagnostics_entry_condition TEXT,
  diagnostics_notes TEXT,
  advance_payment NUMERIC DEFAULT 0,
  terms_and_conditions TEXT,
  signature_data_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage quotes" ON public.quotes;
CREATE POLICY "Staff can manage quotes" ON public.quotes
  FOR ALL USING (true); -- Permitir también lectura pública o por cliente mediante token/ID directo

CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'servicio',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL
);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage quote items" ON public.quote_items;
CREATE POLICY "Staff can manage quote items" ON public.quote_items
  FOR ALL USING (true);


-- ==============================================================================
-- 11. CITAS Y RESERVAS WEB (APPOINTMENTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_rut TEXT,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_type TEXT,
  mileage INTEGER,
  type TEXT NOT NULL,
  requested_date DATE NOT NULL,
  requested_time TEXT,
  reservation_code TEXT,
  status TEXT DEFAULT 'Pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Permite reservas públicas desde la Landing Page
DROP POLICY IF EXISTS "Allow public insert appointments" ON public.appointments;
CREATE POLICY "Allow public insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow staff read appointments" ON public.appointments;
CREATE POLICY "Allow staff read appointments" ON public.appointments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow staff update appointments" ON public.appointments;
CREATE POLICY "Allow staff update appointments" ON public.appointments
  FOR UPDATE USING (true);


-- ==============================================================================
-- 12. FECHAS BLOQUEADAS (BLOQUED DATES - CALENDARIO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocked_date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blocked dates visible to all" ON public.blocked_dates;
CREATE POLICY "Blocked dates visible to all" ON public.blocked_dates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage blocked dates" ON public.blocked_dates;
CREATE POLICY "Staff can manage blocked dates" ON public.blocked_dates
  FOR ALL USING (true);


-- ==============================================================================
-- 13. AGENDA DE CALENDARIO (CALENDAR EVENTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  workstation INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can manage calendar events" ON public.calendar_events;
CREATE POLICY "Staff can manage calendar events" ON public.calendar_events
  FOR ALL USING (true);


-- ==============================================================================
-- 14. BUCKET DE ALMACENAMIENTO DE EVIDENCIAS (STORAGE BUCKET)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public view for evidence" ON storage.objects;
CREATE POLICY "Public view for evidence" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidence');

DROP POLICY IF EXISTS "Authenticated insert for evidence" ON storage.objects;
CREATE POLICY "Authenticated insert for evidence" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'evidence');

DROP POLICY IF EXISTS "Authenticated update for evidence" ON storage.objects;
CREATE POLICY "Authenticated update for evidence" ON storage.objects
  FOR UPDATE USING (bucket_id = 'evidence');

DROP POLICY IF EXISTS "Authenticated delete for evidence" ON storage.objects;
CREATE POLICY "Authenticated delete for evidence" ON storage.objects
  FOR DELETE USING (bucket_id = 'evidence');

-- ==============================================================================
-- FIN DEL SCRIPT MAESTRO CONSOLIDADO
-- ==============================================================================
