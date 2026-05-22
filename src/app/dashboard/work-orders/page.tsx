
"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { WorkOrderCard } from "@/components/work-order-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";
import type { WorkOrderStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderFormDialog } from "@/components/work-order-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LicensePlateLookup } from "@/components/license-plate-lookup";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";


export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"activas" | "finalizadas" | "todas">("activas");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  async function fetchWorkOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("work_orders")
      .select(`
        *,
        clients(name),
        vehicles(make, model, license_plate, year)
      `)
      .order("entry_date", { ascending: false });

    if (!error && data) {
      // Enriquecer con campos de compatibilidad
      const enriched = data.map((wo: any) => ({
        ...wo,
        client: wo.clients || { name: "N/A" },
        vehicle: wo.vehicles || { make: "", model: "", license_plate: "" },
        entryDate: wo.entry_date,
        service: wo.service_description || wo.service || "",
      }));
      setWorkOrders(enriched);
    } else {
      console.error("Error fetching work orders:", error);
    }
    setLoading(false);
  }

  const handleNewOrder = () => {
    setIsFormOpen(true);
  };
  
  const filteredWorkOrders = useMemo(() => {
    const activeStatuses: WorkOrderStatus[] = ['Recibido', 'Esperando Aprobación', 'En Reparación', 'Esperando Repuestos'];
    const finishedStatuses: WorkOrderStatus[] = ['Completado', 'Entregado'];

    let filtered = workOrders;

    if (statusFilter === "activas") {
      filtered = filtered.filter(wo => activeStatuses.includes(wo.status));
    } else if (statusFilter === "finalizadas") {
      filtered = filtered.filter(wo => finishedStatuses.includes(wo.status));
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(wo => 
        wo.client?.name?.toLowerCase().includes(lowercasedTerm) ||
        wo.vehicle?.license_plate?.toLowerCase().includes(lowercasedTerm) ||
        wo.service?.toLowerCase().includes(lowercasedTerm)
      );
    }
    
    return filtered.slice(0, 30);
  }, [workOrders, statusFilter, searchTerm]);

  const handleFormSubmit = async (data: any) => {
    const { data: newWo, error } = await supabase
      .from("work_orders")
      .insert({
        client_id: data.clientId,
        vehicle_id: data.vehicleId,
        service_description: data.service,
        type: data.type,
        technician_id: null,
        labor_hours: data.laborHours,
        status: "Recibido",
        parts_used: data.parts || [],
      })
      .select(`*, clients(name), vehicles(make, model, license_plate, year)`)
      .single();

    if (!error && newWo) {
      const enriched = {
        ...newWo,
        client: newWo.clients || { name: "N/A" },
        vehicle: newWo.vehicles || { make: "", model: "", license_plate: "" },
        entryDate: newWo.entry_date,
        service: newWo.service_description,
      };
      setWorkOrders([enriched, ...workOrders]);
      toast({
        title: "Orden de Trabajo Creada",
        description: "La nueva orden ha sido registrada en la base de datos.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error al crear",
        description: "No se pudo guardar la orden de trabajo.",
      });
    }
    setIsFormOpen(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: WorkOrderStatus) => {
    const { error } = await supabase
      .from('work_orders')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive",
      });
      return;
    }

    setWorkOrders(workOrders.map(wo => 
      wo.id === id ? { ...wo, status: newStatus } : wo
    ));
    
    toast({
      title: "Estado Actualizado",
      description: `Orden movida a: ${newStatus}`,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <DashboardHeader title="Órdenes de Trabajo" />
        <main className="flex-1 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Órdenes de Trabajo">
        <div className="flex items-center gap-2">
            <div className="w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por cliente, patente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button onClick={handleNewOrder} variant="default">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Orden
            </Button>
        </div>
      </DashboardHeader>
      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                <TabsTrigger value="activas">Activas</TabsTrigger>
                <TabsTrigger value="finalizadas">Finalizadas</TabsTrigger>
                <TabsTrigger value="todas">Todas</TabsTrigger>
            </TabsList>
        </Tabs>
        
        <LicensePlateLookup />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWorkOrders.map((wo) => (
            <WorkOrderCard key={wo.id} workOrder={wo} onUpdateStatus={handleUpdateStatus} />
          ))}
        </div>
        {filteredWorkOrders.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-10">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-semibold">No se encontraron órdenes de trabajo</p>
                <p>No hay órdenes que coincidan con los filtros aplicados.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <WorkOrderFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        workOrder={null}
      />
    </div>
  );
}
