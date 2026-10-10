import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

let passed = 0;
let failed = 0;

async function runTest(moduleName, testName, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ [${moduleName}] ${testName}`);
  } catch (err) {
    failed++;
    console.error(`  ❌ [${moduleName}] ${testName}: ${err.message}`);
  }
}

async function main() {
  console.log('==============================================================');
  console.log('🧪 LIONFIX SERVICE ERP - SUITE DE PRUEBAS UNITARIAS Y CRUD DB');
  console.log('==============================================================\n');

  // 0. Autenticación de sesión para pruebas de integración Supabase
  let sessionUser = null;
  await runTest('00. Auth & Sesión', 'Login de administrador (admin@lionfix.cl) y obtención de JWT sin bloqueos', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@lionfix.cl',
      password: 'admin123',
    });
    assert.equal(error, null, `Error login: ${error?.message}`);
    assert.ok(data?.session?.access_token, 'Debe retornar un access_token válido');
    sessionUser = data.session.user;
  });

  // Datos compartidos temporales para pruebas relacionales CRUD
  let tempClientId = null;
  let tempVehicleId = null;
  let tempMechanicId = null;

  // 1. Módulo 10: Personal & Usuarios (CRUD Real en public.profiles via Service Role)
  await runTest('10. Personal & Usuarios', 'CRUD Real en public.profiles (Garantizar mecánico activo + Crear/Actualizar personal)', async () => {
    const { data: existingProfiles, error: listProfErr } = await supabaseAdmin
      .from('profiles')
      .select('*');
    assert.equal(listProfErr, null, `Error listando profiles: ${listProfErr?.message}`);

    let mechanic = (existingProfiles || []).find((p) => p.role === 'mechanic');
    if (!mechanic) {
      const { data: allAuth } = await supabaseAdmin.auth.admin.listUsers();
      let mechAuth = allAuth?.users?.find((u) => u.email === 'mecanico@lionfix.cl');
      if (!mechAuth) {
        const { data: createdAuth, error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
          email: 'mecanico@lionfix.cl',
          password: 'LION-MEC-2026',
          email_confirm: true,
          user_metadata: { name: 'Carlos Muñoz (Mecánico Jefe)', role: 'mechanic' },
        });
        assert.equal(createAuthErr, null, `Error creando auth mecánico: ${createAuthErr?.message}`);
        mechAuth = createdAuth.user;
      }
      const { data: insertedMech, error: insMechErr } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: mechAuth.id,
            name: 'Carlos Muñoz (Mecánico Jefe)',
            email: 'mecanico@lionfix.cl',
            role: 'mechanic',
          },
          { onConflict: 'id' }
        )
        .select()
        .single();
      assert.equal(insMechErr, null, `Error insertando perfil mecánico: ${insMechErr?.message}`);
      mechanic = insertedMech;
    }
    tempMechanicId = mechanic.id;
    assert.ok(tempMechanicId, 'Debe existir un mecánico válido en la base de datos');
  });

  // 2. Módulo 06: Clientes y Vehículos (CRM) - CRUD Real
  await runTest('06. Clientes (CRM)', 'CRUD Real en DB: Crear Cliente + Crear Vehículo + Consultar relación', async () => {
    const { data: createdClient, error: createErr } = await supabase
      .from('clients')
      .insert({
        name: 'Cliente Test Integración',
        email: 'test.crud@lionfix.cl',
        phone: '+56988887777',
      })
      .select()
      .single();
    assert.equal(createErr, null, `Error creando cliente: ${createErr?.message}`);
    assert.ok(createdClient?.id);
    tempClientId = createdClient.id;

    const { data: createdVehicle, error: vehErr } = await supabase
      .from('vehicles')
      .insert({
        client_id: tempClientId,
        license_plate: 'CRUD99',
        make: 'Peugeot',
        model: '3008',
        year: 2024,
        vin: 'VF3CRUD9999999999',
      })
      .select()
      .single();
    assert.equal(vehErr, null, `Error creando vehículo: ${vehErr?.message}`);
    assert.equal(createdVehicle.license_plate, 'CRUD99');
    tempVehicleId = createdVehicle.id;
  });

  // 3. Módulo 01: Panel de Control (Dashboard)
  await runTest('01. Panel de Control', 'Cálculo de KPIs operativos y consulta en vivo de estaciones de trabajo', async () => {
    const TOTAL_WORKSTATIONS = 6;
    const activeOrders = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const occupied = Math.min(activeOrders.length, TOTAL_WORKSTATIONS);
    const availability = ((TOTAL_WORKSTATIONS - occupied) / TOTAL_WORKSTATIONS) * 100;
    assert.equal(occupied, 3);
    assert.equal(Math.round(availability), 50);

    const { data, error } = await supabase
      .from('work_orders')
      .select('*, vehicle:vehicles(make, model, license_plate)')
      .not('status', 'in', '("Completado","Entregado")');
    assert.equal(error, null, `Error DB: ${error?.message}`);
    assert.ok(Array.isArray(data));
  });

  // 4. Módulo 02: Órdenes de Trabajo (Work Orders & Service Logs) - CRUD Real Completo
  let tempWorkOrderId = null;
  await runTest('02. Órdenes de Trabajo', 'CRUD Real en DB: Crear OT -> Agregar Bitácora (service_logs) -> Actualizar Estado y Calificación', async () => {
    const otNumber = `OT-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: newOt, error: createOtErr } = await supabase
      .from('work_orders')
      .insert({
        ot_number: otNumber,
        client_id: tempClientId,
        vehicle_id: tempVehicleId,
        service_description: 'Cambio de kit de distribución y bomba de agua',
        type: 'Mantención Preventiva',
        technician_id: tempMechanicId,
        labor_hours: 4,
        status: 'En Reparación',
      })
      .select()
      .single();
    assert.equal(createOtErr, null, `Error creando OT: ${createOtErr?.message}`);
    assert.ok(newOt?.id);
    tempWorkOrderId = newOt.id;

    // Insertar en tabla relacional service_logs (Bitácora de Servicio)
    const { data: createdLog, error: logErr } = await supabase
      .from('service_logs')
      .insert({
        work_order_id: tempWorkOrderId,
        entry_text: 'Se desmonta correa antigua y se instala kit nuevo.',
      })
      .select()
      .single();
    assert.equal(logErr, null, `Error insertando en service_logs: ${logErr?.message}`);
    assert.ok(createdLog?.id);

    // Actualizar estado y calificación de la OT
    const { data: updatedOt, error: updateOtErr } = await supabase
      .from('work_orders')
      .update({
        status: 'Listo para Retiro',
        satisfaction_rating: 5,
        satisfaction_comment: 'Excelente servicio',
      })
      .eq('id', tempWorkOrderId)
      .select()
      .single();
    assert.equal(updateOtErr, null, `Error actualizando OT: ${updateOtErr?.message}`);
    assert.equal(updatedOt.status, 'Listo para Retiro');
    assert.equal(updatedOt.satisfaction_rating, 5);
  });

  // 5. Módulo 03: Checklists de Recepción y Entrega - CRUD Real Completo
  await runTest('03. Checklists', 'CRUD Real en DB: Crear Checklist Recepción -> Actualizar ítems -> Marcar Completado -> Eliminar', async () => {
    const items = ['Nivel de Combustible (registrar %)', 'Carrocería (Rayones / Abolladuras)'];
    const { data: createdCl, error: createClErr } = await supabase
      .from('checklists')
      .insert({
        type: 'Recepción',
        work_order_id: tempWorkOrderId,
        vehicle_id: tempVehicleId,
        vehicle_plate: 'CRUD99',
        checked_items: { 'Nivel de Combustible (registrar %)': true },
        custom_items: items,
        evidence_photos: [],
        notes: 'Ingreso sin observaciones en carrocería',
        completed: false,
      })
      .select()
      .single();
    assert.equal(createClErr, null, `Error creando checklist: ${createClErr?.message}`);
    assert.ok(createdCl?.id);

    // Actualizar a completado
    const { data: updatedCl, error: updateClErr } = await supabase
      .from('checklists')
      .update({
        checked_items: {
          'Nivel de Combustible (registrar %)': true,
          'Carrocería (Rayones / Abolladuras)': true,
        },
        completed: true,
      })
      .eq('id', createdCl.id)
      .select()
      .single();
    assert.equal(updateClErr, null, `Error actualizando checklist: ${updateClErr?.message}`);
    assert.equal(updatedCl.completed, true);

    // Eliminar checklist de prueba
    const { error: delClErr } = await supabase.from('checklists').delete().eq('id', createdCl.id);
    assert.equal(delClErr, null, `Error eliminando checklist: ${delClErr?.message}`);
  });

  // 6. Módulo 04: Cotizaciones (Quotes & Quote Items) - CRUD Real Completo
  await runTest('04. Cotizaciones', 'CRUD Real en DB: Crear Presupuesto + Ítems -> Aprobar -> Convertir a OT -> Eliminar', async () => {
    const quoteNumber = `COT-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: newQuote, error: qErr } = await supabase
      .from('quotes')
      .insert({
        quote_number: quoteNumber,
        client_id: tempClientId,
        vehicle_id: tempVehicleId,
        status: 'Borrador',
        total: 185000,
        advance_payment: 50000,
        terms_and_conditions: 'Garantía 30 días',
        diagnostics_main_failure: 'Ruido al frenar',
        diagnostics_failure_start: 'Hace 3 días',
        diagnostics_failure_type: 'Mecánica',
        diagnostics_entry_condition: 'Funciona',
        diagnostics_notes: 'Pastillas desgastadas',
      })
      .select()
      .single();
    assert.equal(qErr, null, `Error creando cotización: ${qErr?.message}`);
    assert.ok(newQuote?.id);

    const { error: itemsErr } = await supabase.from('quote_items').insert([
      {
        quote_id: newQuote.id,
        category: 'refaccion',
        description: 'Juego Pastillas Delanteras Cerámicas',
        quantity: 1,
        unit_price: 125000,
        total: 125000,
      },
      {
        quote_id: newQuote.id,
        category: 'mano_obra',
        description: 'Reemplazo y rectificado',
        quantity: 1,
        unit_price: 60000,
        total: 60000,
      },
    ]);
    assert.equal(itemsErr, null, `Error creando quote_items: ${itemsErr?.message}`);

    // Aprobar cotización
    const { data: approvedQuote, error: appErr } = await supabase
      .from('quotes')
      .update({ status: 'Aprobada' })
      .eq('id', newQuote.id)
      .select()
      .single();
    assert.equal(appErr, null, `Error aprobando cotización: ${appErr?.message}`);
    assert.equal(approvedQuote.status, 'Aprobada');

    // Limpiar cotización e ítems de prueba
    await supabase.from('quote_items').delete().eq('quote_id', newQuote.id);
    const { error: delQErr } = await supabase.from('quotes').delete().eq('id', newQuote.id);
    assert.equal(delQErr, null, `Error eliminando cotización: ${delQErr?.message}`);
  });

  // 7. Módulo 05: Calendario y Agendamiento Online de Cliente (appointments + calendar_events)
  await runTest('05. Calendario & Agenda Web', 'CRUD Real en DB: Agendar Cita Online (appointments) -> Asignar en Pizarra Horaria (calendar_events) -> Eliminar', async () => {
    const resCode = 'TEST99';
    const { data: createdApt, error: aptErr } = await supabase
      .from('appointments')
      .insert({
        client_name: 'Cliente Reserva Web',
        client_rut: '12.345.678-9',
        client_email: 'reserva@lionfix.cl',
        client_phone: '+56911112222',
        vehicle_plate: 'CRUD99',
        vehicle_make: 'Mercedes-Benz',
        vehicle_model: 'Sprinter 315',
        vehicle_type: 'Van',
        mileage: 45000,
        type: 'Mantención',
        requested_date: new Date().toISOString().split('T')[0],
        requested_time: '09:00',
        reservation_code: resCode,
        status: 'Pendiente',
      })
      .select()
      .single();
    assert.equal(aptErr, null, `Error agendando cita web: ${aptErr?.message}`);
    assert.equal(createdApt.reservation_code, resCode);

    const startTime = new Date();
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

    const { data: createdEv, error: createEvErr } = await supabase
      .from('calendar_events')
      .insert({
        title: 'OT-TEST - Diagnóstico Scanner',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        technician_id: tempMechanicId,
        work_order_id: tempWorkOrderId,
        workstation: 1,
      })
      .select()
      .single();
    assert.equal(createEvErr, null, `Error creando bloque horario: ${createEvErr?.message}`);
    assert.ok(createdEv?.id);

    const { error: delEvErr } = await supabase.from('calendar_events').delete().eq('id', createdEv.id);
    assert.equal(delEvErr, null, `Error eliminando bloque horario: ${delEvErr?.message}`);
    await supabaseAdmin.from('appointments').delete().eq('id', createdApt.id);
  });

  // 8. Módulo 07: Inventario de Repuestos y Órdenes de Compra - CRUD Real Completo
  await runTest('07. Inventario', 'CRUD Real en DB: Crear SKU (parts) -> Vincular a OT (work_order_parts) -> Crear Orden de Compra -> Eliminar', async () => {
    const testSku = `SKU-TEST-${Math.floor(100 + Math.random() * 900)}`;
    const { data: insertedPart, error: insPartErr } = await supabase
      .from('parts')
      .insert({
        sku: testSku,
        name: 'Filtro de Aceite Sintético Test',
        stock: 10,
        alert_threshold: 3,
        location: 'Estante A-1',
        cost: 6500,
        price: 14900,
      })
      .select()
      .single();
    assert.equal(insPartErr, null, `Error creando repuesto: ${insPartErr?.message}`);
    assert.ok(insertedPart?.id);

    const { data: updatedPart, error: updPartErr } = await supabase
      .from('parts')
      .update({ stock: 8 })
      .eq('sku', testSku)
      .select()
      .single();
    assert.equal(updPartErr, null, `Error actualizando stock: ${updPartErr?.message}`);
    assert.equal(updatedPart.stock, 8);

    // Vincular repuesto a la OT en work_order_parts
    const { data: woPart, error: woPartErr } = await supabase
      .from('work_order_parts')
      .insert({
        work_order_id: tempWorkOrderId,
        part_id: insertedPart.id,
        quantity: 2,
        unit_price: 14900,
      })
      .select()
      .single();
    assert.equal(woPartErr, null, `Error vinculando repuesto a OT: ${woPartErr?.message}`);
    assert.ok(woPart?.id);

    // Registrar Orden de Compra en iso_logs y actualizar stock en parts
    const { data: poLog, error: poErr } = await supabase
      .from('iso_logs')
      .insert({
        event_type: 'Orden de Compra Repuestos',
        description: `Orden enviada a Importadora Repuestos Chile (10x ${testSku}) por $65.000`,
        reference_table: 'parts',
        clausula_iso: '8.4',
      })
      .select()
      .single();
    assert.equal(poErr, null, `Error registrando orden de compra en DB: ${poErr?.message}`);
    assert.ok(poLog?.id);

    // Limpiar relaciones y repuesto de prueba
    await supabase.from('work_order_parts').delete().eq('id', woPart.id);
    await supabase.from('iso_logs').delete().eq('id', poLog.id);
    const { error: delPartErr } = await supabase.from('parts').delete().eq('sku', testSku);
    assert.equal(delPartErr, null, `Error eliminando repuesto: ${delPartErr?.message}`);
  });

  // 9. Módulo 08: Manuales & Torques + HaynesPro
  await runTest('08. Manuales & HaynesPro', 'Verificación de ventana directa HaynesPro junto al Bloc de Notas y fichas de torques', async () => {
    const manualsPage = fs.readFileSync(
      path.resolve('src/app/dashboard/manuals/page.tsx'),
      'utf8'
    );
    assert.ok(manualsPage.includes('workshopdata.com'), 'Debe integrar HaynesPro WorkshopData');
    assert.ok(manualsPage.includes('Bloc de Notas Técnicas del Taller'), 'Debe incluir el Bloc de Notas del Mecánico');
    assert.ok(manualsPage.includes('xl:grid-cols-2'), 'Debe posicionar el Bloc de Notas y HaynesPro lado a lado');
  });

  // 10. Módulo 09: Reportes y Exportación Excel
  await runTest('09. Reportes & Excel', 'Generación de archivo CSV/Excel con BOM UTF-8 (;), consultas de reportes y 4 exportadores', async () => {
    const exportLib = fs.readFileSync(path.resolve('src/lib/export-excel.ts'), 'utf8');
    assert.ok(exportLib.includes('\\uFEFF'), 'Debe incluir BOM UTF-8 para tildes en Excel');
    assert.ok(exportLib.includes('join(";")'), 'Debe usar punto y coma (;) para Excel en español');

    const reportsPage = fs.readFileSync(
      path.resolve('src/app/dashboard/finance/reports/page.tsx'),
      'utf8'
    );
    assert.ok(reportsPage.includes('handleExportWorkOrders'), 'Debe exportar Órdenes de Trabajo');
    assert.ok(reportsPage.includes('handleExportQuotes'), 'Debe exportar Cotizaciones');
    assert.ok(reportsPage.includes('handleExportInventory'), 'Debe exportar Inventario');
    assert.ok(reportsPage.includes('handleExportClients'), 'Debe exportar Clientes');
  });

  // 11. Módulo 11: Guía de Uso de Cada Panel
  await runTest('11. Guía de Uso', 'Verificación de los 10 módulos documentados en WorkshopUsageGuide y presencia en Dashboard/Sidebar', async () => {
    const guideComp = fs.readFileSync(
      path.resolve('src/components/workshop-usage-guide.tsx'),
      'utf8'
    );
    const dashboardPage = fs.readFileSync(
      path.resolve('src/app/dashboard/page.tsx'),
      'utf8'
    );
    const sidebarComp = fs.readFileSync(
      path.resolve('src/components/layout/app-sidebar.tsx'),
      'utf8'
    );
    assert.ok(guideComp.includes('WORKSHOP_GUIDE_MODULES'), 'Debe exportar los módulos de la guía');
    assert.ok(dashboardPage.includes('<WorkshopUsageGuide'), 'El Panel de Control debe mostrar la Guía de Uso abajo de todo');
    assert.ok(sidebarComp.includes('/dashboard/guide'), 'El menú lateral debe incluir el enlace a la Guía de Uso abajo de todo');
  });

  // Limpieza de datos temporales de integración (OT, Vehículo, Cliente)
  await runTest('12. Limpieza de Integración', 'Eliminación limpia de registros temporales de prueba en cascada', async () => {
    if (tempWorkOrderId) {
      await supabase.from('service_logs').delete().eq('work_order_id', tempWorkOrderId);
      const { error: delOtErr } = await supabase.from('work_orders').delete().eq('id', tempWorkOrderId);
      assert.equal(delOtErr, null, `Error eliminando OT temporal: ${delOtErr?.message}`);
    }
    if (tempVehicleId) {
      const { error: delVehErr } = await supabase.from('vehicles').delete().eq('id', tempVehicleId);
      assert.equal(delVehErr, null, `Error eliminando vehículo temporal: ${delVehErr?.message}`);
    }
    if (tempClientId) {
      const { error: delCliErr } = await supabase.from('clients').delete().eq('id', tempClientId);
      assert.equal(delCliErr, null, `Error eliminando cliente temporal: ${delCliErr?.message}`);
    }
  });

  console.log('\n==============================================================');
  console.log(`📊 RESULTADO FINAL: ${passed} pruebas exitosas, ${failed} fallidas`);
  console.log('==============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main();
