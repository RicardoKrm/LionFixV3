-- Add work_order_id to calendar_events if it doesn't exist
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE;
