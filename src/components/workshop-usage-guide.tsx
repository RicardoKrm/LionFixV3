"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home,
  Wrench,
  ClipboardCheck,
  FileDigit,
  Calendar,
  Users,
  Package,
  BookOpen,
  BarChart,
  UserSquare,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Search,
  Sparkles,
  Download,
} from "lucide-react";

export interface GuideModuleItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  href: string;
  badge: string;
  icon: any;
  colorClass: string;
  summary: string;
  capabilities: string[];
  quickTip: string;
}

export const WORKSHOP_GUIDE_MODULES: GuideModuleItem[] = [
  {
    id: "dashboard",
    number: "01",
    title: "Panel de Control",
    subtitle: "Monitoreo operativo del taller en tiempo real",
    href: "/dashboard",
    badge: "Operación en Vivo",
    icon: Home,
    colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    summary:
      "Vista centralizada del estado actual del taller, capacidad instalada de estaciones de trabajo y priorización de vehículos activos.",
    capabilities: [
      "Visualizar KPIs en vivo: Vehículos en Taller, Puestos Ocupados (de 6 estaciones) y % de Disponibilidad.",
      "Arrastrar y soltar (Drag & Drop) las tarjetas de vehículos para cambiar el orden de prioridad (🔥 Urgente, ⚠️ Alta, 📋 Normal).",
      "Seguir la barra de progreso de cada vehículo según su etapa actual en el taller.",
      "Reanudar órdenes pausadas con un clic o abrir directamente el expediente completo de la Orden de Trabajo.",
    ],
    quickTip:
      "El orden que definas arrastrando los vehículos se guarda automáticamente para mantener clara la prioridad de atención.",
  },
  {
    id: "work-orders",
    number: "02",
    title: "Órdenes de Trabajo (OT)",
    subtitle: "Gestión integral de reparaciones y mantenciones",
    href: "/dashboard/work-orders",
    badge: "Núcleo del Taller",
    icon: Wrench,
    colorClass: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    summary:
      "Controla todo el ciclo de vida de un vehículo desde que ingresa al taller hasta que es entregado al cliente.",
    capabilities: [
      "Crear Órdenes de Trabajo con folio automático (OT-AAAA-NNNN), cliente, vehículo, tipo de servicio, técnico, horas y repuestos.",
      "Filtrar órdenes por estado (Activas, Finalizadas, Todas) y consultar patentes al instante con el buscador rápido.",
      "En el detalle de cada OT: controlar el cronómetro de horas trabajadas, registrar avances en la Bitácora del Mecánico y cambiar etapas.",
      "Usar el Escáner OBD-II integrado, adjuntar fotografías/evidencias en la nube, calcular rentabilidad (repuestos + mano de obra) y abrir HaynesPro.",
    ],
    quickTip:
      "Dentro de cualquier OT puedes pulsar el botón 'Manuales & HaynesPro' arriba a la derecha para consultar torques sin perder el contexto.",
  },
  {
    id: "checklists",
    number: "03",
    title: "Checklists de Recepción y Entrega",
    subtitle: "Inspección vehicular paso a paso con evidencia fotográfica",
    href: "/dashboard/management/checklists",
    badge: "Control de Calidad",
    icon: ClipboardCheck,
    colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    summary:
      "Registra el estado exacto en que entra y sale cada vehículo mediante un asistente guiado de 3 etapas.",
    capabilities: [
      "Crear Checklists de Recepción (combustible, carrocería, luces, neumáticos, fluidos, objetos de valor) o de Entrega.",
      "Personalizar la lista agregando nuevos puntos de verificación o quitando los que no apliquen al vehículo.",
      "Subir fotos clasificadas en 3 categorías: Foto Principal (Portada), Evidencias de Entrada y Evidencias de Salida.",
      "Vincular el checklist a una Orden de Trabajo: al guardar un Checklist de Entrega se marca automáticamente la OT como 'Entregado'.",
    ],
    quickTip:
      "La foto que subas en la categoría 'Foto Principal (Portada)' se mostrará automáticamente como imagen de portada en la tarjeta de la OT.",
  },
  {
    id: "quotes",
    number: "04",
    title: "Cotizaciones y Presupuestos",
    subtitle: "Elaboración, envío por WhatsApp/PDF y conversión a OT",
    href: "/dashboard/finance/quotes",
    badge: "Comercial",
    icon: FileDigit,
    colorClass: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    summary:
      "Genera presupuestos formales detallados para aprobación del cliente antes de iniciar la intervención mecánica.",
    capabilities: [
      "Crear cotizaciones foliadas automáticamente (COT-AAAA-NNN) seleccionando cliente, vehículo y múltiples ítems/repuestos.",
      "Cálculo automático de Subtotal Neto, IVA (19%) y Total en pesos chilenos ($ CLP).",
      "Gestionar estados del presupuesto: Enviada, Aprobada, Rechazada o Convertida a OT.",
      "Enviar notificación directa al WhatsApp del cliente, descargar/imprimir el PDF formal y convertir la cotización aprobada en una OT con 1 clic.",
    ],
    quickTip:
      "Cuando una cotización cambia a estado 'Aprobada', se habilita el botón 'Convertir a OT' que crea la Orden de Trabajo automáticamente.",
  },
  {
    id: "calendar",
    number: "05",
    title: "Calendario / Pizarra de Programación",
    subtitle: "Planificación horaria de mecánicos y citas agendadas",
    href: "/dashboard/calendar",
    badge: "Agenda & Turnos",
    icon: Calendar,
    colorClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    summary:
      "Pizarra interactiva para distribuir la carga de trabajo entre los técnicos del taller por hora, día, semana o mes.",
    capabilities: [
      "Alternar vistas por Día, Semana o Mes con bloques horarios operativos de 08:00 a 18:00 hrs.",
      "Arrastrar órdenes pendientes o citas de clientes desde la bandeja lateral hacia el horario de un mecánico específico.",
      "Distinguir tipos de servicio por color (Preventiva, Correctiva, Evaluativa, Inspección) y filtrar mecánicos visibles.",
      "Configurar y administrar Fechas Bloqueadas o días no hábiles del taller.",
    ],
    quickTip:
      "Los mecánicos que registres en el módulo 'Personal & Usuarios' aparecerán automáticamente como filas disponibles en esta pizarra.",
  },
  {
    id: "clients",
    number: "06",
    title: "Clientes y Vehículos (CRM)",
    subtitle: "Base de datos de propietarios, flotas e historial clínico",
    href: "/dashboard/clients",
    badge: "CRM & Flota",
    icon: Users,
    colorClass: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    summary:
      "Administra la cartera de clientes del taller, todos sus vehículos asociados y el historial completo de intervenciones.",
    capabilities: [
      "Registrar un nuevo cliente junto con su vehículo principal en un solo formulario ('Nuevo Cliente').",
      "Buscar instantáneamente por nombre, correo electrónico o número de teléfono.",
      "Desplegar cualquier cliente para ver todos sus vehículos (Patente, Marca, Modelo, Año y número de chasis/VIN).",
      "Añadir vehículos adicionales a un cliente existente y abrir el Historial Clínico completo de cada patente.",
    ],
    quickTip:
      "Haz clic en la flecha izquierda de cada cliente para desplegar sus vehículos y acceder al botón 'Ver Historial' de cada patente.",
  },
  {
    id: "inventory",
    number: "07",
    title: "Inventario de Repuestos",
    subtitle: "Control de bodega, costos, precios y alertas de stock crítico",
    href: "/dashboard/inventory",
    badge: "Bodega & Stock",
    icon: Package,
    colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    summary:
      "Gestiona el catálogo de repuestos e insumos del taller con alertas automáticas de reposición y valorización financiera.",
    capabilities: [
      "Monitorear KPIs de bodega: Valor Total del Inventario, Cantidad de Ítems en Stock Crítico y Total de SKUs.",
      "Crear, editar y eliminar repuestos indicando SKU, nombre, stock actual, stock mínimo de alerta, ubicación, proveedor, costo y precio de venta.",
      "Filtrar con 1 clic en la pestaña 'Stock Bajo / Crítico' los repuestos que requieren compra urgente.",
      "Generar Órdenes de Compra para proveedores directamente desde los repuestos con bajo stock.",
    ],
    quickTip:
      "Los repuestos registrados aquí quedan disponibles de inmediato para ser agregados dentro de las Órdenes de Trabajo.",
  },
  {
    id: "manuals",
    number: "08",
    title: "Manuales & Torques + HaynesPro",
    subtitle: "Especificaciones técnicas, bloc de notas y ventana directa HaynesPro",
    href: "/dashboard/manuals",
    badge: "Soporte Técnico",
    icon: BookOpen,
    colorClass: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    summary:
      "Centro de consulta técnica para el mecánico con tablas de apriete, capacidades de fluidos, manuales PDF y acceso integrado a HaynesPro.",
    capabilities: [
      "Consultar tablas rápidas de Torques de Apriete (Nm) y Capacidades de Fluidos por modelo y sistema (Motor, Frenos, Suspensión, Transmisión).",
      "Subir, buscar y visualizar manuales técnicos en formato PDF dentro del navegador.",
      "Escribir mediciones, códigos de falla (DTC) y observaciones en el Bloc de Notas del Mecánico con guardado automático.",
      "Operar en la Ventana Directa HaynesPro (situada al lado derecho del Bloc de Notas) con opción de vista embebida, pantalla completa o ventana acoplada.",
    ],
    quickTip:
      "Si el navegador bloquea el inicio de sesión de HaynesPro por políticas de seguridad, usa el botón 'Abrir Ventana Directa Acoplada' en el mismo panel.",
  },
  {
    id: "reports",
    number: "09",
    title: "Reportes y Exportación Excel",
    subtitle: "Descarga directa de toda la información del software en Excel",
    href: "/dashboard/finance/reports",
    badge: "Excel / Gestión",
    icon: BarChart,
    colorClass: "text-green-400 bg-green-500/10 border-green-500/30",
    summary:
      "Panel simplificado para visualizar métricas clave del taller y descargar bases de datos completas en formato Excel (.csv).",
    capabilities: [
      "Exportar en 1 clic la planilla Excel de Órdenes de Trabajo (folios, clientes, patentes, estados, horas y montos).",
      "Exportar la planilla Excel de Cotizaciones y Presupuestos con su estado de aprobación.",
      "Exportar la planilla Excel de Inventario Valorizado (costos, precios, márgenes unitarios, valor stock y alertas).",
      "Exportar la Base de Clientes y Vehículos, o usar el botón 'Descargar Todo en Excel' para obtener los 4 reportes simultáneamente.",
    ],
    quickTip:
      "Todos los archivos incluyen codificación UTF-8 con BOM y separador ';' para que Microsoft Excel en español abra tildes y columnas automáticamente.",
  },
  {
    id: "users",
    number: "10",
    title: "Personal & Usuarios",
    subtitle: "Administración de mecánicos, administradores y niveles de acceso",
    href: "/dashboard/management/users",
    badge: "Administración",
    icon: UserSquare,
    colorClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    summary:
      "Gestiona el equipo humano del taller y define qué rol cumple cada usuario dentro de la plataforma.",
    capabilities: [
      "Registrar nuevos integrantes del taller (Mecánicos, Administradores o Clientes) con nombre, correo y rol.",
      "Cambiar el rol de cualquier usuario en tiempo real desde el selector de nivel de acceso.",
      "Buscar usuarios rápidamente por nombre o correo electrónico.",
      "Sincronizar automáticamente los mecánicos registrados con los selectores de Órdenes de Trabajo y la Pizarra de Calendario.",
    ],
    quickTip:
      "Registra aquí a todos tus técnicos con el rol 'Mecánico' para poder asignarles órdenes de trabajo y horarios en el calendario.",
  },
];

