
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
import type { MaintenancePlan } from "@/types";
import { Textarea } from "./ui/textarea";
import { Trash2, PlusCircle } from "lucide-react";
import { Separator } from "./ui/separator";

const taskSchema = z.object({
  description: z.string().min(3, "La descripción de la tarea es requerida."),
});

const planSchema = z.object({
  name: z.string().min(5, "El nombre del plan es requerido."),
  description: z.string().min(10, "La descripción es requerida."),
  tasks: z.array(taskSchema).min(1, "Debe añadir al menos una tarea."),
});

type PlanFormData = z.infer<typeof planSchema>;

type MaintenancePlanFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlanFormData) => void;
  plan?: MaintenancePlan | null;
};

export function MaintenancePlanFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  plan,
}: MaintenancePlanFormDialogProps) {
  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      description: "",
      tasks: [{ description: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  useEffect(() => {
    if (isOpen) {
      if (plan) {
        form.reset({
          name: plan.name,
          description: plan.description,
          tasks: plan.tasks,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          tasks: [{ description: "Cambio de aceite y filtro" }],
        });
      }
    }
  }, [plan, form, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {plan ? "Editar Plan de Mantenimiento" : "Nuevo Plan de Mantenimiento"}
          </DialogTitle>
          <DialogDescription>
            Defina los detalles y las tareas incluidas en este plan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Plan</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Plan Básico - 10.000km" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Una breve descripción del propósito de este plan."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-2">
              <FormLabel>Tareas del Plan</FormLabel>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`tasks.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Descripción de la tarea..." {...field} />
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
                      className="flex-shrink-0"
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
                onClick={() => append({ description: "" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Tarea
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">{plan ? "Guardar Cambios" : "Crear Plan"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
