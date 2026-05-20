"use client";

import { useState, useEffect } from "react";
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
import { getStatusVariant } from "@/lib/utils";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

export default function FleetContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  async function fetchContracts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("fleet_contracts")
      .select(`
        *,
        clients(name)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setContracts(data);
    } else {
      console.error("Error fetching fleet contracts:", error);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <DashboardHeader title="Contratos de Flota" />
        <main className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Contratos de Flota">
        <Button variant="secondary" disabled>
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

        {contracts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((contract) => (
              <Card key={contract.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Building className="text-accent" />
                      {contract.company_name || contract.clients?.name}
                    </CardTitle>
                    <Badge variant={getStatusVariant(contract.status as any)}>
                      {contract.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    ID Contrato: {contract.contract_number || contract.id.slice(0, 8).toUpperCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>{contract.vehicle_count} vehículos en flota</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Plan de Mantenimiento {contract.plan_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Vence:{" "}
                      {contract.end_date
                        ? new Date(contract.end_date).toLocaleDateString("es-CL")
                        : "—"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/management/contracts/${contract.id}`}>
                      Administrar Contrato <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              <p>No hay contratos de flota registrados aún.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
