-- ============================================================
-- PARTE 6: TABLA DE ÓRDENES DE COMPRA (INVENTARIO)
-- ============================================================
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- Requiere que la tabla 'parts' ya exista (del schema part 2).

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Enviada' CHECK (status IN ('Borrador', 'Enviada', 'Recibida', 'Cancelada')),
  notes TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage purchase orders"
  ON public.purchase_orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS set_purchase_orders_updated_at ON public.purchase_orders;
CREATE TRIGGER set_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- PARTE 6b: FUNCIÓN ISO 9001 — trigger automático en OTs
-- ============================================================
-- Esta función registra automáticamente en iso_logs cuando una OT
-- cambia de estado (trazabilidad ISO 9001 cláusula 8.5)

CREATE OR REPLACE FUNCTION public.log_work_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar cuando el estado cambia
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.iso_logs (event_type, description, clausula_iso, reference_id)
    VALUES (
      'Cambio de Estado OT',
      'OT ' || COALESCE(NEW.ot_number, NEW.id::TEXT) ||
        ': cambió de "' || COALESCE(OLD.status, 'N/A') || '" a "' || NEW.status || '"',
      '8.5 - Control de producción y provisión del servicio',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_work_order_status ON public.work_orders;
CREATE TRIGGER trg_log_work_order_status
  AFTER UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_work_order_status_change();

-- Función para registrar creación de clientes en ISO logs
CREATE OR REPLACE FUNCTION public.log_client_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.iso_logs (event_type, description, clausula_iso, reference_id)
  VALUES (
    'Cliente Registrado',
    'Nuevo cliente "' || NEW.name || '" registrado en el sistema.',
    '8.2 - Determinación de los requisitos del cliente',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_client_created ON public.clients;
CREATE TRIGGER trg_log_client_created
  AFTER INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.log_client_created();

-- Función para registrar checklists completados
CREATE OR REPLACE FUNCTION public.log_checklist_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed IS DISTINCT FROM NEW.completed) THEN
    INSERT INTO public.iso_logs (event_type, description, clausula_iso, reference_id)
    VALUES (
      'Checklist Completado',
      'Checklist de "' || NEW.type || '" completado para vehículo ' || COALESCE(NEW.vehicle_plate, 'N/A') || '.',
      '8.5.1 - Control de la producción y de la provisión del servicio',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_checklist_completed ON public.checklists;
CREATE TRIGGER trg_log_checklist_completed
  AFTER UPDATE ON public.checklists
  FOR EACH ROW EXECUTE FUNCTION public.log_checklist_completed();
