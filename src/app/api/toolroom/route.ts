import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dvfrxjvzxidnbzbbacxi.supabase.co";

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  [
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZnJ4anZ6eGlkbmJ6YmJhY3hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg4MDUzNSwiZXhwIjoyMDk3NDU2NTM1fQ",
    "SgjIVf7kRYtDo9yDxaOpOPV1rDIHssy5zSxfvpJK4vc",
  ].join(".");

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const TABLE_TOOLS = "panol_herramientas";
const TABLE_MOVEMENTS = "panol_movimientos";
const TABLE_REPLACEMENTS = "panol_reposiciones";

function parseRow(row: any) {
  try {
    const parsed = JSON.parse(row.description || "{}");
    return {
      ...parsed,
      id: row.id,
      createdAt: row.created_at,
    };
  } catch {
    return null;
  }
}

async function seedDefaultToolroomDataIfEmpty() {
  const { data: existing } = await supabaseAdmin
    .from("iso_logs")
    .select("id")
    .eq("reference_table", TABLE_TOOLS)
    .limit(1);

  if (existing && existing.length > 0) return;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const nextYearStr = new Date(today.getTime() + 330 * 86400000).toISOString().split("T")[0];
  const soonExpireStr = new Date(today.getTime() + 18 * 86400000).toISOString().split("T")[0];
  const expiredStr = new Date(today.getTime() - 12 * 86400000).toISOString().split("T")[0];

  const initialTools = [
    {
      code: "HER-TORQ-01",
      name: "Llave Dinamométrica Digital 20-200 Nm (1/2\")",
      brand: "Gedore / Snap-on",
      category: "Precisión y Torque",
      location: "Gabinete Calibrado A-1",
      status: "Disponible",
      condition: "Óptima",
      assignedToName: null,
      workOrderFolio: null,
      lastCheckoutAt: new Date(today.getTime() - 3 * 3600000).toISOString(),
      lastCheckinAt: new Date(today.getTime() - 1 * 3600000).toISOString(),
      requiresCert: true,
      certStatus: "Vigente",
      certNumber: "CERT-ISO-2026-089",
      certLab: "LabMet Metrología Chile",
      certIssuedAt: todayStr,
      certExpiresAt: nextYearStr,
      cost: 285000,
      supplier: " Würth / Gedore Chile",
      notes: "Utilizada para apriete de culata y ruedas Sprinter (180 Nm). Guardar siempre en cero.",
    },
    {
      code: "HER-SCAN-01",
      name: "Scanner Multimarca Launch X431 PRO3S+ HD",
      brand: "Launch Tech",
      category: "Diagnóstico Electrónico",
      location: "Casillero Electrónica B-1",
      status: "En Uso",
      condition: "Óptima",
      assignedToName: "Carlos Muñoz",
      workOrderFolio: "OT-2026-1043",
      lastCheckoutAt: new Date(today.getTime() - 2 * 3600000).toISOString(),
      lastCheckinAt: null,
      requiresCert: true,
      certStatus: "Vigente",
      certNumber: "LIC-SW-2026-441",
      certLab: "Launch Oficial Sudamérica",
      certIssuedAt: todayStr,
      certExpiresAt: nextYearStr,
      cost: 1450000,
      supplier: "Importadora Diagnóstico Pro",
      notes: "Incluye maletín con adaptadores OBD-II y módulo Heavy Duty 24V.",
    },
    {
      code: "HER-EXTR-03",
      name: "Kit Extractor Hidráulico de Inyectores Common Rail OM651 / 1GD",
      brand: "Pichler / Klann",
      category: "Herramienta Especial Motor",
      location: "Estante Motores C-2",
      status: "Disponible",
      condition: "Óptima",
      assignedToName: null,
      workOrderFolio: null,
      lastCheckoutAt: null,
      lastCheckinAt: today.toISOString(),
      requiresCert: false,
      certStatus: "No Requiere",
      certNumber: null,
      certLab: null,
      certIssuedAt: null,
      certExpiresAt: null,
      cost: 420000,
      supplier: "Herramientas Especiales Sur",
      notes: "Verificar limpieza de roscas M17x1.0 al recepcionar en pañol.",
    },
    {
      code: "HER-MANO-02",
      name: "Compresímetro y Medidor de Presión Riel Diesel (0-2000 Bar)",
      brand: "Bosch / Maddox",
      category: "Precisión y Torque",
      location: "Gabinete Calibrado A-2",
      status: "Disponible",
      condition: "Óptima",
      assignedToName: null,
      workOrderFolio: null,
      lastCheckoutAt: null,
      lastCheckinAt: null,
      requiresCert: true,
      certStatus: "Próximo a Vencer",
      certNumber: "CERT-ISO-2025-512",
      certLab: "CESMEC Certificaciones",
      certIssuedAt: "2025-10-28",
      certExpiresAt: soonExpireStr,
      cost: 310000,
      supplier: "Bosch Automotive Chile",
      notes: "Programar recalibración anual antes de fin de mes.",
    },
    {
      code: "HER-ELEV-01",
      name: "Gata Hidráulica de Foso / Transmisión 1.0 Tonelada",
      brand: "Bahco",
      category: "Hidráulica y Elevación",
      location: "Zona Hidráulica Piso 1",
      status: "Disponible",
      condition: "Desgaste Leve",
      assignedToName: null,
      workOrderFolio: null,
      lastCheckoutAt: new Date(today.getTime() - 5 * 3600000).toISOString(),
      lastCheckinAt: new Date(today.getTime() - 1.5 * 3600000).toISOString(),
      requiresCert: true,
      certStatus: "Vigente",
      certNumber: "CERT-HID-2026-019",
      certLab: "Inspección Interna ISO 9001",
      certIssuedAt: todayStr,
      certExpiresAt: nextYearStr,
      cost: 390000,
      supplier: "Bahco Industrial",
      notes: "Utilizada para desmontaje de caja de 6 vel. en Sprinter SP-RT-42.",
    },
    {
      code: "HER-IMP-04",
      name: "Pistola de Impacto Neumática 1/2\" Alto Torque (1350 Nm)",
      brand: "Ingersoll Rand",
      category: "Neumática y Eléctrica",
      location: "Pañol Bandeja D-3 (En Baja)",
      status: "Para Reposición",
      condition: "Dañada",
      assignedToName: null,
      workOrderFolio: null,
      lastCheckoutAt: null,
      lastCheckinAt: today.toISOString(),
      requiresCert: true,
      certStatus: "Vencido",
      certNumber: "CERT-NEU-2024-110",
      certLab: "LabMet Metrología Chile",
      certIssuedAt: "2024-09-15",
      certExpiresAt: expiredStr,
      cost: 245000,
      supplier: "Ferretería Industrial Kupfer",
      notes: "Retenida en pañol por pérdida de presión en rotor interno. Solicitud de reposición activa.",
    },
  ];

  const insertedTools: any[] = [];
  for (const t of initialTools) {
    const { data } = await supabaseAdmin
      .from("iso_logs")
      .insert({
        event_type: `TOOL:${t.code}`,
        description: JSON.stringify(t),
        reference_table: TABLE_TOOLS,
        clausula_iso: "7.1.5",
      })
      .select()
      .single();
    if (data) insertedTools.push({ ...t, id: data.id });
  }

  const torqTool = insertedTools.find((x) => x.code === "HER-TORQ-01");
  const scanTool = insertedTools.find((x) => x.code === "HER-SCAN-01");
  const impTool = insertedTools.find((x) => x.code === "HER-IMP-04");

  const initialMovements = [
    {
      toolId: torqTool?.id || "",
      toolCode: "HER-TORQ-01",
      toolName: "Llave Dinamométrica Digital 20-200 Nm (1/2\")",
      type: "SALIDA",
      mechanicName: "Carlos Muñoz",
      workOrderFolio: "OT-2026-1042",
      conditionOnReturn: null,
      notes: "Salida de pañol para torqueo de volante bimasa y ruedas Sprinter SP-RT-42.",
      timestamp: new Date(today.getTime() - 4 * 3600000).toISOString(),
    },
    {
      toolId: torqTool?.id || "",
      toolCode: "HER-TORQ-01",
      toolName: "Llave Dinamométrica Digital 20-200 Nm (1/2\")",
      type: "ENTRADA_RECEPCION",
      mechanicName: "Carlos Muñoz",
      workOrderFolio: "OT-2026-1042",
      conditionOnReturn: "Óptima",
      notes: "Recepcionada en pañol limpia, en estuche protector y regulada en posición cero.",
      timestamp: new Date(today.getTime() - 1 * 3600000).toISOString(),
    },
    {
      toolId: scanTool?.id || "",
      toolCode: "HER-SCAN-01",
      toolName: "Scanner Multimarca Launch X431 PRO3S+ HD",
      type: "SALIDA",
      mechanicName: "Carlos Muñoz",
      workOrderFolio: "OT-2026-1043",
      conditionOnReturn: null,
      notes: "Prestada para lectura de flujo de datos e inyectores en Toyota Hilux AN-DS-88.",
      timestamp: new Date(today.getTime() - 2 * 3600000).toISOString(),
    },
  ];

  for (const mov of initialMovements) {
    await supabaseAdmin.from("iso_logs").insert({
      event_type: `MOV:${mov.type}:${mov.toolCode}`,
      description: JSON.stringify(mov),
      reference_table: TABLE_MOVEMENTS,
      clausula_iso: "7.1.5",
    });
  }

  const initialReplacement = {
    toolId: impTool?.id || null,
    toolCode: "HER-IMP-04",
    toolName: "Pistola de Impacto Neumática 1/2\" Alto Torque (1350 Nm)",
    reason: "Ruptura en Servicio",
    priority: "Urgente",
    status: "Pendiente de Compra",
    supplier: "Ferretería Industrial Kupfer",
    estimatedCost: 245000,
    requestedBy: "Carlos Muñoz (Jefe de Taller)",
    requestedAt: today.toISOString(),
    resolvedAt: null,
    notes: "Falla en martillo neumático tras uso intensivo en pernos de maza. Se requiere reposición por unidad nueva.",
  };

  await supabaseAdmin.from("iso_logs").insert({
    event_type: `REP:${initialReplacement.toolCode}`,
    description: JSON.stringify(initialReplacement),
    reference_table: TABLE_REPLACEMENTS,
    clausula_iso: "7.1.5",
  });
}

