
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
import { Badge } from "@/components/ui/badge";
import { Building, Car, Calendar, FileText, ArrowRight } from "lucide-react";
import { getStatusVariant } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { getClientByUserId, getFleetContracts } from "@/lib/supabase-queries";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const clientData = await getClientByUserId(user.uid);
        if (clientData) {
          const contractsData = await getFleetContracts(clientData.id);
          setContracts(contractsData || []);
        }
      } catch (err) {
        console.error("Error loading contracts:", err);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
           <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary">Mis Contratos de Flota</h1>
      <p className="text-muted-foreground">Administre y revise los detalles de sus contratos de mantenimiento.</p>

      {contracts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contracts.map((contract) => (
            <Card key={contract.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="text-accent" />
                    {contract.plan_type}
                  </CardTitle>
                  <Badge variant={getStatusVariant(contract.status as any)}>{contract.status}</Badge>
                </div>
                <CardDescription>ID Contrato: {contract.contract_number}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground"/>
                    <span>{contract.company_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground"/>
                    <span>{contract.vehicle_count} vehículos en flota</span>
                </div>
                 <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                    <span>Vence: {new Date(contract.end_date).toLocaleDateString()}</span>
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
