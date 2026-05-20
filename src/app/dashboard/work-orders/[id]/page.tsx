
"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Car, Wrench, Calendar, StickyNote, Package, Edit, Pencil, MessageSquarePlus, Clock, FileCheck, Upload, Download, FileText, Trash2, FileSignature, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { getStatusVariant } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { WorkOrderFormDialog } from "@/components/work-order-form-dialog";
import { useToast } from "@/hooks/use-toast";
import type { WorkOrderStatus, ServiceLogEntry } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ObdScannerTool } from "@/components/obd-scanner-tool";
import { SatisfactionSurveyTool } from "@/components/satisfaction-survey-tool";
import { WorkOrderStatusTracker } from "@/components/work-order-status-tracker";
import { Skeleton } from "@/components/ui/skeleton";

const LABOR_RATE_PER_HOUR = 25000; // Flat labor cost rate per hour (CLP)
const LABOR_REVENUE_MULTIPLIER = 2.5; // Revenue markup on labor cost

export default function WorkOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [workOrder, setWorkOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newLogEntry, setNewLogEntry] = useState("");
  const [attachedFiles, setAttachedFiles] = useState(["Diagnostico_Inicial.pdf"]);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchWorkOrder() {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_orders')
        .select('*, clients(*), vehicles(*), profiles!work_orders_technician_id_fkey(*)')
        .eq('id', params.id)
        .single();

      if (error || !data) {
        console.error("Error fetching work order:", error);
        setWorkOrder(null);
      } else {
        setWorkOrder(data);
      }
      setLoading(false);
    }
    fetchWorkOrder();
  }, [params.id]);

  const handleUpdateStatus = async (newStatus: WorkOrderStatus) => {
    if (!workOrder) return;
    const { error } = await supabase
      .from('work_orders')
      .update({ status: newStatus })
      .eq('id', workOrder.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la orden.",
        variant: "destructive",
      });
      return;
    }

    setWorkOrder({ ...workOrder, status: newStatus });
    toast({
      title: "Estado Actualizado",
      description: `La orden de trabajo ahora está en estado: ${newStatus}.`,
    });
  };

  const handleFormSubmit = async (data: any) => {
    if (!workOrder) return;

    const updatePayload: any = {
      service_description: data.service || data.service_description,
      type: data.type,
      technician_id: data.technician_id || data.technician,
      labor_hours: data.laborHours ?? data.labor_hours,
      parts_used: data.parts ?? data.parts_used,
    };

    if (data.status === 'Completado' || data.status === 'Entregado') {
      updatePayload.completion_date = workOrder.completion_date || new Date().toISOString();
    }

    const { error } = await supabase
      .from('work_orders')
      .update(updatePayload)
      .eq('id', workOrder.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la orden de trabajo.",
        variant: "destructive",
      });
      return;
    }

    setWorkOrder({
      ...workOrder,
      ...updatePayload,
    });
    toast({
      title: "Orden de Trabajo Actualizada",
      description: `Se ha actualizado la orden ${workOrder.id}.`,
    });
    setIsFormOpen(false);
  };

  const handleAddLogEntry = async () => {
    if (!newLogEntry.trim() || !workOrder) return;

    const entry: ServiceLogEntry = {
      timestamp: new Date().toISOString(),
      technician: "Ricardo Milos", // In a real app, this would come from the logged-in user
      entry: newLogEntry.trim(),
    };

    const currentLog = Array.isArray(workOrder.service_log) ? workOrder.service_log : [];
    const updatedLog = [...currentLog, entry];

    const { error } = await supabase
      .from('work_orders')
      .update({ service_log: updatedLog })
      .eq('id', workOrder.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar la entrada a la bitácora.",
        variant: "destructive",
      });
      return;
    }

    setWorkOrder({ ...workOrder, service_log: updatedLog });
    setNewLogEntry("");
    toast({
      title: "Entrada Agregada",
      description: "Se ha añadido una nueva entrada a la bitácora de servicio.",
    });
  };

  const handleSurveySubmit = async (rating: number, comment: string) => {
    if (!workOrder) return;

    const { error } = await supabase
      .from('work_orders')
      .update({ satisfaction_rating: rating, satisfaction_comment: comment })
      .eq('id', workOrder.id);

    if (!error) {
      setWorkOrder({ ...workOrder, satisfaction_rating: rating, satisfaction_comment: comment });
    }
  };

  const handleUploadFile = () => {
    toast({
      title: "Adjuntar Archivo (Simulación)",
      description: "En una aplicación real, aquí se abriría un diálogo para subir un archivo.",
    });
    const newFileName = `Evidencia_${Date.now()}.jpg`;
    setAttachedFiles([...attachedFiles, newFileName]);
  };

  const handleDownloadFile = (fileName: string) => {
    toast({
      title: "Descarga Iniciada (Simulación)",
      description: `Se está descargando el archivo: ${fileName}.`,
    });
  };

  const client = workOrder?.clients;
  const vehicle = workOrder?.vehicles;
  const parts: any[] = Array.isArray(workOrder?.parts_used) ? workOrder.parts_used : [];
  const serviceLog: any[] = Array.isArray(workOrder?.service_log) ? workOrder.service_log : [];

  const financialSummary = useMemo(() => {
    if (!workOrder) return { partsCost: 0, laborCost: 0, totalCost: 0, partsRevenue: 0, laborRevenue: 0, totalRevenue: 0, profit: 0, margin: 0 };

    const partsCost = parts.reduce((acc: number, part: any) => acc + ((part.cost || 0) * (part.quantity || 0)), 0);
    const laborCost = LABOR_RATE_PER_HOUR * (workOrder.labor_hours || 0);

    const totalCost = partsCost + laborCost;

    const partsRevenue = parts.reduce((acc: number, part: any) => acc + ((part.price || 0) * (part.quantity || 0)), 0);
    const laborRevenue = laborCost * LABOR_REVENUE_MULTIPLIER;

    const totalRevenue = partsRevenue + laborRevenue;

    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return { partsCost, laborCost, totalCost, partsRevenue, laborRevenue, totalRevenue, profit, margin };
  }, [workOrder, parts]);

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <DashboardHeader title="Cargando Orden de Trabajo...">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[130px]" />
          </div>
        </DashboardHeader>
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <Skeleton className="h-8 w-[300px]" />
              <Skeleton className="h-4 w-[200px] mt-2" />
            </CardHeader>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader><Skeleton className="h-6 w-[100px]" /></CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><Skeleton className="h-6 w-[100px]" /></CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><Skeleton className="h-6 w-[250px]" /></CardHeader>
                <CardContent>
                  <Skeleton className="h-[200px] w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!workOrder) {
    return <div className="p-6 text-center text-muted-foreground">Orden de trabajo no encontrada.</div>;
  }

  if (!client || !vehicle) {
    return <div>Error: Datos de Cliente o Vehículo no encontrados.</div>;
  }

  return (
    <>
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title={`Orden de Trabajo: ${workOrder.id}`}>
         <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                   <Pencil className="mr-2 h-4 w-4" />
                   Cambiar Estado
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleUpdateStatus('Recibido')}>Recibido</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus('Esperando Aprobación')}>Esperando Aprobación</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus('En Reparación')}>En Reparación</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus('Esperando Repuestos')}>Esperando Repuestos</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus('Completado')}>Completado</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdateStatus('Entregado')}>Entregado</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsFormOpen(true)} variant="secondary">
                <Edit className="mr-2 h-4 w-4" />
                Editar Orden
            </Button>
        </div>
      </DashboardHeader>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        
        {/* --- Main Info & Status Tracker --- */}
        <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl">{workOrder.service_description}</CardTitle>
                        <CardDescription>Técnico Asignado: {workOrder.profiles?.name || 'Sin asignar'}</CardDescription>
                    </div>
                     <div className="flex items-center gap-4 text-sm">
                        <div>
                            <p className="font-semibold">Ingreso:</p>
                            <p className="text-muted-foreground">{new Date(workOrder.entry_date).toLocaleString()}</p>
                        </div>
                        {workOrder.completion_date && (
                            <div>
                                <p className="font-semibold">Finalización:</p>
                                <p className="text-muted-foreground">{new Date(workOrder.completion_date).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                 <WorkOrderStatusTracker currentStatus={workOrder.status} />
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

             {/* --- Left Column: Details & Tools --- */}
             <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center"><User className="mr-2"/> Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><strong>Nombre:</strong> {client.name}</p>
                        <p><strong>Email:</strong> {client.email}</p>
                        <p><strong>Teléfono:</strong> {client.phone}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center"><Car className="mr-2"/> Vehículo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><strong>Patente:</strong> <span className="font-mono uppercase">{vehicle.license_plate}</span></p>
                        <p><strong>Marca / Modelo:</strong> {vehicle.make} {vehicle.model}</p>
                        <p><strong>Año:</strong> {vehicle.year}</p>
                        <p><strong>VIN:</strong> <span className="font-mono">{vehicle.vin}</span></p>
                        {vehicle.motor_number && (
                          <p><strong>N° Motor:</strong> <span className="font-mono">{vehicle.motor_number}</span></p>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><DollarSign className="mr-2"/> Resumen Financiero (Interno)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                       <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Costo Repuestos</span>
                            <span className="font-medium">${financialSummary.partsCost.toLocaleString('es-CL')}</span>
                       </div>
                       <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Costo Mano Obra ({workOrder.labor_hours || 0}h)</span>
                            <span className="font-medium">${Math.round(financialSummary.laborCost).toLocaleString('es-CL')}</span>
                       </div>
                        <Separator/>
                        <div className="flex justify-between items-center font-bold text-base">
                            <span className="flex items-center"><TrendingDown className="mr-2 text-destructive"/> Costo Total</span>
                            <span>${Math.round(financialSummary.totalCost).toLocaleString('es-CL')}</span>
                       </div>
                    </CardContent>
                    <CardContent className="space-y-3 text-sm pt-0">
                       <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Ingreso Repuestos</span>
                            <span className="font-medium">${financialSummary.partsRevenue.toLocaleString('es-CL')}</span>
                       </div>
                       <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Ingreso Mano Obra</span>
                            <span className="font-medium">${Math.round(financialSummary.laborRevenue).toLocaleString('es-CL')}</span>
                       </div>
                        <Separator/>
                        <div className="flex justify-between items-center font-bold text-base">
                            <span className="flex items-center"><TrendingUp className="mr-2 text-green-500"/> Ingreso Total</span>
                            <span>${Math.round(financialSummary.totalRevenue).toLocaleString('es-CL')}</span>
                       </div>
                       <Separator />
                       <div className="flex justify-between items-center font-bold text-lg text-primary">
                            <span>Ganancia Bruta</span>
                            <div className="text-right">
                                <span>${Math.round(financialSummary.profit).toLocaleString('es-CL')}</span>
                                <p className="text-xs font-normal text-muted-foreground">Margen: {financialSummary.margin.toFixed(1)}%</p>
                            </div>
                       </div>
                    </CardContent>
                </Card>
                <ObdScannerTool onScan={(code) => setNewLogEntry(`Código OBD-II: ${code}`)} />
                {workOrder.status === 'Entregado' && (
                  <SatisfactionSurveyTool workOrder={workOrder} onSurveySubmit={handleSurveySubmit} />
                )}
             </div>

            {/* --- Right Column: Logs, Parts, Files --- */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><StickyNote className="mr-2"/> Bitácora de Servicio (Interna)</CardTitle>
                        <CardDescription>Registro cronológico de todas las acciones y observaciones técnicas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 -mr-4">
                            {serviceLog.map((log: any, index: number) => (
                                <div key={index} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="bg-accent rounded-full p-1.5 text-accent-foreground">
                                            <Clock className="h-4 w-4" />
                                        </div>
                                        <div className="flex-grow w-px bg-border my-1"></div>
                                    </div>
                                    <div className="w-full pb-4">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-sm">{log.technician}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{log.entry}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex flex-col gap-2 pt-4 border-t">
                            <Textarea 
                                placeholder="Añadir nueva entrada a la bitácora..."
                                value={newLogEntry}
                                onChange={(e) => setNewLogEntry(e.target.value)}
                                rows={3}
                            />
                            <Button onClick={handleAddLogEntry} size="sm" className="self-end" variant="secondary">
                                <MessageSquarePlus className="mr-2 h-4 w-4" />
                                Agregar Entrada
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                 {workOrder.final_report && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><FileSignature className="mr-2"/> Informe Final para Cliente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-sm text-muted-foreground whitespace-pre-wrap">
                               {workOrder.final_report}
                            </div>
                        </CardContent>
                    </Card>
                 )}


                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Package className="mr-2"/> Repuestos y Materiales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre del Repuesto</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Cantidad</TableHead>
                                    <TableHead className="text-right">Precio Venta</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parts.length > 0 ? parts.map((part: any) => (
                                    <TableRow key={part.sku}>
                                        <TableCell className="font-medium">{part.name}</TableCell>
                                        <TableCell className="font-mono">{part.sku}</TableCell>
                                        <TableCell className="text-right">{part.quantity}</TableCell>
                                        <TableCell className="text-right">${(part.price || 0).toLocaleString('es-CL')}</TableCell>
                                        <TableCell className="text-right font-semibold">${((part.price || 0) * (part.quantity || 0)).toLocaleString('es-CL')}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No se registraron repuestos para esta orden.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                    <CardTitle>Documentos Adjuntos y Evidencias</CardTitle>
                    <CardDescription>
                        Gestione los archivos asociados a esta Orden de Trabajo.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <ul className="space-y-3">
                        {attachedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground"/>
                                <span className="font-medium">{file}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadFile(file)}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                            </Button>
                        </li>
                        ))}
                    </ul>
                    </CardContent>
                    <CardFooter>
                    <Button variant="outline" onClick={handleUploadFile}>
                        <Upload className="mr-2 h-4 w-4" />
                        Adjuntar Nuevo Documento
                    </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      </main>
    </div>
    <WorkOrderFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        workOrder={workOrder}
      />
    </>
  );
}