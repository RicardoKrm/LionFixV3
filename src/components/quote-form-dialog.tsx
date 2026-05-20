
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
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useMemo } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import type { Quote, Vehicle } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { clients, vehicles } from "@/lib/data";
import { Trash2, PlusCircle } from "lucide-react";
import { Separator } from "./ui/separator";

const quoteItemSchema = z.object({
    description: z.string().min(3, "La descripción es requerida."),
    quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1."),
    unitPrice: z.coerce.number().min(0, "El precio no puede ser negativo."),
});

const quoteSchema = z.object({
    clientId: z.string().min(1, "Debe seleccionar un cliente."),
    vehicleId: z.string().min(1, "Debe seleccionar un vehículo."),
    items: z.array(quoteItemSchema).min(1, "Debe añadir al menos un ítem."),
    total: z.number(),
});

type QuoteFormData = Omit<z.infer<typeof quoteSchema>, "total"> & { total?: number};


type QuoteFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Quote, 'id' | 'date' | 'status'>) => void;
  quote?: Quote | null;
};

export function QuoteFormDialog({ isOpen, onOpenChange, onSubmit, quote }: QuoteFormDialogProps) {
  
  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      clientId: "",
      vehicleId: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const watchItems = form.watch("items");
  const total = useMemo(() => {
    return watchItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  }, [watchItems]);

  const selectedClientId = form.watch("clientId");
  
  const clientVehicles = useMemo(() => {
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return [];
    return vehicles.filter(v => client.vehicleIds.includes(v.id));
  }, [selectedClientId]);

  useEffect(() => {
    if (isOpen) {
      if (quote) {
          form.reset({
            clientId: quote.clientId,
            vehicleId: quote.vehicleId,
            items: quote.items,
          });
      } else {
          form.reset({
            clientId: "",
            vehicleId: "",
            items: [{ description: "", quantity: 1, unitPrice: 0 }],
          });
      }
    }
  }, [quote, form, isOpen]);

  useEffect(() => {
      form.setValue('vehicleId', '');
  }, [selectedClientId, form]);

  const handleFormSubmit = (data: QuoteFormData) => {
    const finalData = {
        ...data,
        total: total,
    }
    onSubmit(finalData);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{quote ? "Editar Cotización" : "Nueva Cotización"}</DialogTitle>
          <DialogDescription>
            {quote ? "Actualice la información de la cotización." : "Complete los datos para crear un nuevo presupuesto."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cliente..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
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
                
                <Separator />
                
                <div className="space-y-2">
                    <FormLabel>Ítems de la Cotización</FormLabel>
                     {fields.map((field, index) => (
                        <div key={field.id} className="flex items-start gap-2">
                            <FormField
                                control={form.control}
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Textarea placeholder="Descripción del servicio o repuesto" {...field} rows={1} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                    <FormItem className="w-24">
                                        <FormControl>
                                            <Input type="number" placeholder="Cant." {...field} />
                                        </FormControl>
                                         <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`items.${index}.unitPrice`}
                                render={({ field }) => (
                                    <FormItem className="w-32">
                                        <FormControl>
                                            <Input type="number" placeholder="P. Unitario" {...field} />
                                        </FormControl>
                                         <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                     ))}
                     <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Ítem
                    </Button>
                </div>

                <Separator />

                <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>${total.toLocaleString('es-CL')}</span>
                        </div>
                    </div>
                </div>

                 <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit">Guardar Cotización</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
