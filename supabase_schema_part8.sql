-- ============================================================
-- PARTE 8: ACTUALIZACIÓN DE CALENDARIO PARA VINCULAR OTs
-- ============================================================
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE;

-- Confirmar cambios
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'calendar_events' AND column_name = 'work_order_id';
