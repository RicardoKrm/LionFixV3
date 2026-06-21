"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wrench, Car, ListChecks, GripVertical, AlertTriangle, Flame, ArrowDown } from "lucide-react";
import { WorkOrderStatusTracker } from "@/components/work-order-status-tracker";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const TOTAL_WORKSTATIONS = 6;

const PRIORITY_LABELS: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  1: { label: "🔥 Urgente", color: "bg-red-500/20 border-red-500/50 text-red-400", icon: <Flame className="w-3 h-3 text-red-400" /> },
  2: { label: "⚠️ Alta", color: "bg-orange-500/20 border-orange-500/50 text-orange-400", icon: <AlertTriangle className="w-3 h-3 text-orange-400" /> },
  3: { label: "📋 Normal", color: "bg-blue-500/10 border-blue-500/20 text-blue-400", icon: <ArrowDown className="w-3 h-3 text-blue-400" /> },
};

export default function DashboardPage() {
  const [activeWorkOrders, setActiveWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const orderKey = "dashboard_wo_order";

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoadError(null);
      try {
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
          
        if (error) {
          console.error("Dashboard fetch error:", error);
          setLoadError(error.message || "Error al cargar los datos.");
        } else if (data) {
          // Restore saved order from localStorage
          try {
            const savedOrder = JSON.parse(localStorage.getItem(orderKey) || "[]") as string[];
            if (savedOrder.length > 0) {
              const ordered = [...data].sort((a, b) => {
                const ia = savedOrder.indexOf(a.id);
                const ib = savedOrder.indexOf(b.id);
                if (ia === -1 && ib === -1) return 0;
                if (ia === -1) return 1;
                if (ib === -1) return -1;
                return ia - ib;
              });
              setActiveWorkOrders(ordered);
            } else {
              setActiveWorkOrders(data);
            }
          } catch {
            setActiveWorkOrders(data);
          }
        }
      } catch (err: any) {
        const msg = err?.name === 'AbortError'
          ? 'La conexión tardó demasiado. Supabase puede estar despertando — intenta de nuevo.'
          : (err?.message || 'Error de conexión inesperado.');
        setLoadError(msg);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const saveOrder = (orders: any[]) => {
    localStorage.setItem(orderKey, JSON.stringify(orders.map(o => o.id)));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== draggedId) setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    setActiveWorkOrders(prev => {
      const newList = [...prev];
      const fromIdx = newList.findIndex(wo => wo.id === draggedId);
      const toIdx = newList.findIndex(wo => wo.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = newList.splice(fromIdx, 1);
      newList.splice(toIdx, 0, moved);
      saveOrder(newList);
      return newList;
    });

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const getPriority = (index: number) => {
    if (index === 0) return 1;
    if (index === 1) return 2;
    return 3;
  };

  const vehiclesInWorkshop = activeWorkOrders.length;
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
                <CardDescription>
                  Arrastra y suelta cada vehículo para definir su prioridad. El primero es el más urgente.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                 {loading ? (
                    <div className="text-center text-muted-foreground py-10 animate-pulse">Cargando vehículos desde la nube...</div>
                 ) : loadError ? (
                    <div className="text-center py-10 space-y-4">
                        <div className="text-4xl">⚠️</div>
                        <p className="text-muted-foreground max-w-md mx-auto">{loadError}</p>
                        <Button variant="outline" onClick={() => window.location.reload()}>Reintentar conexión</Button>
                    </div>
                 ) : activeWorkOrders.length > 0 ? activeWorkOrders.map((wo, index) => {
                    const vehicle = wo.vehicle;
                    if (!vehicle) return null;
                    const priority = getPriority(index);
                    const priorityInfo = PRIORITY_LABELS[priority];
                    const isDragging = draggedId === wo.id;
                    const isDragOver = dragOverId === wo.id;

                    return (
                        <div
                          key={wo.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, wo.id)}
                          onDragOver={(e) => handleDragOver(e, wo.id)}
                          onDrop={(e) => handleDrop(e, wo.id)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "grid grid-cols-1 md:grid-cols-[auto_1fr_3fr] gap-4 border rounded-xl p-4 transition-all duration-200 cursor-grab active:cursor-grabbing select-none",
                            isDragging && "opacity-40 scale-[0.98] shadow-inner",
                            isDragOver && "border-primary/70 bg-primary/5 shadow-lg shadow-primary/10 scale-[1.01]",
                            !isDragging && !isDragOver && "border-border hover:border-muted-foreground/40 hover:bg-muted/30",
                            priority === 1 && "border-l-4 border-l-red-500",
                            priority === 2 && "border-l-4 border-l-orange-400",
                            priority === 3 && "border-l-4 border-l-border",
                          )}
                        >
                           {/* Drag handle + priority */}
                           <div className="flex md:flex-col items-center justify-between md:justify-start gap-2 md:gap-3 md:pt-1">
                             <div className="flex items-center gap-2 md:flex-col md:items-center">
                               <GripVertical className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                               <span className="text-2xl font-black text-muted-foreground/30 leading-none select-none md:text-3xl">
                                 {index + 1}
                               </span>
                             </div>
                             <Badge
                               variant="outline"
                               className={cn("text-[10px] font-semibold px-2 py-0.5 whitespace-nowrap", priorityInfo.color)}
                             >
                               {priorityInfo.label}
                             </Badge>
                           </div>

                           {/* Vehicle Info */}
                           <div className="flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-primary">{vehicle.make} {vehicle.model}</h3>
                                    <p className="font-mono text-xl uppercase tracking-wider bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-center inline-block my-2">{vehicle.license_plate}</p>
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold">Servicio:</span> {wo.service_description}
                                    </p>
                                </div>
                                <Button asChild variant="outline" size="sm" className="mt-4 md:mt-2 w-fit">
                                    <Link href={`/dashboard/work-orders/${wo.id}`}>
                                        Ver Detalles OT
                                    </Link>
                                </Button>
                           </div>
                           
                           {/* Status Tracker */}
                           <div className="overflow-hidden">
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
