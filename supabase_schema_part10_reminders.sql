CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  send_date TIMESTAMP WITH TIME ZONE NOT NULL,
  last_service_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'Programada',
  channel VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir a los administradores todo el acceso
CREATE POLICY "Allow all actions for authenticated users on reminders" 
ON public.reminders
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
