import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Iniciando inyección de datos de prueba en Supabase...");

  // 1. Crear un Cliente de prueba (omitiendo user_id de Auth por ahora)
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .insert({
      name: 'Cliente Prueba Minería',
      email: 'mineria@prueba.com',
      phone: '+56912345678'
    })
    .select()
    .single();

  if (clientErr) throw clientErr;
  console.log("Cliente creado:", client.id);

  // 2. Crear un Vehículo asociado
  const { data: vehicle, error: vehicleErr } = await supabase
    .from('vehicles')
    .insert({
      client_id: client.id,
      license_plate: 'XW-VU-87',
      make: 'Mercedes-Benz',
      model: 'Sprinter 315 CDI',
      year: 2023,
      vin: 'WDB1234567890ABCD',
      motor_number: 'OM651-123'
    })
    .select()
    .single();

  if (vehicleErr) throw vehicleErr;
  console.log("Vehículo creado:", vehicle.id);

  // 3. Crear OT Activa
  const { error: otErr } = await supabase
    .from('work_orders')
    .insert({
      ot_number: 'OT-2024-001',
      client_id: client.id,
      vehicle_id: vehicle.id,
      service_description: 'Mantención Correctiva Motor (Ruido)',
      type: 'Mantención Correctiva',
      status: 'En Reparación'
    });

  if (otErr) throw otErr;
  console.log("Orden de Trabajo creada exitosamente.");

  console.log("¡Base de datos sembrada con éxito! Puedes recargar el Dashboard.");
}

seed().catch(console.error);
