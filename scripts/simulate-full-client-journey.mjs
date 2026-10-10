import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

async function simulateClientJourney() {
  console.log('===================================================================');
  console.log('🚗 SIMULACIÓN REAL DE USUARIO (CLIENTE DE PRINCIPIO A FIN EN DB)');
  console.log('===================================================================\n');

  const todayDateStr = new Date().toISOString().split('T')[0];

  // 0. Obtener el mecánico jefe (Carlos Muñoz)
  const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
  let mechanic = (profiles || []).find((p) => p.role === 'mechanic');
  if (!mechanic) {
    throw new Error('No se encontró perfil de mecánico en public.profiles');
  }
  console.log(`👨‍🔧 Mecánico Asignado: ${mechanic.name} (${mechanic.email})`);

  // 1. Crear Cuenta de Portal para el Cliente (auth.users + profiles + clients)
  const clientEmail = 'roberto.soto@transportesandes.cl';
  const { data: allAuth } = await supabaseAdmin.auth.admin.listUsers();
  let clientAuth = allAuth?.users?.find((u) => u.email === clientEmail);
  if (!clientAuth) {
    const { data: createdUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: clientEmail,
      password: 'cliente123',
      email_confirm: true,
      user_metadata: { name: 'Roberto Matías Soto Valdés', role: 'client' },
    });
    if (authErr) throw authErr;
    clientAuth = createdUser.user;
  }

  await supabaseAdmin.from('profiles').upsert(
    {
      id: clientAuth.id,
      name: 'Roberto Matías Soto Valdés',
      email: clientEmail,
      role: 'client',
    },
    { onConflict: 'id' }
  );

  // Limpiar registros previos de esta simulación si existieran para evitar duplicados de patente/SKU
  await supabaseAdmin.from('appointments').delete().eq('reservation_code', 'LION42');
  await supabaseAdmin.from('vehicles').delete().in('license_plate', ['SP-RT-42', 'AN-DS-88']);
  await supabaseAdmin.from('clients').delete().eq('email', clientEmail);

  // 2. PASO 1: El cliente agenda su cita online desde la Landing Page (tabla appointments)
  const { data: appointment, error: aptErr } = await supabaseAdmin
    .from('appointments')
    .insert({
      client_name: 'Roberto Matías Soto Valdés',
      client_rut: '16.842.910-K',
      client_email: clientEmail,
      client_phone: '+56994827163',
      vehicle_plate: 'SP-RT-42',
      vehicle_make: 'Mercedes-Benz',
      vehicle_model: 'Sprinter 415',
      vehicle_type: 'Van',
      mileage: 68500,
      type: 'Mantención y Embrague',
      requested_date: todayDateStr,
      requested_time: '09:00',
      reservation_code: 'LION42',
      status: 'Confirmado',
    })
    .select()
    .single();
  if (aptErr) throw aptErr;
  console.log(`✅ [PASO 1 - Agendamiento Web] Reserva creada: Código #${appointment.reservation_code} | Patente: ${appointment.vehicle_plate}`);

  // 3. PASO 2A: Registro en CRM (Cliente + Vehículos) al llegar al taller
  const { data: client, error: cliErr } = await supabaseAdmin
    .from('clients')
    .insert({
      name: 'Roberto Matías Soto Valdés (Transportes Andes)',
      email: clientEmail,
      phone: '+56994827163',
      user_id: clientAuth.id,
    })
    .select()
    .single();
  if (cliErr) throw cliErr;

  const { data: vehicleSprinter, error: v1Err } = await supabaseAdmin
    .from('vehicles')
    .insert({
      client_id: client.id,
      license_plate: 'SP-RT-42',
      make: 'Mercedes-Benz',
      model: 'Sprinter 415 CDI',
      year: 2023,
      vin: 'WDB9076431P384920',
      motor_number: 'OM651-984512',
    })
    .select()
    .single();
  if (v1Err) throw v1Err;

  const { data: vehicleHilux, error: v2Err } = await supabaseAdmin
    .from('vehicles')
    .insert({
      client_id: client.id,
      license_plate: 'AN-DS-88',
      make: 'Toyota',
      model: 'Hilux 2.8 D-4D 4x4',
      year: 2024,
      vin: '8AJBA3CD001928374',
      motor_number: '1GD-883721',
    })
    .select()
    .single();
  if (v2Err) throw v2Err;
  console.log(`✅ [PASO 2A - CRM Clientes y Vehículos] Cliente "${client.name}" registrado con vehículos SP-RT-42 y AN-DS-88`);

  // 4. Asegurar Repuestos Reales en Inventario (tabla parts)
  const partsCatalog = [
    {
      sku: 'KIT-EMB-907',
      name: 'Kit de Embrague Bimasa LUK Mercedes Sprinter OM651',
      stock: 4,
      alert_threshold: 2,
      location: 'Pasillo A - Estante 2',
      cost: 240000,
      price: 380000,
    },
    {
      sku: 'ACE-5W30-MB',
      name: 'Aceite Sintético 5W-30 Low SAPS MB 229.52 (Bidón 5L)',
      stock: 14,
      alert_threshold: 5,
      location: 'Bodega Lubricantes B1',
      cost: 32000,
      price: 58000,
    },
    {
      sku: 'FIL-ACE-651',
      name: 'Filtro de Aceite Original Mann-Filter HU 7008 z (OM651)',
      stock: 9,
      alert_threshold: 4,
      location: 'Pasillo B - Estante 1',
      cost: 9500,
      price: 19000,
    },
    {
      sku: 'PAST-FRE-907',
      name: 'Juego Pastillas de Freno Delanteras Brembo Sprinter / Hilux',
      stock: 3,
      alert_threshold: 4,
      location: 'Pasillo C - Estante 3',
      cost: 42000,
      price: 78000,
    },
  ];

  const insertedParts = {};
  for (const p of partsCatalog) {
    const { data: upsertedPart, error: pErr } = await supabaseAdmin
      .from('parts')
      .upsert(p, { onConflict: 'sku' })
      .select()
      .single();
    if (pErr) throw pErr;
    insertedParts[p.sku] = upsertedPart;
  }
  console.log(`✅ [Inventario] 4 repuestos técnicos sincronizados en bodega.`);

  // 5. PASO 3: Cotización / Presupuesto Digital emitido y Aprobado por el Cliente (quotes + quote_items)
  await supabaseAdmin.from('quotes').delete().in('quote_number', ['COT-2026-101', 'COT-2026-102']);

  const { data: quote, error: qErr } = await supabaseAdmin
    .from('quotes')
    .insert({
      quote_number: 'COT-2026-101',
      client_id: client.id,
      vehicle_id: vehicleSprinter.id,
      status: 'Aprobada',
      total: 673000,
      advance_payment: 300000,
      notes: 'Cliente aprueba presupuesto vía enlace WhatsApp. Solicita entrega el mismo día.',
      diagnostics_main_failure: 'Vibración en pedal de embrague al salir en 1ra marcha y aviso de mantención de 70.000 km.',
      diagnostics_failure_start: 'Hace 1 semana en ruta Santiago - Rancagua',
      diagnostics_failure_type: 'Mecánica',
      diagnostics_entry_condition: 'Llega rodando por sus propios medios, nivel de combustible 75%.',
      diagnostics_notes: 'Se verifica desgaste en volante bimasa y disco de embrague. Se incluye cambio de aceite MB 229.52 (11.5L) y filtro.',
      terms_and_conditions:
        '1. Presupuesto aprobado digitalmente por Roberto Matías Soto Valdés.\n2. Garantía de 6 meses o 10.000 km en kit de embrague.\n3. Repuestos originales / OEM certificados.',
    })
    .select()
    .single();
  if (qErr) throw qErr;

  const { error: qiErr } = await supabaseAdmin.from('quote_items').insert([
    {
      quote_id: quote.id,
      category: 'servicio',
      description: 'Diagnóstico Electrónico Scanner Xentry + Prueba de Actuadores',
      quantity: 1,
      unit_price: 35000,
      total: 35000,
    },
    {
      quote_id: quote.id,
      category: 'refaccion',
      description: 'Kit de Embrague Bimasa LUK Mercedes Sprinter OM651 (SKU: KIT-EMB-907)',
      quantity: 1,
      unit_price: 380000,
      total: 380000,
    },
    {
      quote_id: quote.id,
      category: 'refaccion',
      description: 'Aceite Sintético 5W-30 MB 229.52 x2 Bidones + Filtro Original (SKU: ACE-5W30-MB / FIL-ACE-651)',
      quantity: 1,
      unit_price: 135000,
      total: 135000,
    },
    {
      quote_id: quote.id,
      category: 'mano_obra',
      description: 'Mano de Obra Desmontaje Caja 6 Vel, Reemplazo Kit Embrague y Mantención (5 hrs)',
      quantity: 1,
      unit_price: 123000,
      total: 123000,
    },
  ]);
  if (qiErr) throw qiErr;
  console.log(`✅ [PASO 3 - Cotización Digital] Presupuesto ${quote.quote_number} ($673.000) creado y marcado como APROBADO.`);

  // 6. PASO 4 y 5: Orden de Trabajo #1 (Ciclo Completo Finalizado y Entregado con Encuesta 5 Estrellas)
  await supabaseAdmin.from('work_orders').delete().in('ot_number', ['OT-2026-1042', 'OT-2026-1043']);

  const entryTime1 = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const completionTime1 = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: woCompleted, error: wo1Err } = await supabaseAdmin
    .from('work_orders')
    .insert({
      ot_number: 'OT-2026-1042',
      client_id: client.id,
      vehicle_id: vehicleSprinter.id,
      service_description: 'Reemplazo Kit Embrague Bimasa LUK + Mantención 70.000 km (OM651)',
      type: 'Mantención Correctiva',
      status: 'Entregado',
      technician_id: mechanic.id,
      entry_date: entryTime1,
      completion_date: completionTime1,
      labor_hours: 5,
      satisfaction_rating: 5,
      satisfaction_comment:
        'Excelente atención en LionFix. Agendé por la web, me enviaron el presupuesto al WhatsApp y la Sprinter quedó impecable. Muy transparente el checklist con fotos.',
      final_report:
        'TRABAJO FINALIZADO:\n1. Se desmontó caja de cambios manual de 6 velocidades.\n2. Se reemplazó volante bimasa, prensa, disco y rodamiento de empuje LUK aplicando torque oficial HaynesPro (Pernos volante: 45 Nm + 90°).\n3. Se realizó cambio de aceite motor 5W-30 MB 229.52 (11.5 L) y filtro original.\n4. Prueba de ruta de 15 km sin vibraciones ni códigos DTC activos.',
    })
    .select()
    .single();
  if (wo1Err) throw wo1Err;

  // Vincular repuestos consumidos en work_order_parts para OT-2026-1042
  await supabaseAdmin.from('work_order_parts').insert([
    {
      work_order_id: woCompleted.id,
      part_id: insertedParts['KIT-EMB-907'].id,
      quantity: 1,
      unit_price: 380000,
    },
    {
      work_order_id: woCompleted.id,
      part_id: insertedParts['ACE-5W30-MB'].id,
      quantity: 2,
      unit_price: 58000,
    },
    {
      work_order_id: woCompleted.id,
      part_id: insertedParts['FIL-ACE-651'].id,
      quantity: 1,
      unit_price: 19000,
    },
  ]);

  // Bitácora cronológica en service_logs para OT-2026-1042
  await supabaseAdmin.from('service_logs').insert([
    {
      work_order_id: woCompleted.id,
      technician_id: mechanic.id,
      entry_text: '09:15 hrs - Ingreso de Sprinter SP-RT-42 a Estación #1. Escaneo OBD-II inicial sin fallas electrónicas; se confirma desgaste mecánico en conjunto de embrague.',
    },
    {
      work_order_id: woCompleted.id,
      technician_id: mechanic.id,
      entry_text: '11:30 hrs - Desmontaje de transmisión completado. Se instala Kit de Embrague Bimasa LUK nuevo verificando pares de apriete en módulo Manuales & HaynesPro (45 Nm + 90° en volante).',
    },
    {
      work_order_id: woCompleted.id,
      technician_id: mechanic.id,
      entry_text: '13:45 hrs - Drenaje y llenado de aceite sintético 5W-30 MB 229.52 (11.5 Litros) + filtro Mann. Tapón de cárter torqueado a 30 Nm.',
    },
    {
      work_order_id: woCompleted.id,
      technician_id: mechanic.id,
      entry_text: '14:40 hrs - Prueba de ruta exitosa. Pedal suave, cambios precisos. Pasa a lavado de cortesía y Checklist de Entrega.',
    },
  ]);

  // Checklists de Recepción y de Entrega para SP-RT-42 (OT-2026-1042)
  const receptionItems = [
    'Nivel de Combustible (registrar %)',
    'Carrocería (Rayones / Abolladuras)',
    'Luces Delanteras y Traseras',
    'Vidrios y Parabrisas (sin grietas)',
    'Neumáticos (estado y presión)',
    'Estado de Espejos',
    'Documentos del Vehículo (revisión técnica, seguro)',
    'Objetos de Valor dentro del vehículo',
    'Nivel de Aceite Motor',
    'Nivel de Líquido Refrigerante',
  ];
  const receptionChecked = Object.fromEntries(receptionItems.map((i) => [i, true]));

  const deliveryItems = [
    'Reparación solicitada completada correctamente',
    'Limpieza del vehículo (interior y exterior)',
    'Documentación del servicio entregada al cliente',
    'Sin rayones nuevos en carrocería',
    'Luces funcionando correctamente',
    'Niveles de fluidos revisados y completados',
    'Objetos del cliente devueltos',
    'Boleta / Factura emitida',
  ];
  const deliveryChecked = Object.fromEntries(deliveryItems.map((i) => [i, true]));

  await supabaseAdmin.from('checklists').insert([
    {
      type: 'Recepción',
      work_order_id: woCompleted.id,
      vehicle_id: vehicleSprinter.id,
      vehicle_plate: 'SP-RT-42',
      technician_id: mechanic.id,
      checked_items: receptionChecked,
      custom_items: receptionItems,
      evidence_photos: [
        {
          url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80',
          name: 'Recepcion_Sprinter_Frontal.jpg',
          category: 'portada',
        },
        {
          url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=900&q=80',
          name: 'Inspeccion_Motor_OM651.jpg',
          category: 'entrada',
        },
      ],
      notes: 'Recepción conforme con Sr. Roberto Soto. Combustible al 75%, documentos al día, sin abolladuras.',
      completed: true,
    },
    {
      type: 'Entrega',
      work_order_id: woCompleted.id,
      vehicle_id: vehicleSprinter.id,
      vehicle_plate: 'SP-RT-42',
      technician_id: mechanic.id,
      checked_items: deliveryChecked,
      custom_items: deliveryItems,
      evidence_photos: [
        {
          url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80',
          name: 'Entrega_Sprinter_Lista.jpg',
          category: 'salida',
        },
      ],
      notes: 'Vehículo entregado limpio, con repuestos antiguos mostrados al cliente y factura emitida. Cliente califica con 5 estrellas.',
      completed: true,
    },
  ]);
  console.log(`✅ [PASO 4 y 5 - OT Completada + Checklists + Encuesta 5⭐] OT-2026-1042 creada con bitácora, repuestos y checklists de Recepción y Entrega.`);

  // 7. Orden de Trabajo #2 ACTIVA (En Reparación) para que el Panel de Control (Estación #1), Órdenes Activas y Calendario de Hoy se vean en plena operación
  const { data: woActive, error: wo2Err } = await supabaseAdmin
    .from('work_orders')
    .insert({
      ot_number: 'OT-2026-1043',
      client_id: client.id,
      vehicle_id: vehicleHilux.id,
      service_description: 'Frenos Delanteros Brembo + Diagnóstico Inyección D-4D (1GD-FTV)',
      type: 'Mantención Preventiva',
      status: 'En Reparación',
      technician_id: mechanic.id,
      labor_hours: 3,
    })
    .select()
    .single();
  if (wo2Err) throw wo2Err;

  await supabaseAdmin.from('work_order_parts').insert([
    {
      work_order_id: woActive.id,
      part_id: insertedParts['PAST-FRE-907'].id,
      quantity: 1,
      unit_price: 78000,
    },
    {
      work_order_id: woActive.id,
      part_id: insertedParts['ACE-5W30-MB'].id,
      quantity: 2,
      unit_price: 58000,
    },
  ]);

  await supabaseAdmin.from('service_logs').insert([
    {
      work_order_id: woActive.id,
      technician_id: mechanic.id,
      entry_text: 'Vehículo ingresado a Estación #1. Se mide espesor de discos delanteros (27.4 mm OK) y se instalan pastillas Brembo nuevas.',
    },
    {
      work_order_id: woActive.id,
      technician_id: mechanic.id,
      entry_text: 'Se aplica torque de ruedas de 105 Nm según ficha técnica Toyota Hilux en módulo Manuales & Torques.',
    },
  ]);

  await supabaseAdmin.from('checklists').insert({
    type: 'Recepción',
    work_order_id: woActive.id,
    vehicle_id: vehicleHilux.id,
    vehicle_plate: 'AN-DS-88',
    technician_id: mechanic.id,
    checked_items: receptionChecked,
    custom_items: receptionItems,
    evidence_photos: [
      {
        url: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=900&q=80',
        name: 'Hilux_En_Estacion_1.jpg',
        category: 'portada',
      },
    ],
    notes: 'Segunda unidad de Transportes Andes (Roberto Soto) en mantención activa en Estación #1.',
    completed: true,
  });

  // 8. Programar en Pizarra Horaria del Calendario de Hoy (calendar_events)
  const startApt = new Date();
  startApt.setHours(9, 0, 0, 0);
  const endApt = new Date();
  endApt.setHours(12, 0, 0, 0);

  const startOt = new Date();
  startOt.setHours(14, 0, 0, 0);
  const endOt = new Date();
  endOt.setHours(17, 0, 0, 0);

  await supabaseAdmin.from('calendar_events').insert([
    {
      title: 'AGENDA - SP-RT-42 (Roberto Soto)',
      start_time: startApt.toISOString(),
      end_time: endApt.toISOString(),
      technician_id: mechanic.id,
      appointment_id: appointment.id,
      workstation: 1,
    },
    {
      title: 'OT-2026-1043 - Frenos y Diagnóstico Hilux AN-DS-88',
      start_time: startOt.toISOString(),
      end_time: endOt.toISOString(),
      technician_id: mechanic.id,
      work_order_id: woActive.id,
      workstation: 1,
    },
  ]);

  console.log(`✅ [Calendario y Panel de Control] Eventos programados hoy para ${mechanic.name} y Estación #1 activa.`);
  console.log('\n===================================================================');
  console.log('🎉 SIMULACIÓN COMPLETA GUARDADA EN PRODUCCIÓN (SUPABASE)');
  console.log('===================================================================');
}

simulateClientJourney().catch((err) => {
  console.error('❌ Error en simulación:', err);
  process.exit(1);
});
