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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const vehicleSchema = z.object({
  license_plate: z.string().min(6, "La patente debe tener al menos 6 caracteres."),
  make: z.string().min(2, "La marca es requerida."),
  model: z.string().min(2, "El modelo es requerido."),
  year: z.coerce.number().min(1950, "Año inválido.").max(new Date().getFullYear() + 1, "Año inválido."),
  vin: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

type VehicleFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | null;
  clientName?: string;
  onSuccess: () => void;
};

export function VehicleFormDialog({
  isOpen,
  onOpenChange,
  clientId,
  clientName,
  onSuccess,
}: VehicleFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      license_plate: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      vin: "",
    },
  });

  const onSubmit = async (data: VehicleFormData) => {
    if (!clientId) return;
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("vehicles")
        .insert({
          client_id: clientId,
          license_plate: data.license_plate.toUpperCase(),
          make: data.make,
          model: data.model,
          year: data.year,
          vin: data.vin || null,
        });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Vehículo Añadido",
        description: `Se ha registrado exitosamente el vehículo ${data.license_plate}.`,
      });
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al añadir vehículo",
        description: err.message || "Ocurrió un error inesperado.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Vehículo</DialogTitle>
          <DialogDescription>
            Registrar un nuevo vehículo para {clientName || "el cliente seleccionado"}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="license_plate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: ABCD12" className="uppercase font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Corolla" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="vin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VIN (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nº Chasis" className="uppercase font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Vehículo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
