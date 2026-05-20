
"use client";

import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [quote, setQuote] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("Enviada");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchQuote() {
      setLoading(true);
      const { data, error } = await supabase
        .from("quotes")
        .select(
          "*, clients(name, email, phone), vehicles(make, model, license_plate, year)"
        )
        .eq("id", params.id)
        .single();

      if (error || !data) {
        console.error("Error fetching quote:", error);
        setQuote(null);
      } else {
        setQuote(data);
        setStatus(data.status || "Enviada");
      }
      setLoading(false);
    }
    fetchQuote();
  }, [params.id]);

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <DashboardHeader title="Cargando Cotización...">
          <div />
        </DashboardHeader>
        <main className="flex-1 p-6 overflow-y-auto bg-muted/30 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card p-8 rounded-lg shadow-lg space-y-6">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-6 w-3/4" />
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
            <Skeleton className="h-40 w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-48" />
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // --- Not Found ---
  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-57px)]">
        <h2 className="text-xl font-semibold">Cotización no encontrada</h2>
        <p className="text-muted-foreground mt-2">
          No se encontró la cotización con ID: {params.id}
        </p>
        <Button className="mt-4" onClick={() => router.back()}>
          Volver
        </Button>
      </div>
    );
  }

  // Extract joined data
  const client = quote.clients as { name: string; email: string; phone: string } | null;
  const vehicle = quote.vehicles as { make: string; model: string; license_plate: string; year: number } | null;
  const items: any[] = Array.isArray(quote.items) ? quote.items : [];

  const handleApprove = async () => {
    const { error } = await supabase
      .from("quotes")
      .update({ status: "Aprobada" })
      .eq("id", quote.id);
    if (!error) {
      setStatus("Aprobada");
      toast({
        title: "Cotización Aprobada",
        description: "La cotización ha sido marcada como aprobada. Puede proceder a crear la Orden de Trabajo.",
      });
    }
  };

  const handleReject = async () => {
    const { error } = await supabase
      .from("quotes")
      .update({ status: "Rechazada" })
      .eq("id", quote.id);
    if (!error) {
      setStatus("Rechazada");
      toast({
        variant: "destructive",
        title: "Cotización Rechazada",
        description: "La cotización ha sido marcada como rechazada.",
      });
    }
  };

  const handleSend = () => {
    toast({
      title: "Cotización Enviada",
      description: `La cotización ${quote.id} ha sido enviada a ${client?.email}.`,
    });
  };

  const handleConvertToOT = () => {
    toast({
      title: "Orden de Trabajo Creada (Simulación)",
      description: `Se ha generado la OT-2024-005 a partir de la cotización ${quote.id}.`,
    });
  };

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
                    <p><strong className="w-28 inline-block">Patente:</strong> <span className="font-mono uppercase">{vehicle.license_plate}</span></p>
                    <p><strong className="w-28 inline-block">Marca/Modelo:</strong> {vehicle.make} {vehicle.model} ({vehicle.year})</p>
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
                    {items.map((item: any, index: number) => (
                        <TableRow key={index}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">${(item.unitPrice ?? item.unit_price ?? 0).toLocaleString('es-CL')}</TableCell>
                        <TableCell className="text-right font-semibold">${(item.total ?? 0).toLocaleString('es-CL')}</TableCell>
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
