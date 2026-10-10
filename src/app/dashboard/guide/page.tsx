"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { WorkshopUsageGuide } from "@/components/workshop-usage-guide";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const WORKFLOW_STEPS = [
  {
    step: "Paso 1",
    title: "Registro de Cliente y Vehículo",
    module: "Clientes",
    desc: "Ingresa al cliente y la patente de su vehículo en el módulo Clientes (si aún no está registrado).",
  },
  {
    step: "Paso 2",
    title: "Cotización o Checklist de Recepción",
    module: "Cotizaciones / Checklists",
    desc: "Crea el presupuesto (y conviértelo a OT al aprobarse) o levanta el Checklist de Recepción con fotos de entrada.",
  },
  {
    step: "Paso 3",
    title: "Orden de Trabajo y Programación",
    module: "Órdenes de Trabajo / Calendario",
    desc: "Asigna mecánico en la Pizarra de Calendario, usa Manuales & HaynesPro, registra repuestos y avanza el estado de la OT.",
  },
  {
    step: "Paso 4",
    title: "Entrega y Exportación a Excel",
    module: "Checklists / Reportes",
    desc: "Completa el Checklist de Entrega para cerrar la OT y descarga toda tu gestión en Excel desde el panel de Reportes.",
  },
];

export default function GuidePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Guía de Uso del Sistema (Manual Completo)" />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Flujo recomendado de operación del taller */}
        <Card className="border-primary/25 bg-gradient-to-r from-primary/10 via-card to-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">Flujo Operativo Recomendado</Badge>
              <span className="text-xs text-muted-foreground">De principio a fin en 4 etapas</span>
            </div>
            <CardTitle className="text-lg mt-1">
              ¿Cómo operar un vehículo desde que llega hasta que se entrega?
            </CardTitle>
            <CardDescription>
              Sigue este recorrido estándar dentro de LionFix Service para aprovechar todos los módulos conectados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {WORKFLOW_STEPS.map((item, idx) => (
                <div
                  key={item.step}
                  className="relative rounded-xl border border-border/70 bg-background/80 p-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-primary border-primary/40 font-mono text-xs">
                        {item.step}
                      </Badge>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {item.module}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10 bg-background rounded-full p-0.5 border border-primary/30" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Guía detallada de los 10 paneles */}
        <WorkshopUsageGuide />
      </main>
    </div>
  );
}
