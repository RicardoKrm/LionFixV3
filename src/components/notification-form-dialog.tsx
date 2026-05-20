
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useMemo } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import type { Notification, Vehicle } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { clients, vehicles } from "@/lib/data";

const notificationSchema = z.object({
  clientId: z.string().min(1, "Debe seleccionar un cliente."),
  vehicleId: z.string().min(1, "Debe seleccionar un vehículo."),
  type: z.string().min(3, "El tipo de notificación es requerido."),
  sendDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Fecha inválida" }),
  lastServiceDate: z.string().optional(),
});

type NotificationFormData = Omit<Notification, "id" | "status" | "channel">;

type NotificationFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NotificationFormData) => void;
  notification?: Notification | null;
};

export function NotificationFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  notification,
}: NotificationFormDialogProps) {
  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      clientId: "",
      vehicleId: "",
      type: "Recordatorio de Mantención",
      sendDate: new Date().toISOString().split('T')[0],
      lastServiceDate: "",
    },
  });

  const selectedClientId = form.watch("clientId");

  const clientVehicles = useMemo(() => {
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return [];
    return vehicles.filter(v => client.vehicleIds.includes(v.id));
  }, [selectedClientId]);

  useEffect(() => {
    if (isOpen) {
      if (notification) {
        form.reset({
          ...notification,
          sendDate: new Date(notification.sendDate).toISOString().split('T')[0],
        });
      } else {
        form.reset({
          clientId: "",
          vehicleId: "",
          type: "Recordatorio de Mantención",
          sendDate: new Date().toISOString().split('T')[0],
          lastServiceDate: "",
        });
      }
    }
  }, [notification, form, isOpen]);
  
   useEffect(() => {
      if(!notification || (notification && selectedClientId !== notification.clientId)) {
         form.setValue('vehicleId', '');
      }
  }, [selectedClientId, form, notification]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {notification ? "Editar Notificación" : "Nueva Notificación"}
          </DialogTitle>
          <DialogDescription>
            Programe una nueva comunicación para un cliente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Vehículo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar vehículo..." />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {clientVehicles.map((vehicle: Vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                    {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Notificación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Vencimiento de Garantía" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="sendDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Fecha de Envío</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="lastServiceDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contexto (Opcional)</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: hace 6 meses" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>


            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">{notification ? "Guardar Cambios" : "Crear Notificación"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
