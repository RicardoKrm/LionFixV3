
"use client";

import { notFound } from "next/navigation";
import { clients, vehicles, quotes } from "@/lib/data";
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
import { User, Car, Calendar, FileText, CheckCircle, XCircle, Send, Printer, Wrench, Building, ShieldCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getStatusVariant } from "@/lib/utils";
import { useState } from "react";
import type { QuoteStatus } from "@/types";

export default function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const quote = quotes.find((q) => q.id === params.id);
  const { toast } = useToast();
  
  const [status, setStatus] = useState<QuoteStatus>(quote?.status || 'Enviada');


  if (!quote) {
    notFound();
  }
  
  const client = clients.find((c) => c.id === quote.clientId);
  const vehicle = vehicles.find((v) => v.id === quote.vehicleId);

  const handleApprove = () => {
    setStatus("Aprobada");
    toast({
      title: "Cotización Aprobada",
      description: "La cotización ha sido marcada como aprobada. Puede proceder a crear la Orden de Trabajo.",
    });
  }

  const handleReject = () => {
    setStatus("Rechazada");
    toast({
      variant: "destructive",
      title: "Cotización Rechazada",
      description: "La cotización ha sido marcada como rechazada.",
    });
  }
  
  const handleSend = () => {
    toast({
      title: "Cotización Enviada",
      description: `La cotización ${quote.id} ha sido enviada a ${client?.email}.`,
    });
  }
  
  const handleConvertToOT = () => {
    toast({
      title: "Orden de Trabajo Creada (Simulación)",
      description: `Se ha generado la OT-2024-005 a partir de la cotización ${quote.id}.`,
    });
  }

  if (!client || !vehicle) {
    return <div>Error: Datos de Cliente o Vehículo no encontrados.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title={`Detalle de Cotización: ${quote.id}`}>
        <div className="flex items-center gap-2">
             {status === 'Aprobada' && (
                <Button onClick={handleConvertToOT}>
                    <Wrench className="mr-2 h-4 w-4"/>
                    Convertir a OT
                </Button>
            )}
        </div>
      </DashboardHeader>
      <main className="flex-1 p-6 overflow-y-auto bg-muted/30 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Principal - Documento */}
        <div className="lg:col-span-2 bg-card p-8 rounded-lg shadow-lg flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start pb-6 border-b">
                <div className="flex items-center gap-4">
                     <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                     <div>
                        <h2 className="text-xl font-bold">LionFix Service SPA</h2>
                        <p className="text-muted-foreground text-sm">Av. Siempreviva 742, Santiago</p>
                     </div>
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-bold text-primary">COTIZACIÓN</h1>
                    <p className="text-muted-foreground font-mono">{quote.id}</p>
                </div>
            </div>
           
            {/* Client and Vehicle Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                <div className="space-y-1.5">
                    <h3 className="font-semibold text-muted-foreground mb-2">CLIENTE</h3>
                    <p><strong className="w-20 inline-block">Nombre:</strong> {client.name}</p>
                    <p><strong className="w-20 inline-block">Email:</strong> {client.email}</p>
                    <p><strong className="w-20 inline-block">Teléfono:</strong> {client.phone}</p>
                </div>
                 <div className="space-y-1.5">
                    <h3 className="font-semibold text-muted-foreground mb-2">VEHÍCULO</h3>
                    <p><strong className="w-28 inline-block">Patente:</strong> <span className="font-mono uppercase">{vehicle.licensePlate}</span></p>
                    <p><strong className="w-28 inline-block">Marca/Modelo:</strong> {vehicle.make} {vehicle.model} ({vehicle.year})</p>
                    <p><strong className="w-28 inline-block">VIN:</strong> <span className="font-mono">{vehicle.vin}</span></p>
                </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden flex-grow">
                <Table>
                    <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-[50%]">Descripción</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">P. Unitario</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {quote.items.map((item, index) => (
                        <TableRow key={index}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unitPrice.toLocaleString('es-CL')}</TableCell>
                        <TableCell className="text-right font-semibold">${item.total.toLocaleString('es-CL')}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-6 pt-6 border-t">
                <div className="w-full max-w-sm space-y-3">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>${(quote.total / 1.19).toLocaleString('es-CL', {maximumFractionDigits: 0})}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>IVA (19%)</span>
                        <span>${(quote.total - quote.total / 1.19).toLocaleString('es-CL', {maximumFractionDigits: 0})}</span>
                    </div>
                    <Separator/>
                     <div className="flex justify-between font-bold text-2xl text-primary">
                        <span>TOTAL</span>
                        <span>${quote.total.toLocaleString('es-CL')}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Columna Secundaria - Acciones y Estado */}
        <div className="lg:col-span-1 space-y-6">
             {status === 'Enviada' && (
                <Card className="bg-muted/50 border-dashed">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Acciones del Cliente</CardTitle>
                        <CardDescription>Simulación de la aprobación o rechazo del cliente.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <Button onClick={handleApprove} className="w-full bg-green-600 hover:bg-green-700"><CheckCircle className="mr-2"/> Aprobar Presupuesto</Button>
                        <Button onClick={handleReject} variant="destructive" className="w-full"><XCircle className="mr-2"/> Rechazar Presupuesto</Button>
                    </CardContent>
                </Card>
             )}
             <Card>
                <CardHeader>
                    <CardTitle>Estado Actual</CardTitle>
                </CardHeader>
                <CardContent>
                     <Badge variant={getStatusVariant(status)} className="text-base px-4 py-1 w-full justify-center">{status}</Badge>
                    {status === 'Aprobada' && (
                        <p className="text-sm text-green-400 pt-2 text-center">¡El cliente ha aprobado el presupuesto!</p>
                    )}
                    {status === 'Rechazada' && (
                         <p className="text-sm text-destructive pt-2 text-center">El cliente ha rechazado el presupuesto.</p>
                    )}
                </CardContent>
             </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Opciones del Documento</CardTitle>
                </CardHeader>
                 <CardContent className="flex flex-col gap-3">
                    <Button variant="outline" onClick={handleSend}><Send className="mr-2 h-4 w-4"/> Enviar por Email</Button>
                    <Button variant="outline"><Printer className="mr-2 h-4 w-4"/> Imprimir / PDF</Button>
                 </CardContent>
             </Card>
        </div>
      </main>
    </div>
  );
}
