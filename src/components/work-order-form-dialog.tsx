
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
import { useEffect, useMemo } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import type { WorkOrder, Vehicle, WorkOrderStatus, WorkOrderType, WorkOrderPart } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { clients, vehicles, parts as inventoryParts, technicians } from "@/lib/data";
import { Trash2, PlusCircle } from "lucide-react";
import { Separator } from "./ui/separator";

const partItemSchema = z.object({
  sku: z.string().min(1, "Debe seleccionar un repuesto."),
  name: z.string(),
  quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1."),
  cost: z.number(),
  price: z.number(),
});

const workOrderSchema = z.object({
  clientId: z.string().min(1, "Debe seleccionar un cliente."),
  vehicleId: z.string().min(1, "Debe seleccionar un vehículo."),
  service: z.string().min(3, "La descripción del servicio es requerida."),
  type: z.custom<WorkOrderType>(),
  technician: z.string().min(1, "Debe seleccionar un técnico."),
  laborHours: z.coerce.number().min(0, "Las horas deben ser un número positivo."),
  status: z.custom<WorkOrderStatus>().optional(),
  parts: z.array(partItemSchema).optional(),
  finalReport: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

type WorkOrderFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<WorkOrder, "id" | "date" | "entryDate" | "serviceLog">) => void;
  workOrder?: WorkOrder | null;
};

export function WorkOrderFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  workOrder,
}: WorkOrderFormDialogProps) {
  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      clientId: "",
      vehicleId: "",
      service: "",
      type: "Mantención Correctiva",
      technician: "",
      laborHours: 0,
      parts: [],
      finalReport: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "parts",
  });

  const selectedClientId = form.watch("clientId");

  const clientVehicles = useMemo(() => {
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return [];
    return vehicles.filter(v => client.vehicleIds.includes(v.id));
  }, [selectedClientId]);


  useEffect(() => {
    if (isOpen) {
      if (workOrder) {
        form.reset({
          ...workOrder,
          finalReport: workOrder.finalReport || '',
        });
      } else {
        form.reset({
          clientId: "",
          vehicleId: "",
          service: "",
          type: "Mantención Correctiva",
          technician: "",
          laborHours: 0,
          parts: [],
          finalReport: "",
        });
      }
    }
  }, [workOrder, form, isOpen]);

  useEffect(() => {
      if(!workOrder) {
         form.setValue('vehicleId', '');
      }
  }, [selectedClientId, form, workOrder]);

  const handleFormSubmit = (data: WorkOrderFormData) => {
    const finalData = {
      ...data,
      status: workOrder?.status || 'Recibido',
      parts: data.parts || [],
    };
    onSubmit(finalData);
  };

  const handlePartSelection = (sku: string, index: number) => {
      const part = inventoryParts.find(p => p.sku === sku);
      if (part) {
          form.setValue(`parts.${index}.sku`, part.sku);
          form.setValue(`parts.${index}.name`, part.name);
          form.setValue(`parts.${index}.cost`, part.cost);
          form.setValue(`parts.${index}.price`, part.price);
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {workOrder ? "Editar Orden de Trabajo" : "Nueva Orden de Trabajo"}
          </DialogTitle>
          <DialogDescription>
            Complete los datos para registrar un nuevo trabajo en el taller.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 overflow-y-auto pr-6 -mr-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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
                  <FormLabel>Tipo de Orden</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mantención Correctiva">Mantención Correctiva</SelectItem>
                      <SelectItem value="Mantención Preventiva">Mantención Preventiva</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servicio Principal a Realizar</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Mantención 20.000km, cambio de frenos..."
                      {...field}
                    />
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
                      <FormLabel>Técnico Asignado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar técnico..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {technicians.map(tech => (
                             <SelectItem key={tech.id} value={tech.name}>{tech.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="laborHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas de Mano de Obra</FormLabel>
                       <FormControl>
                         <Input type="number" step="0.5" placeholder="Ej: 2.5" {...field} />
                       </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <Separator />

            <div className="space-y-2">
              <FormLabel>Repuestos y Materiales</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                   <FormField
                    control={form.control}
                    name={`parts.${index}.sku`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={(value) => {field.onChange(value); handlePartSelection(value, index)}} value={field.value}>
                           <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar repuesto..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {inventoryParts.map((part) => (
                                    <SelectItem key={part.sku} value={part.sku}>
                                        {part.name} ({part.sku})
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
                    name={`parts.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormControl>
                          <Input type="number" placeholder="Cant." {...field} />
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ sku: "", name: "", quantity: 1, cost: 0, price: 0 })
                }
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Repuesto
              </Button>
            </div>
            
            <Separator />

             <FormField
              control={form.control}
              name="finalReport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Informe Final para el Cliente</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Resumen del trabajo realizado, recomendaciones y próximos pasos. Este texto será visible para el cliente."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="sticky bottom-0 bg-background pt-4 pb-0 -mb-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">{workOrder ? "Guardar Cambios" : "Crear Orden"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
