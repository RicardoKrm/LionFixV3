"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Search, ChevronDown, History } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { VehicleFormDialog } from "@/components/vehicle-form-dialog";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [vehicleFormClient, setVehicleFormClient] = useState<{id: string, name: string} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*, vehicles(*)")
      .order("name");
    if (!error && data) {
      setClients(data);
    } else {
      console.error("Error fetching clients:", error);
    }
    setLoading(false);
  }

  const handleDeleteClient = (client: any) => {
    setSelectedClient(client);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedClient) {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", selectedClient.id);
      if (!error) {
        setClients(clients.filter((c) => c.id !== selectedClient.id));
        toast({
          title: "Cliente Eliminado",
          description: `El cliente ${selectedClient.name} ha sido eliminado.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error al eliminar",
          description: "No se pudo eliminar el cliente.",
        });
      }
    }
    setIsAlertOpen(false);
    setSelectedClient(null);
  };

  const filteredClients = useMemo(() => {
    return clients
      .filter(
        (client) =>
          client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone?.includes(searchTerm)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <DashboardHeader title="Gestión de Clientes (CRM)" />
        <main className="flex-1 p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Gestión de Clientes (CRM)">
        <Button variant="secondary" asChild>
          <Link href="/dashboard/clients/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Link>
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Listado de Clientes</CardTitle>
            <CardDescription>
              Busque, visualice, expanda y gestione la información de todos sus clientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Vehículos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => {
                    const clientVehicles = client.vehicles || [];
                    return (
                      <Collapsible asChild key={client.id}>
                        <TableBody className="border-0">
                          <TableRow>
                              <TableCell className="px-4">
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={clientVehicles.length === 0}
                                  >
                                    <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:-rotate-180" />
                                    <span className="sr-only">Expandir</span>
                                  </Button>
                                </CollapsibleTrigger>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback>
                                      {client.name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="font-medium">{client.name}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>{client.email}</div>
                                <div className="text-muted-foreground text-sm">
                                  {client.phone}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {clientVehicles.length} vehículo(s)
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Acciones</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setVehicleFormClient({ id: client.id, name: client.name });
                                        setIsVehicleFormOpen(true);
                                      }}
                                    >
                                      <PlusCircle className="mr-2 h-4 w-4" />
                                      Añadir Vehículo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleDeleteClient(client)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                            {clientVehicles.length > 0 && (
                              <CollapsibleContent asChild>
                                <TableRow className="bg-muted/50 hover:bg-muted">
                                  <TableCell colSpan={5} className="p-0">
                                    <div className="p-6">
                                      <h4 className="font-semibold mb-4 text-base">
                                        Vehículos de {client.name}
                                      </h4>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Patente</TableHead>
                                            <TableHead>Marca y Modelo</TableHead>
                                            <TableHead>Año</TableHead>
                                            <TableHead>VIN</TableHead>
                                            <TableHead className="text-right">
                                              Acciones
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {clientVehicles.map((vehicle: any) => (
                                            <TableRow key={vehicle.id}>
                                              <TableCell className="font-mono">
                                                {vehicle.license_plate}
                                              </TableCell>
                                              <TableCell>
                                                {vehicle.make} {vehicle.model}
                                              </TableCell>
                                              <TableCell>{vehicle.year}</TableCell>
                                              <TableCell className="font-mono">
                                                {vehicle.vin || "—"}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <Button
                                                  asChild
                                                  variant="outline"
                                                  size="sm"
                                                >
                                                  <Link
                                                    href={`/dashboard/vehicles/${vehicle.id}/history`}
                                                  >
                                                    <History className="mr-2 h-4 w-4" />
                                                    Ver Historial
                                                  </Link>
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </CollapsibleContent>
                            )}
                          </TableBody>
                        </Collapsible>
                      );
                    })
                  ) : (
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No se encontraron clientes.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  )}
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al
              cliente y toda su información asociada del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedClient(null)}>
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

      <VehicleFormDialog
        isOpen={isVehicleFormOpen}
        onOpenChange={setIsVehicleFormOpen}
        clientId={vehicleFormClient?.id || null}
        clientName={vehicleFormClient?.name}
        onSuccess={fetchClients}
      />
    </div>
  );
}