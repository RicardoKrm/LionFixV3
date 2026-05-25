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
import { BarChart, DollarSign, Wrench, Users, CheckCircle, Percent, Smile, Package } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { KpiCard } from "@/components/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

const STATUS_COLORS: Record<string, string> = {
  "Recibido": "hsl(var(--muted-foreground))",
  "En Diagnóstico": "hsl(var(--chart-4))",
  "Esperando Aprobación": "hsl(var(--chart-3))",
  "En Reparación": "hsl(var(--chart-2))",
  "Esperando Repuestos": "hsl(var(--destructive))",
  "Listo para Retiro": "hsl(var(--chart-5))",
  "Completado": "hsl(var(--chart-1))",
  "Entregado": "hsl(var(--chart-1))",
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    completedOTs: 0,
    avgSatisfaction: 0,
    inventoryValue: 0,
    totalParts: 0,
  });
  const [statusData, setStatusData] = useState<{ name: string; value: number; fill: string }[]>([]);
  const [techWorkload, setTechWorkload] = useState<{ name: string; ots: number }[]>([]);

  const chartConfigRevenue = {
    ots: { label: "OTs Asignadas", color: "hsl(var(--chart-2))" },
  };

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        // 1. OTs: status distribution + satisfaction + completed count
        const { data: wos } = await supabase
          .from("work_orders")
          .select("status, satisfaction_rating, technician_id, profiles!work_orders_technician_id_fkey(name)");

        if (wos) {
          const completedOTs = wos.filter(
            (w) => w.status === "Completado" || w.status === "Entregado"
          ).length;

          const ratings = wos
            .map((w) => w.satisfaction_rating)
            .filter((r) => r != null) as number[];
          const avgSatisfaction =
            ratings.length > 0
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length
              : 0;

          // Status pie chart data
          const statusCount: Record<string, number> = {};
          wos.forEach((w) => {
            statusCount[w.status] = (statusCount[w.status] || 0) + 1;
          });
          const statusArr = Object.entries(statusCount).map(([name, value]) => ({
            name,
            value,
            fill: STATUS_COLORS[name] || "hsl(var(--muted-foreground))",
          }));
          setStatusData(statusArr);

          // Technician workload
          const techCount: Record<string, number> = {};
          wos.forEach((w: any) => {
            const techName = w.profiles?.name || "Sin asignar";
            techCount[techName] = (techCount[techName] || 0) + 1;
          });
          const techArr = Object.entries(techCount)
            .map(([name, ots]) => ({ name, ots }))
            .sort((a, b) => b.ots - a.ots)
            .slice(0, 6);
          setTechWorkload(techArr);

          setKpis((prev) => ({ ...prev, completedOTs, avgSatisfaction }));
        }

        // 2. Inventory KPIs
        const { data: parts } = await supabase.from("parts").select("cost, stock, price");
        if (parts) {
          const inventoryValue = parts.reduce((acc, p) => acc + (p.cost || 0) * (p.stock || 0), 0);
          const totalRevenue = parts.reduce((acc, p) => acc + (p.price || 0) * (p.stock || 0), 0);
          setKpis((prev) => ({
            ...prev,
            inventoryValue,
            totalRevenue,
            totalParts: parts.length,
          }));
        }
      } catch (err) {
        console.error("Error loading reports:", err);
      }
      setLoading(false);
    }

    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <DashboardHeader title="Dashboard de Business Intelligence" />
        <main className="flex-1 p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-80" />
            <div className="space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Dashboard de Business Intelligence" />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* KPIs — datos reales de Supabase */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            title="Valor del Inventario"
            value={`$${kpis.inventoryValue.toLocaleString("es-CL")}`}
            description="Basado en costo de compra actual"
            icon={Package}
            href="/dashboard/inventory"
          />
          <KpiCard
            title="OTs Completadas"
            value={kpis.completedOTs.toString()}
            description="Órdenes finalizadas en el sistema"
            icon={CheckCircle}
            href="/dashboard/work-orders"
          />
          <KpiCard
            title="Satisfacción Cliente"
            value={kpis.avgSatisfaction > 0 ? `${kpis.avgSatisfaction.toFixed(1)} / 5` : "Sin datos"}
            description="Promedio de encuestas recibidas"
            icon={Smile}
            href="/dashboard/clients"
          />
          <KpiCard
            title="Tasa Aprobación OTs"
            value={statusData.length > 0 ? `${Math.round((kpis.completedOTs / (statusData.reduce((a, b) => a + b.value, 0) || 1)) * 100)}%` : "—"}
            description="OTs completadas vs. totales"
            icon={Percent}
            href="/dashboard/finance/quotes"
          />
          <KpiCard
            title="SKUs en Inventario"
            value={kpis.totalParts.toString()}
            description="Productos registrados en BD"
            icon={Package}
            href="/dashboard/inventory"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de carga por técnico */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-accent" />
                Carga de Trabajo por Técnico
              </CardTitle>
              <CardDescription>
                Cantidad de OTs asignadas por técnico en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {techWorkload.length > 0 ? (
                <ChartContainer config={chartConfigRevenue} className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={techWorkload} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={90}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Bar dataKey="ots" fill="var(--color-ots)" radius={[0, 4, 4, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-72 flex items-center justify-center text-muted-foreground">
                  <p>No hay OTs con técnicos asignados aún.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de distribución de estados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="mr-2 h-5 w-5 text-accent" />
                Estado de OTs
              </CardTitle>
              <CardDescription>Distribución actual de todas las órdenes.</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ChartContainer config={{}} className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="45%"
                        outerRadius={70}
                        stroke="hsl(var(--border))"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        content={<ChartLegendContent />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-72 flex items-center justify-center text-muted-foreground">
                  <p>No hay órdenes de trabajo registradas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
