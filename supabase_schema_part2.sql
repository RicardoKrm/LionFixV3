-- 1. Tabla de Inventario (Repuestos)
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  alert_threshold INTEGER NOT NULL DEFAULT 5,
  location TEXT,
  cost NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage parts" ON parts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Mechanics can read parts" ON parts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic'))
);

-- 2. Tabla de Órdenes de Trabajo (OT)
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ot_number TEXT UNIQUE NOT NULL, -- ej: OT-2024-001
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  service_description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Mantención Preventiva', 'Mantención Correctiva', 'Diagnóstico')),
  status TEXT NOT NULL CHECK (status IN ('Ingresado', 'En Diagnóstico', 'Esperando Aprobación', 'Esperando Repuestos', 'En Reparación', 'Listo para Retiro', 'Entregado', 'Cancelado')),
  technician_id UUID REFERENCES profiles(id),
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completion_date TIMESTAMP WITH TIME ZONE,
  labor_hours NUMERIC DEFAULT 0,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_comment TEXT,
  final_report TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all OTs" ON work_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Mechanics update OTs" ON work_orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'mechanic')
);
CREATE POLICY "Mechanics view assigned OTs" ON work_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic'))
);

-- 3. Tabla de Relación: Repuestos consumidos en una OT
CREATE TABLE work_order_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE work_order_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and Mechanics manage OT parts" ON work_order_parts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic'))
);

-- 4. Tabla de Log / Historial de Tareas de la OT (Timeline)
CREATE TABLE service_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entry_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and Mechanics manage service logs" ON service_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic'))
);
