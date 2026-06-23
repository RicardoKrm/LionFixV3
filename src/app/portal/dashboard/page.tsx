
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Car, FileText } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { getClientByUserId, getVehicles, getQuotes, getWorkOrders } from "@/lib/supabase-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { IsoSurveyModal } from "@/components/iso-survey-modal";

export default function ClientPortalDashboard() {
  const { user } = useAuth();
  const [client, setClient] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [pendingSurveys, setPendingSurveys] = useState<any[]>([]);
  const [activeSurvey, setActiveSurvey] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const clientData = await getClientByUserId(user.uid);
        setClient(clientData);
        if (clientData) {
          const [vehiclesData, quotesData, workOrdersData] = await Promise.all([
            getVehicles(clientData.id),
            getQuotes(clientData.id),
            getWorkOrders(clientData.id)
          ]);
          setVehicles(vehiclesData || []);
          setQuotes((quotesData || []).filter(q => q.status === 'Enviada'));
          
          const surveys = (workOrdersData || []).filter(
            wo => wo.status === 'Entregado' && wo.satisfaction_rating == null
          );
          setPendingSurveys(surveys);
          if (surveys.length > 0) {
            setActiveSurvey(surveys[0]);
          }
        }
      } catch (err) {
        console.error("Error loading portal data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
           <Skeleton className="h-64" />
           <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary">Bienvenido, {user?.name}</h1>
      <p className="text-muted-foreground">Este es su portal personal. Aquí puede gestionar sus vehículos y cotizaciones.</p>

      {activeSurvey && (
        <IsoSurveyModal 
          workOrder={activeSurvey} 
          onClose={() => setActiveSurvey(null)} 
          onCompleted={() => {
            setActiveSurvey(null);
            setPendingSurveys(prev => prev.filter(s => s.id !== activeSurvey.id));
            if (pendingSurveys.length > 1) {
              setTimeout(() => setActiveSurvey(pendingSurveys[1]), 500);
            }
          }} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Mis Cotizaciones Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText /> Cotizaciones Pendientes</CardTitle>
            <CardDescription>Presupuestos que requieren su aprobación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quotes.length > 0 ? quotes.map(quote => (
              <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-semibold">{quote.quote_number || `COT-${quote.id.slice(0,8).toUpperCase()}`}</p>
                  <p className="text-sm text-muted-foreground">Total: ${Number(quote.total).toLocaleString('es-CL')}</p>
                </div>
                <Link href={`/quote/${quote.id}`} passHref>
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
            {vehicles.length > 0 ? vehicles.map(vehicle => (
              <div key={vehicle.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-semibold">{vehicle.make} {vehicle.model}</p>
                  <p className="text-sm text-muted-foreground">Año: {vehicle.year}</p>
                </div>
                <div className="font-mono text-lg uppercase tracking-wider bg-secondary text-secondary-foreground px-3 py-1 rounded-md">
                  {vehicle.license_plate}
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-8">No hay vehículos registrados.</p>
            )}
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
