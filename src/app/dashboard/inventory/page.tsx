
"use client";

import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MoreHorizontal, Edit, Trash2, ShoppingCart, Search, DollarSign, Package, AlertTriangle, Truck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PartFormDialog } from "@/components/part-form-dialog";
import type { Part, PurchaseOrder } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { parts as initialInventory } from "@/lib/data";
import { PurchaseOrderDialog } from "@/components/purchase-order-dialog";
import { KpiCard } from "@/components/kpi-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function InventoryPage() {
  const [inventory, setInventory] = useState<Part[]>(initialInventory);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isPurchaseOrderOpen, setIsPurchaseOrderOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  const handleNewPart = () => {
    setSelectedPart(null);
    setIsFormOpen(true);
  };

  const handleEditPart = (part: Part) => {
    setSelectedPart(part);
    setIsFormOpen(true);
  };

  const handleDeletePart = (part: Part) => {
    setSelectedPart(part);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPart) {
      setInventory(inventory.filter((p) => p.sku !== selectedPart.sku));
      toast({
        title: "Repuesto Eliminado",
        description: `El repuesto ${selectedPart.name} ha sido eliminado.`,
      });
    }
    setIsAlertOpen(false);
    setSelectedPart(null);
  };

  const handleFormSubmit = (data: Part) => {
    if (!selectedPart && inventory.some(p => p.sku === data.sku)) {
        toast({
            variant: "destructive",
            title: "Error de SKU",
            description: "El SKU ya existe. Por favor, utilice uno diferente.",
        });
        return;
    }

    if (selectedPart) {
      const updatedInventory = inventory.map((p) =>
        p.sku === selectedPart.sku ? data : p
      );
      setInventory(updatedInventory);
      toast({
        title: "Repuesto Actualizado",
        description: "Los datos del repuesto han sido actualizados.",
      });
    } else {
      setInventory([...inventory, data]);
      toast({
        title: "Repuesto Creado",
        description: "El nuevo repuesto ha sido añadido al inventario.",
      });
    }
    setIsFormOpen(false);
    setSelectedPart(null);
  };

  const handlePurchaseOrderSubmit = (data: PurchaseOrder) => {
    console.log("Nueva Orden de Compra (Simulación):", data);
    toast({
        title: "Orden de Compra Enviada (Simulación)",
        description: `Se ha enviado una orden de compra a ${data.supplier} con ${data.items.length} ítems.`,
    });
    setIsPurchaseOrderOpen(false);
  };

  const inventoryKpis = useMemo(() => {
    const totalValue = inventory.reduce((acc, part) => acc + (part.cost * part.stock), 0);
    const lowStockCount = inventory.filter(p => p.stock <= p.alertThreshold && p.stock > 0).length;
    const outOfStockCount = inventory.filter(p => p.stock === 0).length;
    return { totalValue, lowStockCount, outOfStockCount };
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    let items = inventory;
    
    if (activeTab === 'low') {
        items = items.filter(part => part.stock > 0 && part.stock <= part.alertThreshold);
    } else if (activeTab === 'out') {
        items = items.filter(part => part.stock === 0);
    }

    return items.filter(part =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => a.sku.localeCompare(b.sku));
  }, [inventory, searchTerm, activeTab]);

  const InventoryTable = ({ parts }: { parts: Part[] }) => (
     <div className="border rounded-md">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nombre del Producto</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Costo Unitario</TableHead>
                <TableHead>Precio Venta</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {parts.length > 0 ? parts.map((item) => (
                <TableRow key={item.sku} className={item.stock > 0 && item.stock <= item.alertThreshold ? 'bg-amber-800/20' : item.stock === 0 ? 'bg-destructive/20' : ''}>
                <TableCell className="font-mono">{item.sku}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                    <Badge
                    variant={item.stock === 0 ? "destructive" : item.stock <= item.alertThreshold ? "default" : "outline"}
                    className={item.stock <= item.alertThreshold && item.stock > 0 ? "bg-amber-500 text-black" : ""}
                    >
                    {item.stock} unidades
                    </Badge>
                </TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell>${item.cost.toLocaleString('es-CL')}</TableCell>
                <TableCell>${item.price.toLocaleString('es-CL')}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPart(item)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeletePart(item)}
                        >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
            )) : (
                 <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                       No se encontraron repuestos con los filtros actuales.
                    </TableCell>
                 </TableRow>
            )}
            </TableBody>
        </Table>
    </div>
  );


  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Dashboard de Inventario">
        <Button variant="outline" onClick={() => setIsPurchaseOrderOpen(true)}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Nueva Orden de Compra
        </Button>
        <Button onClick={handleNewPart} variant="secondary">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Repuesto
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        
        {/* KPIs */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <KpiCard title="Valor Total Inventario" value={`$${inventoryKpis.totalValue.toLocaleString('es-CL')}`} description="Basado en costo de compra" icon={DollarSign} />
             <KpiCard title="Repuestos con Bajo Stock" value={inventoryKpis.lowStockCount.toString()} description="Ítems que necesitan reorden" icon={AlertTriangle} />
             <KpiCard title="Repuestos Agotados" value={inventoryKpis.outOfStockCount.toString()} description="Ítems con stock cero" icon={Package}/>
             <KpiCard title="Proveedor Principal" value="Repuestos Express" description="Basado en volumen de compra" icon={Truck}/>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gestión de Repuestos e Insumos</CardTitle>
            <div className="flex justify-between items-center">
                <CardDescription>
                    Controla tu stock en tiempo real, define alertas y gestiona tus productos.
                </CardDescription>
                 <div className="w-full max-w-sm">
                    <Input
                        placeholder="Buscar por nombre o SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        startIcon={Search}
                    />
                </div>
            </div>
          </CardHeader>
          <CardContent>
             <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="low">Bajo Stock</TabsTrigger>
                    <TabsTrigger value="out">Agotados</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                    <InventoryTable parts={filteredInventory} />
                </TabsContent>
                <TabsContent value="low" className="mt-4">
                    <InventoryTable parts={filteredInventory} />
                </TabsContent>
                <TabsContent value="out" className="mt-4">
                    <InventoryTable parts={filteredInventory} />
                </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <PartFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        part={selectedPart}
      />

       <PurchaseOrderDialog
        isOpen={isPurchaseOrderOpen}
        onOpenChange={setIsPurchaseOrderOpen}
        onSubmit={handlePurchaseOrderSubmit}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el repuesto del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPart(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    