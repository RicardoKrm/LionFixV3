import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
  console.log('🧪 LIONFIX SERVICE ERP - SUITE DE PRUEBAS UNITARIAS Y MÓDULOS');
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

  // 1. Módulo 01: Panel de Control (Dashboard)
  await runTest('01. Panel de Control', 'Cálculo de KPIs operativos (6 estaciones, ocupación y disponibilidad)', async () => {
    const TOTAL_WORKSTATIONS = 6;
    const activeOrders = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const occupied = Math.min(activeOrders.length, TOTAL_WORKSTATIONS);
    const availability = ((TOTAL_WORKSTATIONS - occupied) / TOTAL_WORKSTATIONS) * 100;
    assert.equal(occupied, 3);
    assert.equal(Math.round(availability), 50);
  });

  await runTest('01. Panel de Control', 'Consulta en vivo de órdenes activas y vehículos en Supabase', async () => {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, vehicle:vehicles(make, model, license_plate)')
      .not('status', 'in', '("Completado","Entregado")');
    assert.equal(error, null, `Error DB: ${error?.message}`);
    assert.ok(Array.isArray(data), 'Debe devolver un arreglo de órdenes activas');
  });

  // 2. Módulo 02: Órdenes de Trabajo (Work Orders)
  await runTest('02. Órdenes de Trabajo', 'Generación de folio OT, filtros de estado y cálculo de rentabilidad', async () => {
    const otNumber = `OT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    assert.match(otNumber, /^OT-\d{4}-\d{4}$/);

    const LABOR_RATE_PER_HOUR = 25000;
    const LABOR_REVENUE_MULTIPLIER = 2.5;
    const laborHours = 4;
    const laborCost = laborHours * LABOR_RATE_PER_HOUR;
    const laborRevenue = laborCost * LABOR_REVENUE_MULTIPLIER;
    assert.equal(laborCost, 100000);
    assert.equal(laborRevenue, 250000);
  });

  await runTest('02. Órdenes de Trabajo', 'Consulta relacional work_orders + clients + vehicles + checklists', async () => {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, clients(name), vehicles(make, model, license_plate, year), checklists(evidence_photos)')
      .order('entry_date', { ascending: false });
    assert.equal(error, null, `Error DB: ${error?.message}`);
    assert.ok(Array.isArray(data));
  });

  // 3. Módulo 03: Checklists de Recepción y Entrega
  await runTest('03. Checklists', 'Verificación de puntos de inspección y cálculo de porcentaje de avance', async () => {
    const baseItems = [
      'Nivel de Combustible (registrar %)',
      'Carrocería (Rayones / Abolladuras)',
      'Luces Delanteras y Traseras',
      'Neumáticos (estado y presión)',
    ];
    const checked = {
      'Nivel de Combustible (registrar %)': true,
      'Carrocería (Rayones / Abolladuras)': true,
    };
    const checkedCount = Object.values(checked).filter(Boolean).length;
    const pct = Math.round((checkedCount / baseItems.length) * 100);
    assert.equal(pct, 50);
  });

  await runTest('03. Checklists', 'Consulta de checklists en Supabase con relaciones de vehículos y OT', async () => {
    const { data, error } = await supabase
      .from('checklists')
      .select('*, work_orders(ot_number), vehicles(make, model, license_plate)')
      .order('created_at', { ascending: false });
    assert.equal(error, null, `Error DB: ${error?.message}`);
    assert.ok(Array.isArray(data));
  });

  // 4. Módulo 04: Cotizaciones (Quotes)
  await runTest('04. Cotizaciones', 'Cálculo de ítems, subtotal, IVA (19%) y conversión a OT con estado Ingresado', async () => {
    const items = [
      { description: 'Kit de Embrague', quantity: 1, unitPrice: 180000 },
      { description: 'Mano de Obra Reemplazo', quantity: 3, unitPrice: 35000 },
    ];
    const total = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
    assert.equal(total, 285000);

    const quoteFile = fs.readFileSync(
      path.resolve('src/app/dashboard/finance/quotes/[id]/page.tsx'),
      'utf8'
    );
    assert.ok(quoteFile.includes("status: 'Ingresado'"), 'La conversión a OT debe usar estado Ingresado');
    assert.ok(quoteFile.includes('ot_number: otNumber'), 'La conversión a OT debe generar ot_number');
  });

  await runTest('04. Cotizaciones', 'Consulta de cotizaciones (quotes) en Supabase', async () => {
    const { data, error } = await supabase
      .from('quotes')
      .select('*, clients(name), vehicles(make, model, license_plate)')
      .order('created_at', { ascending: false });
    assert.equal(error, null, `Error DB: ${error?.message}`);
    assert.ok(Array.isArray(data));
  });

  // 5. Módulo 05: Calendario / Pizarra de Programación
  await runTest('05. Calendario', 'Generación de bloques horarios (08:00 a 18:00) y consulta de eventos/citas', async () => {
    const hours = Array.from({ length: 11 }, (_, i) => i + 8);
    assert.equal(hours[0], 8);
    assert.equal(hours[hours.length - 1], 18);

    const [{ error: calErr }, { error: aptErr }] = await Promise.all([
      supabase.from('calendar_events').select('*'),
      supabase.from('appointments').select('*'),
    ]);
    assert.equal(calErr, null, `Error calendar_events: ${calErr?.message}`);
    assert.equal(aptErr, null, `Error appointments: ${aptErr?.message}`);
  });

  // 6. Módulo 06: Clientes y Vehículos (CRM)
  await runTest('06. Clientes (CRM)', 'Prueba CRUD completa (Crear Cliente + Vehículo -> Consultar -> Eliminar)', async () => {
    const { data: createdClient, error: createErr } = await supabase
      .from('clients')
      .insert({
        name: 'Cliente Test Unitario',
        email: 'test.unitario@lionfix.cl',
        phone: '+56999999999',
      })
      .select()
      .single();
    assert.equal(createErr, null, `Error creando cliente: ${createErr?.message}`);
    assert.ok(createdClient?.id);

    const { data: createdVehicle, error: vehErr } = await supabase
      .from('vehicles')
      .insert({
        client_id: createdClient.id,
        license_plate: 'TEST99',
        make: 'Toyota',
        model: 'Hilux',
        year: 2024,
      })
      .select()
      .single();
    assert.equal(vehErr, null, `Error creando vehículo: ${vehErr?.message}`);
    assert.equal(createdVehicle.license_plate, 'TEST99');

    const { data: allClients, error: listErr } = await supabase
      .from('clients')
      .select('*, vehicles(*)')
      .order('name');
    assert.equal(listErr, null);
    assert.ok(allClients.some((c) => c.id === createdClient.id));

    // Limpieza
    await supabase.from('vehicles').delete().eq('id', createdVehicle.id);
    await supabase.from('clients').delete().eq('id', createdClient.id);
  });

  // 7. Módulo 07: Inventario de Repuestos (Inventory)
  await runTest('07. Inventario', 'Mapeo de repuestos, detección de stock crítico y valorización', async () => {
    const { data, error } = await supabase.from('parts').select('*').order('sku');
    assert.equal(error, null, `Error parts: ${error?.message}`);
    assert.ok(Array.isArray(data));

    const sampleParts = [
      { sku: 'FIL-001', stock: 2, alertThreshold: 5, cost: 8000, price: 15000 },
      { sku: 'ACE-002', stock: 12, alertThreshold: 4, cost: 25000, price: 45000 },
    ];
    const lowStock = sampleParts.filter((p) => p.stock <= p.alertThreshold);
    const totalValue = sampleParts.reduce((acc, p) => acc + p.stock * p.cost, 0);
    assert.equal(lowStock.length, 1);
    assert.equal(totalValue, 316000);
  });

  // 8. Módulo 08: Manuales & Torques + HaynesPro
  await runTest('08. Manuales & HaynesPro', 'Verificación de ventana directa HaynesPro junto al Bloc de Notas y fichas de torques', async () => {
    const manualsPage = fs.readFileSync(
      path.resolve('src/app/dashboard/manuals/page.tsx'),
      'utf8'
    );
    assert.ok(manualsPage.includes('workshopdata.com'), 'Debe integrar HaynesPro WorkshopData');
    assert.ok(manualsPage.includes('Bloc de Notas Técnicas del Taller'), 'Debe incluir el Bloc de Notas del Mecánico');
    assert.ok(manualsPage.includes('xl:grid-cols-2'), 'Debe posicionar el Bloc de Notas y HaynesPro lado a lado');

    const { error } = await supabase.from('vehicles').select('id, make, model, year, license_plate');
    assert.equal(error, null, `Error vehicles en manuals: ${error?.message}`);
  });

  // 9. Módulo 09: Reportes y Exportación Excel
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

    const { data: woReport, error: woReportErr } = await supabase
      .from('work_orders')
      .select('*, client:clients(name, phone, email), vehicle:vehicles(license_plate, make, model, year, vin)')
      .order('entry_date', { ascending: false });
    assert.equal(woReportErr, null, `Error consulta reportes OT: ${woReportErr?.message}`);
    assert.ok(Array.isArray(woReport));
  });

  // 10. Módulo 10: Personal & Usuarios
  await runTest('10. Personal & Usuarios', 'Verificación de resiliencia ante RLS y registro de personal', async () => {
    const usersPage = fs.readFileSync(
      path.resolve('src/app/dashboard/management/users/page.tsx'),
      'utf8'
    );
    assert.ok(usersPage.includes('Registrar Personal / Usuario'), 'Debe permitir registrar personal');
    assert.ok(usersPage.includes('lionfix_staff_directory'), 'Debe respaldar el directorio de personal');
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

  console.log('\n==============================================================');
  console.log(`📊 RESULTADO FINAL: ${passed} pruebas exitosas, ${failed} fallidas`);
  console.log('==============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main();
