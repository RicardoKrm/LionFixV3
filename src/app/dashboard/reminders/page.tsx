
"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { clients, vehicles } from "@/lib/data";
import type { Client, Vehicle, Notification } from "@/types";
import { Bot, Send, MessageSquare, Mail, PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateMaintenanceReminder } from "@/ai/flows/maintenance";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationFormDialog } from "@/components/notification-form-dialog";
import { getStatusVariant } from "@/lib/utils";
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


// Simulación de notificaciones que el sistema gestionaría.
const initialNotifications: Notification[] = [
  {
    id: "N001",
    clientId: "C001",
    vehicleId: "V001",
    type: "Mantención 20.000km",
    sendDate: "2024-08-15",
    lastServiceDate: "hace 6 meses",
    status: "Programada",
    channel: "Email"
  },
  {
    id: "N002",
    clientId: "C002",
    vehicleId: "V002",
    type: "Revisión de Frenos",
    sendDate: "2024-08-20",
    lastServiceDate: "hace 1 año",
    status: "Programada",
    channel: "WhatsApp"
  },
  {
    id: "N003",
    clientId: "C003",
    vehicleId: "V003",
    type: "Vencimiento Garantía A/C",
    sendDate: "2024-07-25",
    lastServiceDate: "hace 11 meses",
    status: "Enviada",
    channel: "Email"
  },
];


export default function RemindersPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  const handleNew = () => {
    setSelectedNotification(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsFormOpen(true);
  };
  
  const handleDelete = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsAlertOpen(true);
  }

  const confirmDelete = () => {
    if (selectedNotification) {
      setNotifications(notifications.filter((n) => n.id !== selectedNotification.id));
      toast({
        title: "Notificación Eliminada",
        description: `La notificación ha sido eliminada de la cola.`,
        variant: "destructive",
      });
    }
    setIsAlertOpen(false);
    setSelectedNotification(null);
  }

  const handleGenerateClick = async (notification: Notification) => {
    setSelectedNotification(notification);
    setGeneratedMessage("");
    setIsLoading(true);
    setIsPreviewOpen(true);

    try {
      const result = await generateMaintenanceReminder({
        customerName: clients.find(c => c.id === notification.clientId)?.name || "",
        vehicle: `${vehicles.find(v => v.id === notification.vehicleId)?.make} ${vehicles.find(v => v.id === notification.vehicleId)?.model}`,
        lastServiceDate: notification.lastServiceDate || 'hace poco',
      });
      setGeneratedMessage(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: "No se pudo generar el recordatorio. Intente de nuevo.",
      });
      setIsPreviewOpen(false);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSend = (channel: 'WhatsApp' | 'Email') => {
    if (!selectedNotification) return;
    
    // Mark as sent
    setNotifications(notifications.map(n => n.id === selectedNotification.id ? {...n, status: 'Enviada', channel} : n));

    toast({
        title: "Envío Simulado",
        description: `La notificación para ${clients.find(c => c.id === selectedNotification.clientId)?.name} ha sido enviada por ${channel}.`
    });
    
    setIsPreviewOpen(false);
    setSelectedNotification(null);
    setGeneratedMessage("");
  }
  
  const handleProcessQueue = () => {
    setIsLoading(true);
    toast({
      title: "Procesando Cola...",
      description: "Simulando el envío de notificaciones programadas."
    });

    setTimeout(() => {
      const programmedCount = notifications.filter(n => n.status === 'Programada').length;
      setNotifications(notifications.map(n => n.status === 'Programada' ? { ...n, status: 'Enviada' } : n));
      setIsLoading(false);
      toast({
        title: "Cola Procesada",
        description: `${programmedCount} notificaciones han sido marcadas como 'Enviadas'.`
      });
    }, 1500);
  };
  
  const handleFormSubmit = (data: Omit<Notification, 'id' | 'status'>) => {
     if (selectedNotification && selectedNotification.id) {
        // Edit
        setNotifications(notifications.map(n => n.id === selectedNotification.id ? { ...selectedNotification, ...data } : n));
        toast({ title: "Notificación Actualizada" });
     } else {
        // Create
        const newNotification: Notification = {
            id: `N${(notifications.length + 1).toString().padStart(3, '0')}`,
            status: 'Programada',
            ...data
        };
        setNotifications([newNotification, ...notifications]);
        toast({ title: "Notificación Creada" });
     }
     setIsFormOpen(false);
     setSelectedNotification(null);
  }

  const handleCloseDialog = () => {
      setIsPreviewOpen(false);
      setSelectedNotification(null);
      setGeneratedMessage("");
  }


  return (
    <>
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Panel de Notificaciones a Clientes">
        <Button onClick={handleProcessQueue} disabled={isLoading || !notifications.some(n => n.status === 'Programada')}>
          <Send className="mr-2 h-4 w-4" />
          Procesar Cola de Envíos
        </Button>
        <Button onClick={handleNew} variant="secondary">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Notificación
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Cola de Comunicaciones</CardTitle>
            <CardDescription>
              Gestione y envíe recordatorios de mantenimiento, vencimientos de garantía y otras comunicaciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Tipo de Notificación</TableHead>
                  <TableHead>Fecha de Envío</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => {
                  const client = clients.find(c => c.id === notification.clientId);
                  const vehicle = vehicles.find(v => v.id === notification.vehicleId);

                  return (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{client?.name}</TableCell>
                    <TableCell>{vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'}</TableCell>
                    <TableCell>{notification.type}</TableCell>
                    <TableCell>{new Date(notification.sendDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(notification.status)}>
                        {notification.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleGenerateClick(notification)} disabled={notification.status !== 'Programada'}>
                            <Bot className="mr-2 h-4 w-4" />
                            Generar y Enviar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(notification)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(notification)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
    
    <NotificationFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        notification={selectedNotification}
    />

    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la notificación de la cola de envíos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedNotification(null)}>
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

    <Dialog open={isPreviewOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-xl">
             <DialogHeader>
                <DialogTitle>Previsualización del Mensaje</DialogTitle>
                <DialogDescription>
                    Revisa el mensaje generado por la IA antes de enviarlo a {selectedNotification && clients.find(c => c.id === selectedNotification.clientId)?.name}.
                </DialogDescription>
             </DialogHeader>
             <div className="py-4 space-y-4">
                <Label htmlFor="message-preview">Mensaje a Enviar:</Label>
                <Textarea
                    id="message-preview"
                    value={isLoading ? "Generando..." : generatedMessage}
                    readOnly={isLoading}
                    rows={10}
                    className="bg-muted"
                />
             </div>
             <DialogFooter className="sm:justify-between gap-4">
                <Button variant="ghost" onClick={handleCloseDialog}>Cerrar</Button>
                <div className="flex gap-2">
                     <Button variant="outline" onClick={() => handleSend('WhatsApp')} disabled={isLoading || !generatedMessage}>
                        <MessageSquare className="mr-2 h-4 w-4 text-green-500" /> WhatsApp
                    </Button>
                    <Button variant="secondary" onClick={() => handleSend('Email')} disabled={isLoading || !generatedMessage}>
                        <Mail className="mr-2 h-4 w-4" /> Email
                    </Button>
                </div>
             </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
