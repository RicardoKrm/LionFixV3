
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
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import type { PurchaseOrder } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { parts as inventoryParts } from "@/lib/data";
import { Trash2, PlusCircle } from "lucide-react";
import { Separator } from "./ui/separator";

const purchaseOrderItemSchema = z.object({
  sku: z.string().min(1, "Debe seleccionar un repuesto."),
  name: z.string(),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1."),
});

const purchaseOrderSchema = z.object({
  supplier: z.string().min(1, "Debe seleccionar un proveedor."),
  items: z.array(purchaseOrderItemSchema).min(1, "Debe añadir al menos un repuesto."),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

type PurchaseOrderDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PurchaseOrder) => void;
};

const suppliers = ["Repuestos Express", "TodoFrenos S.A.", "Importadora Automotriz"];

export function PurchaseOrderDialog({
  isOpen,
  onOpenChange,
  onSubmit,
}: PurchaseOrderDialogProps) {
  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (isOpen) {
        // Pre-fill with low-stock items
        const lowStockItems = inventoryParts
            .filter(p => p.stock <= p.alertThreshold)
            .map(p => ({ sku: p.sku, name: p.name, quantity: p.alertThreshold * 2 })); // Suggest ordering double the threshold
      
        form.reset({
            supplier: "",
            items: lowStockItems,
        });
    }
  }, [form, isOpen]);

  const handlePartSelection = (sku: string, index: number) => {
    const part = inventoryParts.find((p) => p.sku === sku);
    if (part) {
      form.setValue(`items.${index}.sku`, part.sku);
      form.setValue(`items.${index}.name`, part.name);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Compra</DialogTitle>
          <DialogDescription>
            Seleccione un proveedor y los repuestos que desea solicitar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier} value={supplier}>
                          {supplier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-2">
              <FormLabel>Ítems a Solicitar</FormLabel>
              <div className="max-h-60 overflow-y-auto pr-4 space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.sku`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handlePartSelection(value, index);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar repuesto..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {inventoryParts.map((part) => (
                                <SelectItem key={part.sku} value={part.sku}>
                                  {part.name} (Stock: {part.stock})
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
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="w-28">
                          <FormControl>
                            <Input type="number" placeholder="Cantidad" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ sku: "", name: "", quantity: 10 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Ítem
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Enviar Orden de Compra</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
