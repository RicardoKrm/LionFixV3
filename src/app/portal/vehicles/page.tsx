
"use client";

import { useEffect, useState } from "react";
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
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { getClientByUserId, getVehicles } from "@/lib/supabase-queries";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientVehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const clientData = await getClientByUserId(user.uid);
        if (clientData) {
          const vehiclesData = await getVehicles(clientData.id);
          setVehicles(vehiclesData || []);
        }
      } catch (err) {
        console.error("Error loading vehicles:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
           <Skeleton className="h-48" />
           <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary">Mis Vehículos</h1>
      <p className="text-muted-foreground">Seleccione un vehículo para ver su historial completo de servicios.</p>

      {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map(vehicle => (
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
                      {vehicle.license_plate}
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
      ) : (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
                <p>No tiene vehículos registrados a su nombre.</p>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
