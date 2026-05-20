
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import type { Technician } from "@/types";
import { Textarea } from "./ui/textarea";

const technicianSchema = z.object({
  name: z.string().min(3, "El nombre es requerido."),
  avatarUrl: z.string().url("Debe ser una URL válida.").or(z.literal("")),
  specialties: z.string().min(3, "Indique al menos una especialidad."),
  hireDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha inválida" }),
  contact: z.string().min(9, "El teléfono es requerido."),
  baseSalary: z.coerce.number().min(0, "El salario no puede ser negativo."),
  extraHourRate: z.coerce.number().min(0, "La tarifa no puede ser negativa."),
  extraHoursThisMonth: z.coerce.number().min(0, "Las horas no pueden ser negativas."),
  maxExtraHours: z.coerce.number().min(0, "Las horas no pueden ser negativas."),
});

type TechnicianFormData = z.infer<typeof technicianSchema>;

// This helper converts between the form's string representation and the model's array
const toFormValues = (technician: Technician | null) => ({
  name: technician?.name || "",
  avatarUrl: technician?.avatarUrl || ``,
  specialties: technician?.specialties.join(", ") || "",
  hireDate: technician ? new Date(technician.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  contact: technician?.contact || "",
  baseSalary: technician?.baseSalary || 0,
  extraHourRate: technician?.extraHourRate || 0,
  extraHoursThisMonth: technician?.extraHoursThisMonth || 0,
  maxExtraHours: technician?.maxExtraHours || 0,
});

const fromFormValues = (data: TechnicianFormData) => ({
    ...data,
    specialties: data.specialties.split(',').map(s => s.trim()).filter(Boolean),
    avatarUrl: data.avatarUrl || `https://placehold.co/100x100.png`
});

type TechnicianFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Technician, "id">) => void;
  technician?: Technician | null;
};

export function TechnicianFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  technician,
}: TechnicianFormDialogProps) {
  const form = useForm<TechnicianFormData>({
    resolver: zodResolver(technicianSchema),
    defaultValues: toFormValues(null),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(toFormValues(technician));
    }
  }, [technician, form, isOpen]);

  const handleFormSubmit = (data: TechnicianFormData) => {
    onSubmit(fromFormValues(data));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{technician ? "Editar Técnico" : "Nuevo Técnico"}</DialogTitle>
          <DialogDescription>
            {technician ? "Actualice los datos del técnico." : "Complete la información del nuevo miembro del equipo."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Pedro Pascal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la Foto de Perfil</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                   <FormDescription>
                    Pegue la URL de una imagen. Si lo deja vacío, se usará un placeholder.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidades</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Frenos, Motores Diesel, Electrónica..." {...field} />
                  </FormControl>
                   <FormDescription>
                    Separe las especialidades con comas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Teléfono de Contacto</FormLabel>
                    <FormControl>
                        <Input placeholder="+56912345678" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Fecha de Contratación</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="baseSalary"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Salario Base (CLP)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="extraHourRate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tarifa Hora Extra (CLP)</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="extraHoursThisMonth"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Horas Extra Este Mes</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="maxExtraHours"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Máx. Horas Extra</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <DialogFooter className="pt-4 sticky bottom-0 bg-card">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{technician ? "Guardar Cambios" : "Crear Técnico"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
