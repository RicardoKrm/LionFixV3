
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Car, FileText } from "lucide-react";
import { vehicles, quotes, clients } from "@/lib/data";
import Link from "next/link";
import { getStatusVariant } from "@/lib/utils";

// Simulamos que el cliente logueado es 'C001'
const LOGGED_IN_CLIENT_ID = 'C001';

export default function ClientPortalDashboard() {
  const client = clients.find(c => c.id === LOGGED_IN_CLIENT_ID);
  const clientVehicles = vehicles.filter(v => client?.vehicleIds.includes(v.id));
  const clientQuotes = quotes.filter(q => q.clientId === LOGGED_IN_CLIENT_ID && q.status === 'Enviada');

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary">Bienvenido, {client?.name}</h1>
      <p className="text-muted-foreground">Este es su portal personal. Aquí puede gestionar sus vehículos y cotizaciones.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Mis Cotizaciones Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText /> Cotizaciones Pendientes</CardTitle>
            <CardDescription>Presupuestos que requieren su aprobación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientQuotes.length > 0 ? clientQuotes.map(quote => (
              <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-semibold">{quote.id}</p>
                  <p className="text-sm text-muted-foreground">Total: ${quote.total.toLocaleString('es-CL')}</p>
                </div>
                <Link href={`/dashboard/finance/quotes/${quote.id}`} passHref>
                    <Button variant="secondary" size="sm">
                        Revisar y Aprobar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-8">No tiene cotizaciones pendientes.</p>
            )}
          </CardContent>
        </Card>

        {/* Mis Vehículos Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Car /> Mis Vehículos</CardTitle>
            <CardDescription>Listado de sus vehículos registrados en nuestro taller.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {clientVehicles.map(vehicle => (
              <div key={vehicle.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-semibold">{vehicle.make} {vehicle.model}</p>
                  <p className="text-sm text-muted-foreground">Año: {vehicle.year}</p>
                </div>
                <div className="font-mono text-lg uppercase tracking-wider bg-secondary text-secondary-foreground px-3 py-1 rounded-md">
                  {vehicle.licensePlate}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Link href="/portal/vehicles" className="w-full">
              <Button variant="outline" className="w-full">Ver Historial de Servicios</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
