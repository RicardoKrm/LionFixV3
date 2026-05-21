-- ====================================================
-- PARTE 5: TABLA DE CHECKLISTS DE RECEPCIÓN Y ENTREGA
-- ====================================================
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.

-- Tabla principal de checklists (Recepción / Entrega)
CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('Recepción', 'Entrega')),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  vehicle_plate TEXT, -- desnormalizado para búsqueda rápida
  technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Items del checklist almacenados como JSONB (clave: nombre del ítem, valor: true/false)
  checked_items JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Habilitar RLS
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Admins can manage all checklists"
  ON public.checklists FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Mechanics can manage their checklists"
  ON public.checklists FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'mechanic')
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at al modificar un checklist
DROP TRIGGER IF EXISTS set_checklists_updated_at ON public.checklists;
CREATE TRIGGER set_checklists_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Vista de ejemplo: Checklists recientes con datos de vehículo y OT
-- (solo para referencia, no necesitas ejecutarla)
-- SELECT c.*, v.make, v.model, wo.ot_number 
-- FROM checklists c
-- LEFT JOIN vehicles v ON v.id = c.vehicle_id
-- LEFT JOIN work_orders wo ON wo.id = c.work_order_id
-- ORDER BY c.created_at DESC LIMIT 20;
