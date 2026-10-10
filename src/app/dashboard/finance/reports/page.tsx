"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileSpreadsheet,
  Download,
  DollarSign,
  Wrench,
  Users,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowDownToLine,
  FileText,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/export-excel";

export default function ReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Datos crudos para exportación y resumen
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Métricas calculadas
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOTs: 0,
    completedOTs: 0,
    pendingOTs: 0,
    totalInventoryValue: 0,
    totalPartsCount: 0,
    totalClientsCount: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Cargar Órdenes de Trabajo con datos de cliente, vehículo y mecánico
      const { data: woData } = await supabase
        .from("work_orders")
        .select(`
          *,
          client:clients(name, phone, email),
          vehicle:vehicles(license_plate, make, model, year, vin),
          technician:profiles!work_orders_technician_id_fkey(name)
        `)
        .order("created_at", { ascending: false });

      // 2. Cargar Cotizaciones
      const { data: qData } = await supabase
        .from("quotes")
        .select(`
          *,
          client:clients(name, phone),
          vehicle:vehicles(license_plate, make, model)
        `)
        .order("created_at", { ascending: false });

      // 3. Cargar Repuestos / Inventario
      const { data: partsData } = await supabase
        .from("parts")
        .select("*")
        .order("name", { ascending: true });

      // 4. Cargar Clientes con sus Vehículos
      const { data: clientData } = await supabase
        .from("clients")
        .select("*, vehicles(*)")
        .order("name", { ascending: true });

      const wos = woData || [];
      const qts = qData || [];
      const prts = partsData || [];
      const cls = clientData || [];

      setWorkOrders(wos);
      setQuotes(qts);
      setParts(prts);
      setClients(cls);

      // Calcular totales
      const completed = wos.filter(
        (w) => w.status === "Completado" || w.status === "Entregado"
      ).length;

      const revenue = qts
        .filter((q) => q.status === "Aprobada")
        .reduce((acc, q) => acc + (Number(q.total) || 0), 0);

      const invValue = prts.reduce(
        (acc, p) => acc + (Number(p.cost) || 0) * (Number(p.stock) || 0),
        0
      );

      setMetrics({
        totalRevenue: revenue,
        totalOTs: wos.length,
        completedOTs: completed,
        pendingOTs: wos.length - completed,
        totalInventoryValue: invValue,
        totalPartsCount: prts.length,
        totalClientsCount: cls.length,
      });
    } catch (error) {
      console.error("Error al cargar datos para reportes:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- EXPORTADORES A EXCEL ---

  const handleExportWorkOrders = () => {
    if (workOrders.length === 0) {
      toast({ title: "Sin datos", description: "No hay órdenes de trabajo para exportar." });
      return;
    }

    const headers = [
      "N° OT",
      "Fecha Ingreso",
      "Estado",
      "Tipo de Servicio",
      "Cliente",
      "Teléfono Cliente",
      "Email Cliente",
      "Patente Vehículo",
      "Marca",
      "Modelo",
      "Año",
      "Mecánico Asignado",
      "Horas Mano de Obra",
      "Descripción Falla / Trabajo",
      "Calificación Satisfacción",
    ];

    const rows = workOrders.map((wo) => [
      wo.ot_number || wo.id.substring(0, 8),
      wo.entry_date ? new Date(wo.entry_date).toLocaleDateString("es-CL") : "N/A",
      wo.status,
      wo.type || "N/A",
      wo.client?.name || "Sin cliente",
      wo.client?.phone || "N/A",
      wo.client?.email || "N/A",
      wo.vehicle?.license_plate || "N/A",
      wo.vehicle?.make || "N/A",
      wo.vehicle?.model || "N/A",
      wo.vehicle?.year || "N/A",
      wo.technician?.name || "Sin asignar",
      wo.labor_hours || 0,
      wo.service_description || "N/A",
      wo.satisfaction_rating ? `${wo.satisfaction_rating}/5` : "Sin evaluar",
    ]);

    exportToExcel("LionFix_Ordenes_de_Trabajo", headers, rows);
    toast({
      title: "Exportación Exitosa",
      description: "Se ha descargado el archivo Excel de Órdenes de Trabajo.",
    });
  };

  const handleExportQuotes = () => {
    if (quotes.length === 0) {
      toast({ title: "Sin datos", description: "No hay cotizaciones para exportar." });
      return;
    }

    const headers = [
      "N° Cotización",
      "Fecha",
      "Estado",
      "Cliente",
      "Teléfono",
      "Patente Vehículo",
      "Marca / Modelo",
      "Falla Principal Diagnóstico",
      "Total Cotizado ($ CLP)",
      "Anticipo ($ CLP)",
      "Notas",
    ];

    const rows = quotes.map((q) => [
      q.quote_number || q.id.substring(0, 8),
      q.date ? new Date(q.date).toLocaleDateString("es-CL") : "N/A",
      q.status,
      q.client?.name || "N/A",
      q.client?.phone || "N/A",
      q.vehicle?.license_plate || "N/A",
      q.vehicle ? `${q.vehicle.make} ${q.vehicle.model}` : "N/A",
      q.diagnostics_main_failure || "N/A",
      q.total || 0,
      q.advance_payment || 0,
      q.notes || "",
    ]);

    exportToExcel("LionFix_Cotizaciones_y_Presupuestos", headers, rows);
    toast({
      title: "Exportación Exitosa",
      description: "Se ha descargado el archivo Excel de Cotizaciones.",
    });
  };

  const handleExportInventory = () => {
    if (parts.length === 0) {
      toast({ title: "Sin datos", description: "No hay repuestos en el inventario para exportar." });
      return;
    }

    const headers = [
      "Código / SKU",
      "Nombre del Repuesto",
      "Ubicación en Bodega",
      "Stock Actual",
      "Stock Mínimo (Alerta)",
      "Costo de Compra ($ CLP)",
      "Precio de Venta ($ CLP)",
      "Margen Unitario ($ CLP)",
      "Valor Total en Stock ($ CLP)",
      "Proveedor",
    ];

    const rows = parts.map((p) => {
      const cost = Number(p.cost) || 0;
      const price = Number(p.price) || 0;
      const stock = Number(p.stock) || 0;
      const margin = price - cost;
      const totalVal = cost * stock;

      return [
        p.sku || "N/A",
        p.name,
        p.location || "Principal",
        stock,
        p.alert_threshold || 5,
        cost,
        price,
        margin,
        totalVal,
        p.supplier || "N/A",
      ];
    });

    exportToExcel("LionFix_Inventario_de_Repuestos", headers, rows);
    toast({
      title: "Exportación Exitosa",
      description: "Se ha descargado el archivo Excel del Inventario.",
    });
  };

  const handleExportClients = () => {
    if (clients.length === 0) {
      toast({ title: "Sin datos", description: "No hay clientes para exportar." });
      return;
    }

    const headers = [
      "Nombre / Razón Social",
      "Email",
      "Teléfono",
      "Dirección",
      "Cant. Vehículos Registrados",
      "Patentes Asociadas",
      "Fecha de Registro",
    ];

    const rows = clients.map((c) => {
      const plates = Array.isArray(c.vehicles)
        ? c.vehicles.map((v: any) => v.license_plate).join(", ")
        : "Sin vehículos";

      return [
        c.name,
        c.email,
        c.phone || "N/A",
        c.address || "N/A",
        c.vehicles?.length || 0,
        plates,
        c.created_at ? new Date(c.created_at).toLocaleDateString("es-CL") : "N/A",
      ];
    });

    exportToExcel("LionFix_Directorio_Clientes", headers, rows);
    toast({
      title: "Exportación Exitosa",
      description: "Se ha descargado el archivo Excel de Clientes y Vehículos.",
    });
  };

  const formatCLP = (val: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-57px)]">
        <DashboardHeader title="Reportes y Exportación Excel" />
        <main className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-57px)]">
      <DashboardHeader title="Reportes & Exportación Excel">
        <Button
          variant="default"
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          onClick={handleExportWorkOrders}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar OTs Rápidas
        </Button>
      </DashboardHeader>

      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
        {/* TARJETAS RESUMEN EJECUTIVO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60 shadow-sm bg-card/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-medium">Facturación Aprobada</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-400">
                {formatCLP(metrics.totalRevenue)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-400" /> Total cotizaciones aprobadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-medium">Órdenes de Trabajo</CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                {metrics.totalOTs} <span className="text-sm font-normal text-muted-foreground">OTs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  {metrics.completedOTs} Listas
                </Badge>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  {metrics.pendingOTs} En Taller
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-medium">Valor en Bodega</CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-400">
                {formatCLP(metrics.totalInventoryValue)}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3 text-blue-400" /> {metrics.totalPartsCount} ítems en repuestos
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card/60">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-medium">Cartera de Clientes</CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                {metrics.totalClientsCount} <span className="text-sm font-normal text-muted-foreground">Clientes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3 text-primary" /> Clientes particulares y flotas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CENTRO DE EXPORTACIÓN DIRECTA A EXCEL */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
              <div>
                <CardTitle className="text-lg">Centro de Descargas a Excel (.xlsx / .csv)</CardTitle>
                <CardDescription>
                  Descarga planillas limpias con los datos completos del taller, compatibles 100% con Microsoft Excel.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Botón 1: OTs */}
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="p-2.5 w-fit rounded-lg bg-orange-500/10 text-orange-400">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-base text-foreground">Órdenes de Trabajo</h4>
                  <p className="text-xs text-muted-foreground">
                    Incluye N° OT, cliente, patente, fechas de ingreso/entrega, horas de trabajo y mecánicos.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                  onClick={handleExportWorkOrders}
                >
                  <Download className="h-4 w-4" />
                  Descargar Excel ({workOrders.length})
                </Button>
              </div>

              {/* Botón 2: Cotizaciones */}
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="p-2.5 w-fit rounded-lg bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-base text-foreground">Cotizaciones & Ventas</h4>
                  <p className="text-xs text-muted-foreground">
                    Totales cotizados, estados (Aprobada, Pendiente), anticipos y fallas diagnosticadas.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                  onClick={handleExportQuotes}
                >
                  <Download className="h-4 w-4" />
                  Descargar Excel ({quotes.length})
                </Button>
              </div>

              {/* Botón 3: Inventario */}
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="p-2.5 w-fit rounded-lg bg-blue-500/10 text-blue-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-base text-foreground">Inventario & Repuestos</h4>
                  <p className="text-xs text-muted-foreground">
                    Códigos SKU, stock en bodega, precios de compra, precios de venta y márgenes de ganancia.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                  onClick={handleExportInventory}
                >
                  <Download className="h-4 w-4" />
                  Descargar Excel ({parts.length})
                </Button>
              </div>

              {/* Botón 4: Clientes */}
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <div className="p-2.5 w-fit rounded-lg bg-purple-500/10 text-purple-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-base text-foreground">Clientes & Vehículos</h4>
                  <p className="text-xs text-muted-foreground">
                    Base de datos de contactos, teléfonos de WhatsApp, direcciones y patentes registradas.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                  onClick={handleExportClients}
                >
                  <Download className="h-4 w-4" />
                  Descargar Excel ({clients.length})
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* TABLA DE RESUMEN RÁPIDO DE ÚLTIMAS OTs */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Últimas Órdenes Registradas</CardTitle>
              <CardDescription>Resumen de las OTs más recientes que se incluirán en el reporte</CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {workOrders.length} Totales
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {workOrders.slice(0, 6).map((wo) => (
                <div key={wo.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground">
                        {wo.ot_number || wo.id.substring(0, 8)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {wo.status}
                      </Badge>
                      {wo.vehicle && (
                        <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {wo.vehicle.license_plate}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {wo.client?.name || "Cliente general"} • {wo.service_description}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0 text-left sm:text-right">
                    <div>{wo.technician?.name || "Sin mecánico"}</div>
                    <div className="text-[11px] opacity-70">
                      {wo.entry_date ? new Date(wo.entry_date).toLocaleDateString("es-CL") : "N/A"}
                    </div>
                  </div>
                </div>
              ))}

              {workOrders.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Aún no hay órdenes de trabajo registradas para mostrar.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