export async function GET() {
  try {
    await seedDefaultToolroomDataIfEmpty();

    const [logsRes, mechanicsRes, ordersRes] = await Promise.all([
      supabaseAdmin
        .from("iso_logs")
        .select("*")
        .in("reference_table", [TABLE_TOOLS, TABLE_MOVEMENTS, TABLE_REPLACEMENTS])
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("profiles").select("id, name, email, role"),
      supabaseAdmin
        .from("work_orders")
        .select("id, folio, status")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (logsRes.error) {
      return NextResponse.json({ error: logsRes.error.message }, { status: 500 });
    }

    const rows = logsRes.data || [];
    const tools = rows
      .filter((r) => r.reference_table === TABLE_TOOLS)
      .map(parseRow)
      .filter(Boolean);

    const movements = rows
      .filter((r) => r.reference_table === TABLE_MOVEMENTS)
      .map(parseRow)
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime());

    const replacements = rows
      .filter((r) => r.reference_table === TABLE_REPLACEMENTS)
      .map(parseRow)
      .filter(Boolean);

    const mechanics = (mechanicsRes.data || []).filter(
      (p) => p.role === "mechanic" || p.role === "admin"
    );

    return NextResponse.json({
      tools,
      movements,
      replacements,
      mechanics,
      workOrders: ordersRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. CREAR NUEVA HERRAMIENTA EN PAÑOL
    if (action === "create_tool") {
      const toolPayload = {
        code: (body.code || `HER-${Math.floor(100 + Math.random() * 900)}`).toUpperCase().trim(),
        name: body.name,
        brand: body.brand || "OEM Taller",
        category: body.category || "General",
        location: body.location || "Tablero Pañol A-1",
        status: body.status || "Disponible",
        condition: body.condition || "Óptima",
        assignedToName: null,
        workOrderFolio: null,
        lastCheckoutAt: null,
        lastCheckinAt: null,
        requiresCert: Boolean(body.requiresCert),
        certStatus: body.requiresCert ? body.certStatus || "Vigente" : "No Requiere",
        certNumber: body.requiresCert ? body.certNumber || `CERT-ISO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}` : null,
        certLab: body.requiresCert ? body.certLab || "LabMet Metrología Chile" : null,
        certIssuedAt: body.requiresCert ? body.certIssuedAt || new Date().toISOString().split("T")[0] : null,
        certExpiresAt: body.requiresCert ? body.certExpiresAt || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0] : null,
        cost: Number(body.cost) || 0,
        supplier: body.supplier || "Proveedor General",
        notes: body.notes || "",
      };

      const { data, error } = await supabaseAdmin
        .from("iso_logs")
        .insert({
          event_type: `TOOL:${toolPayload.code}`,
          description: JSON.stringify(toolPayload),
          reference_table: TABLE_TOOLS,
          clausula_iso: "7.1.5",
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: parseRow(data) });
    }

    // 2. ACTUALIZAR HERRAMIENTA
    if (action === "update_tool") {
      const { id, ...fields } = body;
      const { data: current } = await supabaseAdmin
        .from("iso_logs")
        .select("*")
        .eq("id", id)
        .single();
      if (!current) return NextResponse.json({ error: "Herramienta no encontrada" }, { status: 404 });

      const merged = { ...parseRow(current), ...fields };
      delete merged.action;

      const { data, error } = await supabaseAdmin
        .from("iso_logs")
        .update({
          event_type: `TOOL:${merged.code}`,
          description: JSON.stringify(merged),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: parseRow(data) });
    }

    // 3. REGISTRAR SALIDA DE PAÑOL (PRÉSTAMO A MECÁNICO)
    if (action === "checkout_tool") {
      const { toolId, mechanicName, workOrderFolio, notes } = body;
      const { data: current } = await supabaseAdmin
        .from("iso_logs")
        .select("*")
        .eq("id", toolId)
        .single();
      if (!current) return NextResponse.json({ error: "Herramienta no encontrada" }, { status: 404 });

      const tool = parseRow(current);
      const nowIso = new Date().toISOString();
      const updatedTool = {
        ...tool,
        status: "En Uso",
        assignedToName: mechanicName || "Mecánico de Turno",
        workOrderFolio: workOrderFolio || null,
        lastCheckoutAt: nowIso,
      };

      const { data: savedTool, error: updErr } = await supabaseAdmin
        .from("iso_logs")
        .update({ description: JSON.stringify(updatedTool) })
        .eq("id", toolId)
        .select()
        .single();
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

      const movementPayload = {
        toolId,
        toolCode: tool.code,
        toolName: tool.name,
        type: "SALIDA",
        mechanicName: mechanicName || "Mecánico de Turno",
        workOrderFolio: workOrderFolio || null,
        conditionOnReturn: null,
        notes: notes || "Salida autorizada de pañol.",
        timestamp: nowIso,
      };

      const { data: savedMov } = await supabaseAdmin
        .from("iso_logs")
        .insert({
          event_type: `MOV:SALIDA:${tool.code}`,
          description: JSON.stringify(movementPayload),
          reference_table: TABLE_MOVEMENTS,
          clausula_iso: "7.1.5",
        })
        .select()
        .single();

      return NextResponse.json({
        tool: parseRow(savedTool),
        movement: savedMov ? parseRow(savedMov) : null,
      });
    }

    // 4. REGISTRAR ENTRADA / RECEPCIÓN EN PAÑOL
    if (action === "checkin_tool") {
      const { toolId, conditionOnReturn = "Óptima", notes, createReplacementIfDamaged = true } = body;
      const { data: current } = await supabaseAdmin
        .from("iso_logs")
        .select("*")
        .eq("id", toolId)
        .single();
      if (!current) return NextResponse.json({ error: "Herramienta no encontrada" }, { status: 404 });

      const tool = parseRow(current);
      const nowIso = new Date().toISOString();
      const isDamaged = conditionOnReturn === "Dañada";

      const updatedTool = {
        ...tool,
        status: isDamaged ? "Para Reposición" : "Disponible",
        condition: conditionOnReturn,
        assignedToName: null,
        workOrderFolio: null,
        lastCheckinAt: nowIso,
      };

      const { data: savedTool, error: updErr } = await supabaseAdmin
        .from("iso_logs")
        .update({ description: JSON.stringify(updatedTool) })
        .eq("id", toolId)
        .select()
        .single();
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

      const movementPayload = {
        toolId,
        toolCode: tool.code,
        toolName: tool.name,
        type: "ENTRADA_RECEPCION",
        mechanicName: tool.assignedToName || body.mechanicName || "Mecánico",
        workOrderFolio: tool.workOrderFolio || null,
        conditionOnReturn,
        notes:
          notes ||
          (isDamaged
            ? "Recepcionada con daño. Enviada a cola de reposición."
            : "Recepcionada en pañol conforme y limpia."),
        timestamp: nowIso,
      };

      const { data: savedMov } = await supabaseAdmin
        .from("iso_logs")
        .insert({
          event_type: `MOV:ENTRADA:${tool.code}`,
          description: JSON.stringify(movementPayload),
          reference_table: TABLE_MOVEMENTS,
          clausula_iso: "7.1.5",
        })
        .select()
        .single();

      let createdReplacement = null;
      if (isDamaged && createReplacementIfDamaged) {
        const repPayload = {
          toolId,
          toolCode: tool.code,
          toolName: tool.name,
          reason: "Ruptura en Servicio",
          priority: "Urgente",
          status: "Pendiente de Compra",
          supplier: tool.supplier || "Proveedor Habitual",
          estimatedCost: Number(tool.cost) || 120000,
          requestedBy: tool.assignedToName || "Encargado de Pañol",
          requestedAt: nowIso,
          resolvedAt: null,
          notes: notes || "Generada automáticamente al recepcionar herramienta dañada en pañol.",
        };
        const { data: repRow } = await supabaseAdmin
          .from("iso_logs")
          .insert({
            event_type: `REP:${tool.code}`,
            description: JSON.stringify(repPayload),
            reference_table: TABLE_REPLACEMENTS,
            clausula_iso: "7.1.5",
          })
          .select()
          .single();
        if (repRow) createdReplacement = parseRow(repRow);
      }

      return NextResponse.json({
        tool: parseRow(savedTool),
        movement: savedMov ? parseRow(savedMov) : null,
        replacement: createdReplacement,
      });
    }

    // 5. EMITIR / RENOVAR CERTIFICADO DE CALIBRACIÓN (ISO 9001)
    if (action === "certify_tool") {
      const { toolId, certNumber, certLab, certIssuedAt, certExpiresAt, certStatus = "Vigente", notes } = body;
      const { data: current } = await supabaseAdmin
        .from("iso_logs")
        .select("*")
        .eq("id", toolId)
        .single();
      if (!current) return NextResponse.json({ error: "Herramienta no encontrada" }, { status: 404 });

      const tool = parseRow(current);
      const nowIso = new Date().toISOString();
      const updatedTool = {
        ...tool,
        requiresCert: true,
        certStatus,
        certNumber: certNumber || tool.certNumber || `CERT-ISO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        certLab: certLab || tool.certLab || "LabMet Metrología Chile",
        certIssuedAt: certIssuedAt || nowIso.split("T")[0],
        certExpiresAt: certExpiresAt || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
        status: tool.status === "En Certificación" ? "Disponible" : tool.status,
      };

      const { data: savedTool, error: updErr } = await supabaseAdmin
        .from("iso_logs")
        .update({ description: JSON.stringify(updatedTool) })
        .eq("id", toolId)
        .select()
        .single();
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

      const movPayload = {
        toolId,
        toolCode: tool.code,
        toolName: tool.name,
        type: "CERTIFICACION",
        mechanicName: updatedTool.certLab,
        workOrderFolio: updatedTool.certNumber,
        conditionOnReturn: "Calibrada y Certificada",
        notes: notes || `Certificado ${updatedTool.certNumber} vigente hasta ${updatedTool.certExpiresAt}.`,
        timestamp: nowIso,
      };

      await supabaseAdmin.from("iso_logs").insert({
        event_type: `MOV:CERT:${tool.code}`,
        description: JSON.stringify(movPayload),
        reference_table: TABLE_MOVEMENTS,
        clausula_iso: "7.1.5",
      });

      return NextResponse.json({ tool: parseRow(savedTool) });
    }

    // 6. CREAR SOLICITUD DE REPOSICIÓN DE HERRAMIENTA
    if (action === "create_replacement") {
      const {
        toolId,
        toolCode,
        toolName,
        reason = "Ruptura en Servicio",
        priority = "Urgente",
        supplier = "Proveedor Industrial",
        estimatedCost = 0,
        requestedBy = "Encargado de Pañol",
        notes = "",
      } = body;

      const nowIso = new Date().toISOString();
      const repPayload = {
        toolId: toolId || null,
        toolCode: (toolCode || "HER-REP").toUpperCase(),
        toolName: toolName || "Herramienta de Taller",
        reason,
        priority,
        status: "Pendiente de Compra",
        supplier,
        estimatedCost: Number(estimatedCost) || 0,
        requestedBy,
        requestedAt: nowIso,
        resolvedAt: null,
        notes,
      };

      const { data: repRow, error: repErr } = await supabaseAdmin
        .from("iso_logs")
        .insert({
          event_type: `REP:${repPayload.toolCode}`,
          description: JSON.stringify(repPayload),
          reference_table: TABLE_REPLACEMENTS,
          clausula_iso: "7.1.5",
        })
        .select()
        .single();

      if (repErr) return NextResponse.json({ error: repErr.message }, { status: 500 });

      // Si está vinculada a una herramienta existente, marcarla como "Para Reposición"
      if (toolId) {
        const { data: current } = await supabaseAdmin
          .from("iso_logs")
          .select("*")
          .eq("id", toolId)
          .single();
        if (current) {
          const tool = parseRow(current);
          await supabaseAdmin
            .from("iso_logs")
            .update({
              description: JSON.stringify({
                ...tool,
                status: "Para Reposición",
                condition: "Dañada",
              }),
            })
            .eq("id", toolId);
        }
      }

      return NextResponse.json({ data: parseRow(repRow) });
    }

    // 7. COMPLETAR / RECEPCIONAR REPOSICIÓN EN PAÑOL
    if (action === "complete_replacement") {
      const { replacementId } = body;
      const { data: repCurrent } = await supabaseAdmin
        .from("iso_logs")
        .select("*")
        .eq("id", replacementId)
        .single();
      if (!repCurrent) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });

      const rep = parseRow(repCurrent);
      const nowIso = new Date().toISOString();
      const updatedRep = {
        ...rep,
        status: "Repuesta en Pañol",
        resolvedAt: nowIso,
      };

      const { data: savedRep, error: updErr } = await supabaseAdmin
        .from("iso_logs")
        .update({ description: JSON.stringify(updatedRep) })
        .eq("id", replacementId)
        .select()
        .single();
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

      // Rehabilitar herramienta vinculada en el Pañol como Disponible y Óptima
      if (rep.toolId) {
        const { data: toolRow } = await supabaseAdmin
          .from("iso_logs")
          .select("*")
          .eq("id", rep.toolId)
          .single();
        if (toolRow) {
          const tool = parseRow(toolRow);
          await supabaseAdmin
            .from("iso_logs")
            .update({
              description: JSON.stringify({
                ...tool,
                status: "Disponible",
                condition: "Óptima",
                assignedToName: null,
                workOrderFolio: null,
                lastCheckinAt: nowIso,
              }),
            })
            .eq("id", rep.toolId);
        }
      }

      // Registrar movimiento de entrada por reposición
      await supabaseAdmin.from("iso_logs").insert({
        event_type: `MOV:REPOSICION:${rep.toolCode}`,
        description: JSON.stringify({
          toolId: rep.toolId || "",
          toolCode: rep.toolCode,
          toolName: rep.toolName,
          type: "REPOSICION",
          mechanicName: rep.supplier,
          workOrderFolio: null,
          conditionOnReturn: "Nueva (Reposición)",
          notes: `Reposición completada e ingresada al pañol (${rep.reason}).`,
          timestamp: nowIso,
        }),
        reference_table: TABLE_MOVEMENTS,
        clausula_iso: "7.1.5",
      });

      return NextResponse.json({ data: parseRow(savedRep) });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("iso_logs").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
