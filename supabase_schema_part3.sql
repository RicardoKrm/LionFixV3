-- 1. Tabla de Cotizaciones
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT UNIQUE NOT NULL, -- Ej: COT-2024-001
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('Enviada', 'Aprobada', 'Rechazada', 'Borrador')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage quotes" ON quotes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Clients can view their own quotes" ON quotes FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = quotes.client_id AND clients.user_id = auth.uid())
);

-- 1.1 Ítems de Cotizaciones
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL
);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage quote items" ON quote_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Clients can view their own quote items" ON quote_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM quotes JOIN clients ON quotes.client_id = clients.id WHERE quotes.id = quote_items.quote_id AND clients.user_id = auth.uid())
);

-- 2. Contratos de Flota
CREATE TABLE fleet_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  vehicle_count INTEGER NOT NULL DEFAULT 0,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Activo', 'Vencido', 'Cancelado')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE fleet_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage fleet contracts" ON fleet_contracts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Clients can view their contracts" ON fleet_contracts FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE clients.id = fleet_contracts.client_id AND clients.user_id = auth.uid())
);

-- 3. Planes de Mantenimiento
CREATE TABLE maintenance_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL
);

ALTER TABLE maintenance_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view maintenance plans" ON maintenance_plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON maintenance_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE TABLE maintenance_plan_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES maintenance_plans(id) ON DELETE CASCADE,
  description TEXT NOT NULL
);

ALTER TABLE maintenance_plan_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view tasks" ON maintenance_plan_tasks FOR SELECT USING (true);
CREATE POLICY "Admins can manage tasks" ON maintenance_plan_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 4. Detalles Extendidos de Técnicos (Vinculado a profiles)
CREATE TABLE technician_details (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  specialties TEXT[], -- Arreglo de strings
  hire_date DATE,
  contact_phone TEXT,
  base_salary NUMERIC DEFAULT 0,
  extra_hour_rate NUMERIC DEFAULT 0,
  extra_hours_this_month INTEGER DEFAULT 0,
  max_extra_hours INTEGER DEFAULT 0
);

ALTER TABLE technician_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage tech details" ON technician_details FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Mechanics can view tech details" ON technician_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic'))
);

-- 5. Calendario de Eventos (Agenda)
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  workstation INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and mechanics can manage events" ON calendar_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'mechanic'))
);
