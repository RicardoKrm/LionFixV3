
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
import { useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import type { CalendarEvent } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Trash2 } from "lucide-react";

const appointmentSchema = z.object({
    title: z.string().min(3, "El título es requerido."),
    vehicle: z.string().min(6, "La patente es requerida.").toUpperCase(),
    technician: z.string().min(1, "Debe seleccionar un técnico."),
    workstation: z.coerce.number().min(1, "Debe seleccionar un puesto."),
    start: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Fecha de inicio inválida" }),
    end: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Fecha de fin inválida" }),
}).refine(data => new Date(data.end) > new Date(data.start), {
    message: "La hora de fin debe ser posterior a la hora de inicio.",
    path: ["end"],
});

type AppointmentFormData = Omit<CalendarEvent, 'id'>;

type AppointmentFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AppointmentFormData) => void;
  onDelete?: (eventId: string) => void;
  event?: CalendarEvent | null;
};

const today = new Date().toISOString().split('T')[0];

export function AppointmentFormDialog({ isOpen, onOpenChange, onSubmit, onDelete, event }: AppointmentFormDialogProps) {
  
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: "",
      vehicle: "",
      technician: "",
      workstation: 1,
      start: `${today}T09:00`,
      end: `${today}T10:00`,
    },
  });
  
  useEffect(() => {
    if (event) {
        form.reset({
            ...event,
            start: event.start.slice(0, 16), // Format for datetime-local
            end: event.end.slice(0, 16),
        });
    } else {
        form.reset({
            title: "",
            vehicle: "",
            technician: "",
            workstation: 1,
            start: `${today}T09:00`,
            end: `${today}T10:00`,
        });
    }
  }, [event, form, isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? "Editar Cita" : "Nueva Cita"}</DialogTitle>
          <DialogDescription>
            {event ? "Actualice la información de la cita." : "Complete los datos para agendar una nueva cita."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Título / Servicio Principal</FormLabel>
                        <FormControl>
                            <Input placeholder="Mantención 10.000km" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="vehicle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Patente del Vehículo</FormLabel>
                        <FormControl>
                            <Input placeholder="ABCD-12" {...field} className="uppercase"/>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="technician"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Técnico</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar técnico..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Pedro Pascal">Pedro Pascal</SelectItem>
                                    <SelectItem value="Ricardo Milos">Ricardo Milos</SelectItem>
                                    <SelectItem value="Otro Técnico">Otro Técnico</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="workstation"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Puesto</FormLabel>
                             <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar puesto..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="1">Puesto 1</SelectItem>
                                    <SelectItem value="2">Puesto 2</SelectItem>
                                    <SelectItem value="3">Puesto 3</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                 <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="start"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Inicio</FormLabel>
                            <FormControl>
                                <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="end"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Fin</FormLabel>
                            <FormControl>
                                <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
               
                 <DialogFooter className="justify-between sm:justify-between">
                    <div>
                        {event && onDelete && (
                             <Button type="button" variant="destructive" onClick={() => onDelete(event.id)}>
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Eliminar
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit">{event ? "Guardar Cambios" : "Crear Cita"}</Button>
                    </div>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
