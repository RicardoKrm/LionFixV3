
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
import type { Part } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";

const partSchema = z.object({
    sku: z.string().min(1, "El SKU es requerido."),
    name: z.string().min(3, "El nombre es requerido."),
    stock: z.coerce.number().int().min(0, "El stock no puede ser negativo."),
    location: z.string().min(1, "La ubicación es requerida."),
    alertThreshold: z.coerce.number().int().min(0, "El umbral no puede ser negativo."),
    cost: z.coerce.number().min(0, "El costo no puede ser negativo."),
    price: z.coerce.number().min(0, "El precio no puede ser negativo."),
});

type PartFormData = z.infer<typeof partSchema>;

type PartFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PartFormData) => void;
  part?: Part | null;
};

export function PartFormDialog({ isOpen, onOpenChange, onSubmit, part }: PartFormDialogProps) {
  
  const form = useForm<PartFormData>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      sku: "",
      name: "",
      stock: 0,
      location: "",
      alertThreshold: 5,
      cost: 0,
      price: 0,
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        if (part) {
            form.reset({
                ...part
            });
        } else {
            form.reset({
              sku: "",
              name: "",
              stock: 0,
              location: "",
              alertThreshold: 5,
              cost: 0,
              price: 0,
            });
        }
    }
  }, [part, form, isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{part ? "Editar Repuesto" : "Nuevo Repuesto"}</DialogTitle>
          <DialogDescription>
            {part ? "Actualice la información del repuesto." : "Complete los datos del nuevo repuesto."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                            <Input placeholder="OIL-SYN-5W30" {...field} disabled={!!part} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre del Producto</FormLabel>
                        <FormControl>
                            <Input placeholder="Aceite Sintético 5W-30 (Litro)" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Stock Actual</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="alertThreshold"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Alerta de Stock</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                            <Input placeholder="Estante A-1" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="cost"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Costo Unitario (CLP)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Precio Venta (CLP)</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
