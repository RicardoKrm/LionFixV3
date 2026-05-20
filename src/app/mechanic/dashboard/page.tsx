
"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wrench, Calendar, SlidersHorizontal, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { workOrders, clients, vehicles, calendarEvents } from "@/lib/data";
import type { EnrichedWorkOrder } from "@/types";
import { WorkOrderCard } from "@/components/work-order-card";
import { WorkshopCalendar } from "@/components/workshop-calendar";
import { AppointmentFormDialog } from "@/components/appointment-form-dialog";
import { useRouter } from "next/navigation";

// Simulamos que el mecánico logueado es 'Ricardo Milos'
const LOGGED_IN_MECHANIC = 'Ricardo Milos';

export default function MechanicDashboard() {
  const router = useRouter();

  const assignedWorkOrders: EnrichedWorkOrder[] = workOrders
    .filter(wo => wo.technician === LOGGED_IN_MECHANIC && wo.status !== 'Entregado' && wo.status !== 'Completado')
    .map((wo) => ({
      ...wo,
      client: clients.find((c) => c.id === wo.clientId)!,
      vehicle: vehicles.find((v) => v.id === wo.vehicleId)!,
    }))
    .sort(
      (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-primary">Panel del Mecánico</h1>
            <p className="text-muted-foreground">Bienvenido, {LOGGED_IN_MECHANIC}. Aquí están tus tareas y herramientas.</p>
        </div>
         <Button variant="outline" onClick={() => router.push('/dashboard/work-orders')}>
            <SlidersHorizontal className="mr-2 h-4 w-4"/>
            Ver Todas las Órdenes
        </Button>
      </div>
      
      {/* Mis Órdenes de Trabajo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wrench/> Mis Órdenes de Trabajo Activas</CardTitle>
          <CardDescription>Estas son las órdenes de trabajo que tienes asignadas y que requieren tu atención.</CardDescription>
        </CardHeader>
        <CardContent>
            {assignedWorkOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignedWorkOrders.map(wo => (
                        <WorkOrderCard key={wo.id} workOrder={wo} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    <p className="text-lg font-semibold">¡Todo al día!</p>
                    <p>No tienes órdenes de trabajo activas asignadas.</p>
                </div>
            )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Acceso a Checklists */}
        <Card className="flex flex-col justify-center items-center text-center group hover:border-accent transition-colors">
          <CardHeader>
             <ClipboardCheck className="h-12 w-12 mx-auto text-accent"/>
             <CardTitle>Consultar Checklists</CardTitle>
             <CardDescription>Revisa los informes de recepción, fotos y detalles antes de comenzar a trabajar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/management/checklists">
                Ir a Checklists <ArrowRight className="ml-2"/>
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Calendario del Taller */}
        <Card className="flex flex-col justify-center items-center text-center group hover:border-accent transition-colors">
          <CardHeader>
            <Calendar className="h-12 w-12 mx-auto text-accent"/>
            <CardTitle>Calendario del Taller</CardTitle>
            <CardDescription>Visualiza todas las citas agendadas y la planificación de los puestos de trabajo.</CardDescription>
          </CardHeader>
           <CardContent>
             <Button asChild>
              <Link href="/dashboard/calendar">
                Ver Calendario <ArrowRight className="ml-2"/>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
