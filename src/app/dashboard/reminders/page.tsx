
"use client";

import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import type { Notification } from "@/types";
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


// Maps a Supabase reminder row (with joined relations) to local Notification shape
function mapRow(row: any): Notification & { _clientName?: string; _vehicleLabel?: string } {
  return {
    id: row.id,
    clientId: row.client_id,
    vehicleId: row.vehicle_id,
    type: row.type,
    sendDate: row.send_date,
    lastServiceDate: row.last_service_date ?? undefined,
    status: row.status,
    channel: row.channel ?? undefined,
    // Carry joined display strings for the table & AI
    _clientName: row.clients?.name ?? "N/A",
    _vehicleLabel: row.vehicles
      ? `${row.vehicles.make} ${row.vehicles.model}`
      : "N/A",
  };
}

type EnrichedNotification = Notification & {
  _clientName?: string;
  _vehicleLabel?: string;
};


export default function RemindersPage() {
  const [notifications, setNotifications] = useState<EnrichedNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<EnrichedNotification | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  // ── Load reminders from Supabase ────────────────────────────────
  useEffect(() => {
    async function fetchReminders() {
      setIsPageLoading(true);
      const { data, error } = await supabase
        .from("reminders")
        .select("*, clients(name), vehicles(make, model, license_plate)")
        .order("send_date", { ascending: true });

      if (error) {
        console.error("Error loading reminders:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las notificaciones.",
        });
      } else {
        setNotifications((data ?? []).map(mapRow));
      }
      setIsPageLoading(false);
    }
    fetchReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ────────────────────────────────────────────────────

  const handleNew = () => {
    setSelectedNotification(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (notification: EnrichedNotification) => {
    setSelectedNotification(notification);
    setIsFormOpen(true);
  };
  
  const handleDelete = (notification: EnrichedNotification) => {
    setSelectedNotification(notification);
    setIsAlertOpen(true);
  }

  const confirmDelete = async () => {
    if (selectedNotification) {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", selectedNotification.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar la notificación.",
        });
      } else {
        setNotifications(notifications.filter((n) => n.id !== selectedNotification.id));
        toast({
          title: "Notificación Eliminada",
          description: `La notificación ha sido eliminada de la cola.`,
          variant: "destructive",
        });
      }
    }
    setIsAlertOpen(false);
    setSelectedNotification(null);
  }

  const handleGenerateClick = async (notification: EnrichedNotification) => {
    setSelectedNotification(notification);
    setGeneratedMessage("");
    setIsLoading(true);
    setIsPreviewOpen(true);

    try {
      const result = await generateMaintenanceReminder({
        customerName: notification._clientName || "",
        vehicle: notification._vehicleLabel || "",
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

  const handleSend = async (channel: 'WhatsApp' | 'Email') => {
    if (!selectedNotification) return;

    const { error } = await supabase
      .from("reminders")
      .update({ status: "Enviada", channel })
      .eq("id", selectedNotification.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado de la notificación.",
      });
    } else {
      setNotifications(notifications.map(n =>
        n.id === selectedNotification.id ? { ...n, status: 'Enviada' as const, channel } : n
      ));

      toast({
        title: "Envío Simulado",
        description: `La notificación para ${selectedNotification._clientName} ha sido enviada por ${channel}.`
      });
    }
    
    setIsPreviewOpen(false);
    setSelectedNotification(null);
    setGeneratedMessage("");
  }
  
  const handleProcessQueue = async () => {
    setIsLoading(true);
    toast({
      title: "Procesando Cola...",
      description: "Simulando el envío de notificaciones programadas."
    });

    const programmedIds = notifications
      .filter(n => n.status === 'Programada')
      .map(n => n.id);

    if (programmedIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from("reminders")
      .update({ status: "Enviada" })
      .in("id", programmedIds);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar la cola.",
      });
    } else {
      setNotifications(notifications.map(n =>
        n.status === 'Programada' ? { ...n, status: 'Enviada' as const } : n
      ));
      toast({
        title: "Cola Procesada",
        description: `${programmedIds.length} notificaciones han sido marcadas como 'Enviadas'.`
      });
    }
    setIsLoading(false);
  };
  
  const handleFormSubmit = async (data: Omit<Notification, 'id' | 'status'>) => {
    const dbPayload = {
      client_id: data.clientId,
      vehicle_id: data.vehicleId,
      type: data.type,
      send_date: data.sendDate,
      last_service_date: data.lastServiceDate || null,
      channel: data.channel || null,
    };

    if (selectedNotification && selectedNotification.id) {
      // Edit
      const { error } = await supabase
        .from("reminders")
        .update(dbPayload)
        .eq("id", selectedNotification.id);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar." });
        return;
      }

      // Re-fetch the updated row with joins to refresh display names
      const { data: updated } = await supabase
        .from("reminders")
        .select("*, clients(name), vehicles(make, model, license_plate)")
        .eq("id", selectedNotification.id)
        .single();

      if (updated) {
        setNotifications(notifications.map(n =>
          n.id === selectedNotification.id ? mapRow(updated) : n
        ));
      }
      toast({ title: "Notificación Actualizada" });
    } else {
      // Create
      const { data: inserted, error } = await supabase
        .from("reminders")
        .insert({ ...dbPayload, status: "Programada" })
        .select("*, clients(name), vehicles(make, model, license_plate)")
        .single();

      if (error || !inserted) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo crear la notificación." });
        return;
      }

      setNotifications([mapRow(inserted), ...notifications]);
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
            {isPageLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-4 w-[160px]" />
                    <Skeleton className="h-4 w-[180px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-6 w-[90px] rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                ))}
              </div>
            ) : (
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
                  return (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{notification._clientName}</TableCell>
                    <TableCell>{notification._vehicleLabel || 'N/A'}</TableCell>
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
            )}
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
                    Revisa el mensaje generado por la IA antes de enviarlo a {selectedNotification?._clientName}.
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
