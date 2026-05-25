-- Create appointments table for Landing Page public bookings
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_rut TEXT,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    vehicle_plate TEXT NOT NULL,
    vehicle_make TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    vehicle_type TEXT,
    mileage INTEGER,
    type TEXT NOT NULL,
    requested_date DATE NOT NULL,
    requested_time TEXT,
    reservation_code TEXT,
    status TEXT DEFAULT 'Pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anyone can book from landing page)
CREATE POLICY "Allow public insert to appointments" ON public.appointments
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users (mechanics, admins) to read appointments
CREATE POLICY "Allow authenticated read appointments" ON public.appointments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update appointments
CREATE POLICY "Allow authenticated update appointments" ON public.appointments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Add appointment_id to calendar_events if it doesn't exist
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;
