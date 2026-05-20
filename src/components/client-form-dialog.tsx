
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Client } from "@/types";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";

const clientSchema = z.object({
    name: z.string().min(3, "El nombre es requerido."),
    email: z.string().email("Debe ser un email válido."),
    phone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos."),
});

type ClientFormData = z.infer<typeof clientSchema>;

type ClientFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClientFormData) => void;
  client?: Client | null;
};

export function ClientFormDialog({ isOpen, onOpenChange, onSubmit, client }: ClientFormDialogProps) {
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });
  
  useEffect(() => {
    if (client) {
        form.reset({
            name: client.name,
            email: client.email,
            phone: client.phone,
        });
    } else {
        form.reset({
            name: "",
            email: "",
            phone: "",
        });
    }
  }, [client, form, isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          <DialogDescription>
            {client ? "Actualice la información del cliente." : "Complete los datos del nuevo cliente."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                            <Input placeholder="Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="juan.perez@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                            <Input placeholder="+56912345678" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit">Guardar Cliente</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
