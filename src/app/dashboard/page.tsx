
"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wrench, Car, Clock, BarChart, CheckCircle, Percent, Smile, Package, Users, DollarSign, ListChecks } from "lucide-react";
import { workOrders as allWorkOrders, clients, vehicles } from "@/lib/data";
import { WorkOrderStatusTracker } from "@/components/work-order-status-tracker";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const TOTAL_WORKSTATIONS = 3;

export default function DashboardPage() {
    
  const activeWorkOrders = allWorkOrders.filter(wo => wo.status !== 'Completado' && wo.status !== 'Entregado');
  const vehiclesInWorkshop = activeWorkOrders.length;
  const occupiedWorkstations = new Set(activeWorkOrders.map(wo => wo.technician)).size; // Simple simulation of occupied stations
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
                    <div className="text-2xl font-bold">{vehiclesInWorkshop}</div>
                    <p className="text-xs text-muted-foreground">Órdenes de trabajo activas</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Puestos Ocupados</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{occupiedWorkstations} / {TOTAL_WORKSTATIONS}</div>
                    <p className="text-xs text-muted-foreground">Técnicos trabajando actualmente</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Disponibilidad del Taller</CardTitle>
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{Math.round(availability)}%</div>
                    <Progress value={availability} className="h-2 mt-2" />
                </CardContent>
            </Card>
        </div>
        
        {/* --- Panel de Vehículos en Proceso --- */}
        <Card>
            <CardHeader>
                <CardTitle>Vehículos en Proceso</CardTitle>
                <CardDescription>Visualización en tiempo real del estado de cada vehículo en el taller.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 {activeWorkOrders.length > 0 ? activeWorkOrders.map(wo => {
                    const vehicle = vehicles.find(v => v.id === wo.vehicleId);
                    if (!vehicle) return null;
                    
                    return (
                        <div key={wo.id} className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-6 border-b pb-6 last:border-b-0 last:pb-0">
                           {/* Vehicle Info */}
                           <div className="flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-primary">{vehicle.make} {vehicle.model}</h3>
                                    <p className="font-mono text-xl uppercase tracking-wider bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-center inline-block my-2">{vehicle.licensePlate}</p>
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold">Servicio:</span> {wo.service}
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
