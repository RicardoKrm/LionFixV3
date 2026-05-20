
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Car, FileText, History } from "lucide-react";
import { vehicles, clients } from "@/lib/data";
import Link from "next/link";

// Simulamos que el cliente logueado es 'C001'
const LOGGED_IN_CLIENT_ID = 'C001';

export default function ClientVehiclesPage() {
  const client = clients.find(c => c.id === LOGGED_IN_CLIENT_ID);
  const clientVehicles = vehicles.filter(v => client?.vehicleIds.includes(v.id));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary">Mis Vehículos</h1>
      <p className="text-muted-foreground">Seleccione un vehículo para ver su historial completo de servicios.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clientVehicles.map(vehicle => (
          <Card key={vehicle.id} className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Car className="h-8 w-8 text-accent"/>
                    <div>
                        <CardTitle>{vehicle.make} {vehicle.model}</CardTitle>
                        <CardDescription>Año: {vehicle.year}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                 <div className="font-mono text-xl uppercase tracking-wider bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-center">
                  {vehicle.licensePlate}
                </div>
            </CardContent>
            <CardFooter>
                <Link href={`/portal/vehicles/${vehicle.id}/history`} className="w-full">
                    <Button variant="outline" className="w-full">
                        <History className="mr-2 h-4 w-4"/>
                        Ver Historial de Servicios
                    </Button>
                </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
