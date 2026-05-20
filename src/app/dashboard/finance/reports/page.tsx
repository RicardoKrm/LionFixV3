

"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart, DollarSign, Wrench, Users, FileDown, CheckCircle, Percent, Smile, Package } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart as RechartsBarChart, PieChart, Pie, Cell, Tooltip } from "recharts";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// --- Datos Simulados ---

// Gráfico de Ingresos vs. Costos
const monthlyRevenueData = [
  { month: "Ene", revenue: 1860000, costs: 1200000 },
  { month: "Feb", revenue: 3050000, costs: 1800000 },
  { month: "Mar", revenue: 2370000, costs: 1500000 },
  { month: "Abr", revenue: 1730000, costs: 1100000 },
  { month: "May", revenue: 2090000, costs: 1350000 },
  { month: "Jun", revenue: 2140000, costs: 1400000 },
  { month: "Jul", revenue: 2840000, costs: 1700000 },
];
const chartConfigRevenue = {
  revenue: { label: "Ingresos", color: "hsl(var(--chart-1))" },
  costs: { label: "Costos", color: "hsl(var(--chart-2))" }
};

// Gráfico de Estado de Órdenes de Trabajo (OTs)
const workOrderStatusData = [
  { name: 'Recibido', value: 4, fill: "hsl(var(--muted-foreground))" },
  { name: 'En Reparación', value: 8, fill: "hsl(var(--chart-2))" },
  { name: 'Esperando Repuestos', value: 2, fill: "hsl(var(--destructive))" },
  { name: 'Completado', value: 15, fill: "hsl(var(--chart-1))" },
];

// Gráfico de Carga de Trabajo por Técnico
const technicianWorkloadData = [
  { name: "Pedro Pascal", ots: 12 },
  { name: "Ricardo Milos", ots: 9 },
  { name: "Otro Técnico", ots: 5 },
];
const chartConfigTechnician = {
  ots: { label: "OTs Asignadas", color: "hsl(var(--chart-2))" }
};


export default function ReportsPage() {
  const { toast } = useToast();

  const handleExport = () => {
    toast({
        title: "Exportación en Progreso",
        description: "Se está generando el reporte en formato CSV (Simulación)."
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Dashboard de Business Intelligence">
        <Button onClick={handleExport} variant="outline">
          <FileDown className="mr-2 h-4 w-4"/>
          Exportar a CSV
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        
        {/* --- Fila de KPIs --- */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
             <KpiCard title="Ingresos del Mes" value="$2,840,000" description="+15% vs mes anterior" icon={DollarSign} href="/dashboard/finance/reports"/>
             <KpiCard title="OTs Completadas (Mes)" value="15" description="+5% vs mes anterior" icon={CheckCircle} href="/dashboard/work-orders"/>
             <KpiCard title="Satisfacción Cliente" value="4.7 / 5" description="Promedio últimos 30 días" icon={Smile} href="/dashboard/clients"/>
             <KpiCard title="Tasa Aprobación Cotiz." value="78%" description="Promedio últimos 30 días" icon={Percent} href="/dashboard/finance/quotes"/>
             <KpiCard title="Valor del Inventario" value="$12,580,000" description="3 repuestos con bajo stock" icon={Package} href="/dashboard/inventory"/>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
          {/* --- Columna Principal (Gráfico Grande) --- */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="mr-2 h-5 w-5 text-accent" />
                Ingresos vs. Costos Mensuales
              </CardTitle>
              <CardDescription>
                Comparativa de ingresos brutos y costos operativos en CLP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfigRevenue} className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <RechartsBarChart data={monthlyRevenueData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value) / 1000000}M`} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => `$${Number(value).toLocaleString('es-CL')}`} />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} name="Ingresos" />
                      <Bar dataKey="costs" fill="var(--color-costs)" radius={[4, 4, 0, 0]} name="Costos" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          
          {/* --- Columna Secundaria (Gráficos Pequeños) --- */}
          <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Wrench className="mr-2 h-5 w-5 text-accent" />Estado de OTs (Activas)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={{}} className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                                <Pie data={workOrderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} stroke="hsl(var(--border))">
                                    {workOrderStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartLegend content={<ChartLegendContent layout="vertical" align="right" verticalAlign="middle" />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                 </CardContent>
              </Card>

               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-accent" />Carga de Trabajo por Técnico</CardTitle>
                </CardHeader>
                 <CardContent>
                   <ChartContainer config={chartConfigTechnician} className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={technicianWorkloadData} layout="vertical" margin={{left: 20, right: 20}}>
                                <CartesianGrid horizontal={false} strokeDasharray="3 3"/>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent hideLabel />} />
                                <Bar dataKey="ots" fill="var(--color-ots)" radius={[0, 4, 4, 0]}/>
                            </RechartsBarChart>
                        </ResponsiveContainer>
                   </ChartContainer>
                 </CardContent>
              </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
