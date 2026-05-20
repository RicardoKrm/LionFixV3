
"use client";

import { notFound, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, Wrench, Download } from "lucide-react";
import { vehicles, workOrders as allWorkOrders } from "@/lib/data";
import { getStatusVariant } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ClientVehicleHistoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const vehicle = vehicles.find((v) => v.id === params.id);
  const { toast } = useToast();

  const vehicleWorkOrders = allWorkOrders
    .filter((wo) => wo.vehicleId === params.id)
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

  if (!vehicle) {
    notFound();
  }
  
  const handleDownload = (workOrderId: string) => {
    toast({
        title: "Descarga Iniciada (Simulación)",
        description: `Se está generando el informe PDF para la OT ${workOrderId}.`
    });
  }

  return (
    <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-primary">Historial del Vehículo</h1>
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Mis Vehículos
            </Button>
        </div>
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Car className="h-10 w-10 text-accent"/>
                        <div>
                             <CardTitle className="text-2xl">{vehicle.make} {vehicle.model} ({vehicle.year})</CardTitle>
                             <CardDescription>
                                <span className="font-mono uppercase bg-muted px-2 py-1 rounded">{vehicle.licensePlate}</span>
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench />
              Órdenes de Trabajo Registradas
            </CardTitle>
            <CardDescription>
              Registro completo de todos los servicios realizados a este vehículo en nuestro taller.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OT N°</TableHead>
                  <TableHead>Fecha Ingreso</TableHead>
                  <TableHead>Servicio Realizado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Informe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleWorkOrders.length > 0 ? (
                  vehicleWorkOrders.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell className="font-medium">{wo.id}</TableCell>
                      <TableCell>{new Date(wo.entryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{wo.service}</TableCell>
                      <TableCell>
                        <Badge variant={wo.type === 'Mantención Preventiva' ? 'secondary' : 'outline'}>{wo.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(wo.status)}>
                          {wo.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(wo.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No hay órdenes de trabajo registradas para este vehículo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
