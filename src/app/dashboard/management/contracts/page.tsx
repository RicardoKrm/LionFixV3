
"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Car, Calendar, FileText, PlusCircle, ArrowRight } from "lucide-react";
import { fleetContracts as initialContracts } from "@/lib/data";
import type { FleetContract } from "@/types";
import { getStatusVariant } from "@/lib/utils";
import Link from "next/link";


export default function FleetContractsPage() {
  const [contracts, setContracts] = useState<FleetContract[]>(initialContracts);

  const handleNewContract = () => {
    // Logic to open a form dialog would go here
    console.log("Abrir formulario para nuevo contrato");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Contratos de Flota">
        <Button onClick={handleNewContract} variant="secondary">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Contrato
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <Card>
           <CardHeader>
            <CardTitle>Gestión de Contratos de Mantenimiento</CardTitle>
            <CardDescription>
              Administre los contratos de mantenimiento para flotas de vehículos de empresas.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract) => (
            <Card key={contract.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="text-accent" />
                    {contract.companyName}
                  </CardTitle>
                  <Badge variant={getStatusVariant(contract.status as any)}>{contract.status}</Badge>
                </div>
                <CardDescription>ID Contrato: {contract.id}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground"/>
                    <span>{contract.vehicleCount} vehículos en flota</span>
                </div>
                 <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground"/>
                    <span>Plan de Mantenimiento {contract.planType}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                    <span>Vence: {new Date(contract.endDate).toLocaleDateString()}</span>
                </div>
              </CardContent>
              <CardFooter>
                 <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/management/contracts/${contract.id}`}>
                        Administrar Contrato <ArrowRight className="ml-2"/>
                    </Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

    
