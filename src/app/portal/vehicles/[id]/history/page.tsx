"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Car, Wrench, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getStatusVariant } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ClientVehicleHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [vehicle, setVehicle] = useState<any | null>(null);
  const [vehicleWorkOrders, setVehicleWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [vehicleRes, workOrdersRes] = await Promise.all([
        supabase.from("vehicles").select("*").eq("id", resolvedParams.id).single(),
        supabase
          .from("work_orders")
          .select("*")
          .eq("vehicle_id", resolvedParams.id)
          .order("entry_date", { ascending: false }),
      ]);

      if (vehicleRes.data) {
        setVehicle(vehicleRes.data);
      }
      if (workOrdersRes.data) {
        setVehicleWorkOrders(workOrdersRes.data);
      }

      setLoading(false);
    }

    fetchData();
  }, [resolvedParams.id]);

  const handleDownload = (workOrderId: string) => {
    toast({
      title: "Descarga Iniciada (Simulación)",
      description: `Se está generando el informe PDF para la OT ${workOrderId}.`,
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Vehículo no encontrado.
      </div>
    );
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
              <Car className="h-10 w-10 text-accent" />
              <div>
                <CardTitle className="text-2xl">
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </CardTitle>
                <CardDescription>
                  <span className="font-mono uppercase bg-muted px-2 py-1 rounded">
                    {vehicle.license_plate}
                  </span>
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
                    <TableCell>
                      {new Date(wo.entry_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{wo.service_description}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          wo.type === "Mantención Preventiva"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {wo.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(wo.status)}>
                        {wo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(wo.id)}
                      >
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
