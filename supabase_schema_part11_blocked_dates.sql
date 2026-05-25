-- Script para crear la tabla de fechas bloqueadas
CREATE TABLE public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocked_date DATE NOT NULL UNIQUE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Fechas bloqueadas son visibles para todos" ON public.blocked_dates FOR SELECT USING (true);
CREATE POLICY "Fechas bloqueadas pueden ser insertadas por anon/auth" ON public.blocked_dates FOR INSERT WITH CHECK (true);
CREATE POLICY "Fechas bloqueadas pueden ser actualizadas por anon/auth" ON public.blocked_dates FOR UPDATE USING (true);
CREATE POLICY "Fechas bloqueadas pueden ser eliminadas por anon/auth" ON public.blocked_dates FOR DELETE USING (true);