export function WorkshopUsageGuide({ compact = false }: { compact?: boolean }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredModules = WORKSHOP_GUIDE_MODULES.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.subtitle.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q) ||
      m.capabilities.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <Card className="border-primary/30 bg-card/70 backdrop-blur-sm shadow-xl">
      <CardHeader className="border-b border-border/60 bg-muted/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/15 text-primary">
                <HelpCircle className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary font-semibold">
                Manual Interactivo del Sistema
              </Badge>
            </div>
            <CardTitle className="text-xl md:text-2xl font-bold mt-2">
              Guía de Uso de Cada Panel y Funcionalidades del Software
            </CardTitle>
            <CardDescription className="text-sm">
              Consulta qué hace cada uno de los 10 módulos de LionFix Service y todas las acciones disponibles paso a paso.
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar función (ej. Excel, HaynesPro, OT)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button asChild variant="default" size="sm" className="shrink-0 bg-amber-500 hover:bg-amber-600 text-black font-bold">
              <a href="/Proceso_Cliente_LionFix_Service.pdf" download="Proceso_Cliente_LionFix_Service.pdf">
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF Proceso Cliente
              </a>
            </Button>
            {compact && (
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/dashboard/guide">
                  Ver Guía en Pantalla Completa
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Navegación rápida por botones de módulo */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedId === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedId(null)}
            className="h-8 text-xs"
          >
            Todos los Módulos ({WORKSHOP_GUIDE_MODULES.length})
          </Button>
          {WORKSHOP_GUIDE_MODULES.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedId === m.id;
            return (
              <Button
                key={m.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedId(isSelected ? null : m.id)}
                className="h-8 text-xs gap-1.5"
              >
                <Icon className="h-3.5 w-3.5" />
                {m.number}. {m.title}
              </Button>
            );
          })}
        </div>

        {/* Tarjetas detalladas de cada panel */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredModules
            .filter((m) => (selectedId ? m.id === selectedId : true))
            .map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  className="flex flex-col justify-between rounded-xl border border-border/70 bg-background/70 p-5 hover:border-primary/40 transition-all shadow-sm"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${mod.colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">
                              MÓDULO {mod.number}
                            </span>
                            <Badge variant="secondary" className="text-[10px] px-2 py-0">
                              {mod.badge}
                            </Badge>
                          </div>
                          <h3 className="text-base font-bold text-foreground mt-0.5">
                            {mod.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">{mod.subtitle}</p>
                        </div>
                      </div>

                      <Button asChild variant="outline" size="sm" className="shrink-0 h-8 text-xs">
                        <Link href={mod.href}>
                          Ir al Panel
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {mod.summary}
                    </p>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                        ¿Qué puedes hacer en este panel?
                      </p>
                      <ul className="space-y-1.5">
                        {mod.capabilities.map((cap, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-start gap-2 text-xs text-amber-300/90 bg-amber-500/5 p-2.5 rounded-lg">
                    <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Consejo práctico:</strong> {mod.quickTip}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
