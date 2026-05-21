"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Users,
  HardHat,
  FileText,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertTriangle,
  Star,
  ClipboardList,
  Truck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ISO_CLAUSE_COLORS: Record<string, string> = {
  "Cambio de Estado OT": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Cliente Registrado": "bg-green-500/10 text-green-400 border-green-500/20",
  "Checklist Completado": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "OT Creada": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Satisfacción Registrada": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default function Iso9001Page() {
  const { toast } = useToast();
  const [isoLogs, setIsoLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [kpis, setKpis] = useState({
    totalOTs: 0,
    completedOTs: 0,
    avgSatisfaction: 0,
    totalClients: 0,
    checklistsCompleted: 0,
    lowStockParts: 0,
  });
  const [loadingKpis, setLoadingKpis] = useState(true);

  useEffect(() => {
    fetchLogs();
    fetchKpis();
  }, []);

  async function fetchLogs() {
    setLoadingLogs(true);
    const { data } = await supabase
      .from("iso_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setIsoLogs(data);
    setLoadingLogs(false);
  }

  async function fetchKpis() {
    setLoadingKpis(true);
    const [wos, clients, checklists, parts] = await Promise.all([
      supabase.from("work_orders").select("status, satisfaction_rating"),
      supabase.from("clients").select("id", { count: "exact" }),
      supabase.from("checklists").select("completed").eq("completed", true),
      supabase.from("parts").select("stock, alert_threshold"),
    ]);

    const woData = wos.data || [];
    const completedOTs = woData.filter(
      (w) => w.status === "Completado" || w.status === "Entregado"
    ).length;
    const ratings = woData
      .map((w) => w.satisfaction_rating)
      .filter((r) => r != null) as number[];
    const avgSatisfaction =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;
    const lowStock = (parts.data || []).filter(
      (p) => p.stock <= p.alert_threshold && p.stock > 0
    ).length;

    setKpis({
      totalOTs: woData.length,
      completedOTs,
      avgSatisfaction,
      totalClients: clients.count || 0,
      checklistsCompleted: checklists.data?.length || 0,
      lowStockParts: lowStock,
    });
    setLoadingKpis(false);
  }

  const handleRefresh = () => {
    fetchLogs();
    fetchKpis();
    toast({ title: "Actualizado", description: "Registros de auditoría actualizados." });
  };

  const completionRate =
    kpis.totalOTs > 0
      ? Math.round((kpis.completedOTs / kpis.totalOTs) * 100)
      : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Norma ISO 9001 — Trazabilidad y Calidad">
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar Registros
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* KPIs de Calidad ISO */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "OTs Totales", value: kpis.totalOTs, icon: FileText, color: "text-blue-400" },
            { label: "OTs Completadas", value: kpis.completedOTs, icon: CheckCircle, color: "text-green-400" },
            { label: "Tasa Cumplimiento", value: `${completionRate}%`, icon: ShieldCheck, color: "text-primary" },
            { label: "Satisfacción", value: kpis.avgSatisfaction > 0 ? `${kpis.avgSatisfaction.toFixed(1)}/5` : "—", icon: Star, color: "text-yellow-400" },
            { label: "Checklists OK", value: kpis.checklistsCompleted, icon: ClipboardList, color: "text-purple-400" },
            { label: "Stock Crítico", value: kpis.lowStockParts, icon: AlertTriangle, color: kpis.lowStockParts > 0 ? "text-red-400" : "text-muted-foreground" },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent className="px-4 pb-3">
                {loadingKpis ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cómo LionFix cumple ISO 9001 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="text-primary" />
                Cómo LionFix ERP apoya la ISO 9001
              </CardTitle>
              <CardDescription>
                Cada módulo del sistema está diseñado para cumplir las cláusulas de la norma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <HardHat className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
                    Cláusulas 4 y 8 — Gestión de procesos y trazabilidad
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pl-8">
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> Registro inmutable de órdenes de trabajo (OT) con número único.</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> Historial cronológico de reparaciones por cliente y vehículo.</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> Control de repuestos consumidos en cada OT.</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> Cambios de estado trazados automáticamente en esta pantalla.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    <FileText className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
                    Cláusula 7.5 — Gestión documental
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pl-8">
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> Evidencias fotográficas cargadas directamente en cada OT.</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> Checklists de recepción y entrega firmados con fecha y hora.</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> Cotizaciones con ítems de trabajo guardadas en la nube.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    <Users className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
                    Cláusula 9.1.2 — Satisfacción del Cliente
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pl-8">
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> Encuestas de satisfacción integradas al cierre de cada OT.</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> Portal del cliente con acceso a historial de su vehículo.</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> KPI de satisfacción promedio visible en tiempo real.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>
                    <Truck className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
                    Cláusula 8.4 — Control de proveedores externos
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pl-8">
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> Inventario de repuestos con SKU y proveedor identificado.</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> Órdenes de compra registradas en base de datos.</p>
                    <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> Alertas de bajo stock para evitar interrupciones del servicio.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Log de Auditoría en Tiempo Real */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="text-primary" />
                Registro de Auditoría (Tiempo Real)
              </CardTitle>
              <CardDescription>
                Trazabilidad automática de eventos clave. Se genera sin intervención manual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="rounded-md border max-h-[420px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                      <TableRow>
                        <TableHead>Fecha / Hora</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Cláusula ISO</TableHead>
                        <TableHead>Detalle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isoLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString("es-CL")}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                ISO_CLAUSE_COLORS[log.event_type] ||
                                "bg-secondary text-secondary-foreground border-transparent"
                              }`}
                            >
                              {log.event_type}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                            {log.clausula_iso || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                            <span className="line-clamp-2">{log.description}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {isoLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                            <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p>No hay registros de auditoría aún.</p>
                            <p className="text-xs mt-1">Crea una OT, registra un cliente o completa un checklist para generar trazabilidad.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
