-- ============================================================
-- MIGRACIÓN: Actualización tabla checklists
-- Añade soporte para ítems dinámicos y evidencias fotográficas
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Columna para guardar los ítems personalizados del checklist (por modelo de vehículo)
ALTER TABLE public.checklists
  ADD COLUMN IF NOT EXISTS custom_items JSONB NOT NULL DEFAULT '[]';

-- Columna para guardar las fotos de evidencia con sus categorías
ALTER TABLE public.checklists
  ADD COLUMN IF NOT EXISTS evidence_photos JSONB NOT NULL DEFAULT '[]';

-- Confirmar cambios
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'checklists'
ORDER BY ordinal_position;
