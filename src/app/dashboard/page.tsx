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
import { Wrench, Car, ListChecks } from "lucide-react";
import { WorkOrderStatusTracker } from "@/components/work-order-status-tracker";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const TOTAL_WORKSTATIONS = 6;

export default function DashboardPage() {
  const [activeWorkOrders, setActiveWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Usamos el cliente supabase para traer las OTs que NO están terminadas
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          vehicle:vehicles (
            make,
            model,
            license_plate
          )
        `)
        .not('status', 'in', '("Completado","Entregado")');
        
      if (!error && data) {
        setActiveWorkOrders(data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const vehiclesInWorkshop = activeWorkOrders.length;
  // Simulamos técnicos ocupados (1 por OT activa como ejemplo)
  const occupiedWorkstations = Math.min(activeWorkOrders.length, TOTAL_WORKSTATIONS);
  const availability = TOTAL_WORKSTATIONS > 0 ? ((TOTAL_WORKSTATIONS - occupiedWorkstations) / TOTAL_WORKSTATIONS) * 100 : 0;
    
  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Panel Operativo del Taller" />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        
        {/* --- Fila de KPIs Operativos --- */}
        <div className="grid gap-6 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Vehículos en Taller</CardTitle>
                    <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loading ? "..." : vehiclesInWorkshop}</div>
                    <p className="text-xs text-muted-foreground">Órdenes de trabajo activas (Supabase DB)</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Puestos Ocupados</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loading ? "..." : `${occupiedWorkstations} / ${TOTAL_WORKSTATIONS}`}</div>
                    <p className="text-xs text-muted-foreground">Técnicos trabajando actualmente</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Disponibilidad del Taller</CardTitle>
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{loading ? "..." : `${Math.round(availability)}%`}</div>
                    <Progress value={availability} className="h-2 mt-2" />
                </CardContent>
            </Card>
        </div>
        
        {/* --- Panel de Vehículos en Proceso --- */}
        <Card>
            <CardHeader>
                <CardTitle>Vehículos en Proceso (Tiempo Real)</CardTitle>
                <CardDescription>Visualización en tiempo real obtenida desde la base de datos Supabase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 {loading ? (
                    <div className="text-center text-muted-foreground py-10">Cargando vehículos desde la nube...</div>
                 ) : activeWorkOrders.length > 0 ? activeWorkOrders.map(wo => {
                    const vehicle = wo.vehicle;
                    if (!vehicle) return null;
                    
                    return (
                        <div key={wo.id} className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-6 border-b pb-6 last:border-b-0 last:pb-0">
                           {/* Vehicle Info */}
                           <div className="flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-primary">{vehicle.make} {vehicle.model}</h3>
                                    <p className="font-mono text-xl uppercase tracking-wider bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-center inline-block my-2">{vehicle.license_plate}</p>
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold">Servicio:</span> {wo.service_description}
                                    </p>
                                </div>
                                <Button asChild variant="outline" size="sm" className="mt-4 md:mt-0">
                                    <Link href={`/dashboard/work-orders/${wo.id}`}>
                                        Ver Detalles OT
                                    </Link>
                                </Button>
                           </div>
                           
                           {/* Status Tracker */}
                           <div>
                                <WorkOrderStatusTracker currentStatus={wo.status} />
                           </div>
                        </div>
                    )
                 }) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p className="text-lg font-semibold">No hay vehículos en el taller.</p>
                        <p>Todas las órdenes de trabajo están completadas o el taller está vacío.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
        
      </main>
    </div>
  );
}
