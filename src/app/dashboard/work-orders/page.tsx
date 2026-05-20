
"use client";

import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { WorkOrderCard } from "@/components/work-order-card";
import { workOrders as initialWorkOrders, clients, vehicles, parts as initialParts } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search } from "lucide-react";
import type { EnrichedWorkOrder, WorkOrder, Part, WorkOrderStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { WorkOrderFormDialog } from "@/components/work-order-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LicensePlateLookup } from "@/components/license-plate-lookup";


export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [inventory, setInventory] = useState<Part[]>(initialParts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<"activas" | "finalizadas" | "todas">("activas");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleNewOrder = () => {
    setSelectedWorkOrder(null);
    setIsFormOpen(true);
  };
  
  const enrichedWorkOrders: EnrichedWorkOrder[] = useMemo(() => 
    workOrders
      .map((wo) => ({
        ...wo,
        client: clients.find((c) => c.id === wo.clientId)!,
        vehicle: vehicles.find((v) => v.id === wo.vehicleId)!,
      }))
      .sort(
        (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
      )
  , [workOrders]);
  
  const filteredWorkOrders = useMemo(() => {
    const activeStatuses: WorkOrderStatus[] = ['Recibido', 'Esperando Aprobación', 'En Reparación', 'Esperando Repuestos'];
    const finishedStatuses: WorkOrderStatus[] = ['Completado', 'Entregado'];

    let filtered = enrichedWorkOrders;

    // Filter by status
    if (statusFilter === "activas") {
      filtered = filtered.filter(wo => activeStatuses.includes(wo.status));
    } else if (statusFilter === "finalizadas") {
      filtered = filtered.filter(wo => finishedStatuses.includes(wo.status));
    }

    // Filter by search term
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(wo => 
        wo.client.name.toLowerCase().includes(lowercasedTerm) ||
        wo.vehicle.licensePlate.toLowerCase().includes(lowercasedTerm) ||
        wo.service.toLowerCase().includes(lowercasedTerm)
      );
    }
    
    return filtered.slice(0, 30); // Limit to 30 results
  }, [enrichedWorkOrders, statusFilter, searchTerm]);

  const handleFormSubmit = (data: Omit<WorkOrder, 'id' | 'entryDate' | 'status'>) => {
      // Create new work order
      const newWorkOrder: WorkOrder = {
        id: `OT-2024-${(workOrders.length + 1).toString().padStart(3, '0')}`,
        entryDate: new Date().toISOString(),
        status: 'Recibido',
        ...data,
      };
      
      // Deduct parts from inventory
      const newInventory = [...inventory];
      let updateSuccessful = true;
      
      newWorkOrder.parts.forEach(partUsed => {
          const inventoryPartIndex = newInventory.findIndex(p => p.sku === partUsed.sku);
          if (inventoryPartIndex !== -1) {
              const inventoryPart = newInventory[inventoryPartIndex];
              if (inventoryPart.stock >= partUsed.quantity) {
                  newInventory[inventoryPartIndex] = { ...inventoryPart, stock: inventoryPart.stock - partUsed.quantity };
              } else {
                  toast({
                      variant: "destructive",
                      title: "Error de Stock",
                      description: `No hay suficiente stock para ${partUsed.name}. Stock disponible: ${inventoryPart.stock}.`,
                  });
                  updateSuccessful = false;
              }
          } else {
              toast({
                  variant: "destructive",
                  title: "Error de Repuesto",
                  description: `El repuesto con SKU ${partUsed.sku} no se encontró en el inventario.`,
              });
              updateSuccessful = false;
          }
      });

      if (!updateSuccessful) {
          return; // Stop if there was a stock issue
      }

      setWorkOrders([newWorkOrder, ...workOrders]);
      setInventory(newInventory); // Update inventory state

      toast({
        title: "Orden de Trabajo Creada",
        description: `Se ha creado la orden ${newWorkOrder.id} y se ha actualizado el stock.`,
      });
    
      setIsFormOpen(false);
  };


  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Órdenes de Trabajo">
        <div className="flex items-center gap-2">
            <div className="w-64">
                 <Input 
                    placeholder="Buscar por cliente, patente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    startIcon={Search}
                />
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
            <WorkOrderCard key={wo.id} workOrder={wo} />
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
        workOrder={null} // Always for creation in this view
      />
    </div>
  );
}
