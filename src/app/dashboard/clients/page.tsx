
"use client";

import { useState, useMemo, Fragment } from "react";
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

import { clients as initialClients, vehicles } from "@/lib/data";
import type { Client } from "@/types";
import { ClientFormDialog } from "@/components/client-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleNewClient = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (selectedClient) {
      setClients(clients.filter((c) => c.id !== selectedClient.id));
      toast({
        title: "Cliente Eliminado",
        description: `El cliente ${selectedClient.name} ha sido eliminado.`,
      });
    }
    setIsAlertOpen(false);
    setSelectedClient(null);
  };

  const handleFormSubmit = (data: Omit<Client, "id" | "vehicleIds">) => {
    if (selectedClient) {
      const updatedClients = clients.map((c) =>
        c.id === selectedClient.id ? { ...selectedClient, ...data } : c
      );
      setClients(updatedClients);
      toast({
        title: "Cliente Actualizado",
        description: "Los datos del cliente han sido actualizados.",
      });
    } else {
      const newClient: Client = {
        id: `C${(clients.length + 1).toString().padStart(3, "0")}`,
        ...data,
        vehicleIds: [],
      };
      setClients([...clients, newClient]);
      toast({
        title: "Cliente Creado",
        description: "El nuevo cliente ha sido añadido a la lista.",
      });
    }
    setIsFormOpen(false);
    setSelectedClient(null);
  };
  
  const filteredClients = useMemo(() => {
    return clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [clients, searchTerm]);
  
  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Gestión de Clientes (CRM)">
        <Button onClick={handleNewClient} variant="secondary">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Cliente
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
                <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                    startIcon={Search}
                />
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
                <TableBody>
                  {filteredClients.length > 0 ? filteredClients.map((client) => {
                    const clientVehicles = vehicles.filter(v => client.vehicleIds.includes(v.id));
                    return (
                       <Collapsible asChild key={client.id} >
                           <>
                                <TableRow>
                                    <TableCell className="px-4">
                                       <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={clientVehicles.length === 0}>
                                            <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:-rotate-180" />
                                            <span className="sr-only">Expandir</span>
                                        </Button>
                                       </CollapsibleTrigger>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{client.name}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>{client.email}</div>
                                        <div className="text-muted-foreground text-sm">{client.phone}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{clientVehicles.length} vehículo(s)</Badge>
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
                                            <DropdownMenuItem onClick={() => handleEditClient(client)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Editar
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
                                                <h4 className="font-semibold mb-4 text-base">Vehículos de {client.name}</h4>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Patente</TableHead>
                                                            <TableHead>Marca y Modelo</TableHead>
                                                            <TableHead>Año</TableHead>
                                                            <TableHead>VIN</TableHead>
                                                            <TableHead>N° Motor</TableHead>
                                                            <TableHead className="text-right">Acciones</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {clientVehicles.map(vehicle => (
                                                            <TableRow key={vehicle.id}>
                                                                <TableCell className="font-mono">{vehicle.licensePlate}</TableCell>
                                                                <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                                                                <TableCell>{vehicle.year}</TableCell>
                                                                <TableCell className="font-mono">{vehicle.vin}</TableCell>
                                                                <TableCell className="font-mono">{vehicle.motorNumber}</TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button asChild variant="outline" size="sm">
                                                                        <Link href={`/dashboard/vehicles/${vehicle.id}/history`}>
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
                           </>
                       </Collapsible>
                    )
                  }) : (
                     <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No se encontraron clientes.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <ClientFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        client={selectedClient}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              al cliente y toda su información asociada del sistema.
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
    </div>
  );
}

    