
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
import { Badge } from "@/components/ui/badge";
import { Building, Car, Calendar, FileText, ArrowRight } from "lucide-react";
import { fleetContracts as initialContracts, clients } from "@/lib/data";
import { getStatusVariant } from "@/lib/utils";
import Link from "next/link";

// Simulamos que el cliente logueado es 'C001', quien es parte de "Transportes Andinos Ltda."
const LOGGED_IN_COMPANY_NAME = "Transportes Andinos Ltda.";

export default function ClientContractsPage() {
  const clientContracts = initialContracts.filter(c => c.companyName === LOGGED_IN_COMPANY_NAME);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary">Mis Contratos de Flota</h1>
      <p className="text-muted-foreground">Administre y revise los detalles de sus contratos de mantenimiento.</p>

      {clientContracts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clientContracts.map((contract) => (
            <Card key={contract.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="text-accent" />
                    {contract.planType}
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
                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                    <span>Vence: {new Date(contract.endDate).toLocaleDateString()}</span>
                </div>
              </CardContent>
              <CardFooter>
                 <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/management/contracts/${contract.id}`}>
                        Ver Detalles y Documentos <ArrowRight className="ml-2"/>
                    </Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
                <p>No tiene contratos de flota activos asociados a su cuenta.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
