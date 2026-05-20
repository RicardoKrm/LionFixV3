
"use client";

import { notFound, useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { ArrowRight, Car, Wrench, ArrowLeft } from "lucide-react";
import { vehicles, workOrders as allWorkOrders } from "@/lib/data";
import Link from "next/link";
import { getStatusVariant } from "@/lib/utils";

export default function VehicleHistoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const vehicle = vehicles.find((v) => v.id === params.id);
  const vehicleWorkOrders = allWorkOrders
    .filter((wo) => wo.vehicleId === params.id)
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title={`Historial del Vehículo`}>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
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
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                 <div>
                    <p className="font-semibold text-muted-foreground">VIN</p>
                    <p className="font-mono">{vehicle.vin}</p>
                 </div>
                 <div>
                    <p className="font-semibold text-muted-foreground">N° Motor</p>
                    <p className="font-mono">{vehicle.motorNumber}</p>
                 </div>
            </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench />
              Órdenes de Trabajo
            </CardTitle>
            <CardDescription>
              Registro completo de todos los servicios realizados a este vehículo.
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
                  <TableHead className="text-right">Acciones</TableHead>
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
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/work-orders/${wo.id}`}>
                            Ver OT <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
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
      </main>
    </div>
  );
}

    