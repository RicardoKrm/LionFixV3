-- ====================================================
-- PARTE 15: ESTADO PAUSADO PARA OTs
-- ====================================================

DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Encontrar el nombre del constraint de la columna status en work_orders
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.work_orders'::regclass
      AND pg_get_constraintdef(oid) LIKE '%status%';

    -- Si existe, eliminarlo
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.work_orders DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Crear el nuevo constraint con el estado 'Pausado'
ALTER TABLE public.work_orders 
ADD CONSTRAINT work_orders_status_check 
CHECK (status IN ('Ingresado', 'En Diagnóstico', 'Esperando Aprobación', 'Esperando Repuestos', 'En Reparación', 'Pausado', 'Listo para Retiro', 'Entregado', 'Cancelado'));
