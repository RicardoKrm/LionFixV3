-- ============================================================
-- EJECUTAR ESTE SQL EN EL EDITOR SQL DE SUPABASE
-- Dashboard Supabase → SQL Editor → New Query → Pegar y ejecutar
-- ============================================================

-- 1. Columnas faltantes en calendar_events
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;

-- 2. Columnas faltantes en quotes (items como JSONB, notes como texto)
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Columna email en profiles (si no existe)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 4. Columna user_id en clients (para enlazar cliente con auth user)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Política RLS: permitir que admin gestione todas las cotizaciones
-- (por si ya existía, la eliminamos y recreamos)
DROP POLICY IF EXISTS "Admins can manage quotes" ON public.quotes;
CREATE POLICY "Admins can manage quotes" ON public.quotes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic'))
  );

-- 6. Política RLS: clientes ven sus cotizaciones por user_id (más robusto)
DROP POLICY IF EXISTS "Clients can view their own quotes" ON public.quotes;
CREATE POLICY "Clients can view their own quotes" ON public.quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = quotes.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Confirmar cambios
SELECT 'SQL ejecutado exitosamente. Columnas añadidas.' AS resultado;
