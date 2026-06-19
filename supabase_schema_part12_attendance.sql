-- Script para crear tablas de control de asistencia ZKTeco
CREATE TABLE public.employee_device_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    device_user_id TEXT NOT NULL UNIQUE, -- El ID que sale en la pantalla del ZKTeco (ej: 1, 2, 3)
    name_override TEXT, -- Nombre si es un externo que no tiene cuenta en la web
    base_salary NUMERIC DEFAULT 0, -- Sueldo base mensual
    work_hours_per_day NUMERIC DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_user_id TEXT NOT NULL REFERENCES public.employee_device_map(device_user_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- Fecha y hora exacta de la marcada
    punch_type TEXT DEFAULT 'UNKNOWN', -- IN (Entrada), OUT (Salida)
    sync_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(device_user_id, timestamp) -- Prevenir duplicados si el equipo manda la misma marcada 2 veces
);

-- Habilitar RLS
ALTER TABLE public.employee_device_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Mapas visibles para todos" ON public.employee_device_map FOR SELECT USING (true);
CREATE POLICY "Mapas modificables por todos" ON public.employee_device_map FOR ALL USING (true);

CREATE POLICY "Logs visibles para todos" ON public.attendance_logs FOR SELECT USING (true);
CREATE POLICY "Logs insertables vía API" ON public.attendance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Logs modificables" ON public.attendance_logs FOR UPDATE USING (true);
CREATE POLICY "Logs eliminables" ON public.attendance_logs FOR DELETE USING (true);
