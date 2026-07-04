-- 1. Create workshop_settings table
CREATE TABLE IF NOT EXISTS workshop_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    manager TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a default row if it's empty
INSERT INTO workshop_settings (name, manager, phone, address) 
SELECT 'Mi Taller', 'Administrador', '+56900000000', 'Dirección del Taller'
WHERE NOT EXISTS (SELECT 1 FROM workshop_settings);

-- Enable RLS for workshop_settings
ALTER TABLE workshop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read for workshop_settings" ON workshop_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin all for workshop_settings" ON workshop_settings FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- 2. Add columns to quotes table
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS diagnostics_main_failure TEXT,
ADD COLUMN IF NOT EXISTS diagnostics_failure_start TEXT,
ADD COLUMN IF NOT EXISTS diagnostics_failure_type TEXT,
ADD COLUMN IF NOT EXISTS diagnostics_entry_condition TEXT,
ADD COLUMN IF NOT EXISTS diagnostics_notes TEXT,
ADD COLUMN IF NOT EXISTS advance_payment NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,
ADD COLUMN IF NOT EXISTS signature_data_url TEXT;

-- 3. Add columns to quote_items table
ALTER TABLE quote_items
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'servicio';
