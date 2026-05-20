
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Edit, Trash2, CheckSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { useToast } from "@/hooks/use-toast";
import { MaintenancePlanFormDialog } from "@/components/maintenance-plan-form-dialog";

export default function MaintenancePlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPlans() {
      setLoading(true);
      const { data, error } = await supabase
        .from("maintenance_plans")
        .select("*");
      if (error) {
        console.error("Error fetching maintenance plans:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los planes de mantenimiento.",
          variant: "destructive",
        });
      } else {
        setPlans(data || []);
      }
      setLoading(false);
    }
    fetchPlans();
  }, []);

  const handleNewPlan = () => {
    setSelectedPlan(null);
    setIsFormOpen(true);
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  const handleDeletePlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedPlan) {
      const { error } = await supabase
        .from("maintenance_plans")
        .delete()
        .eq("id", selectedPlan.id);

      if (error) {
        console.error("Error deleting plan:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el plan de mantenimiento.",
          variant: "destructive",
        });
      } else {
        setPlans(plans.filter(p => p.id !== selectedPlan.id));
        toast({
          title: "Plan Eliminado",
          description: `El plan de mantenimiento "${selectedPlan.name}" ha sido eliminado.`,
        });
      }
    }
    setIsAlertOpen(false);
    setSelectedPlan(null);
  };

  const handleFormSubmit = async (data: any) => {
    if (selectedPlan) {
      // Edit existing plan
      const { data: updated, error } = await supabase
        .from("maintenance_plans")
        .update({
          name: data.name,
          description: data.description,
          tasks: data.tasks,
        })
        .eq("id", selectedPlan.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating plan:", error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el plan de mantenimiento.",
          variant: "destructive",
        });
      } else {
        setPlans(plans.map(p => p.id === selectedPlan.id ? updated : p));
        toast({
          title: "Plan Actualizado",
          description: "El plan de mantenimiento ha sido actualizado.",
        });
      }
    } else {
      // Create new plan
      const { data: created, error } = await supabase
        .from("maintenance_plans")
        .insert({
          name: data.name,
          description: data.description,
          tasks: data.tasks,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating plan:", error);
        toast({
          title: "Error",
          description: "No se pudo crear el plan de mantenimiento.",
          variant: "destructive",
        });
      } else {
        setPlans([created, ...plans]);
        toast({
          title: "Plan Creado",
          description: "El nuevo plan de mantenimiento ha sido añadido.",
        });
      }
    }
    setIsFormOpen(false);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <DashboardHeader title="Planes de Mantenimiento">
          <Button variant="secondary" disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Plan
          </Button>
        </DashboardHeader>
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Planes de Mantenimiento</CardTitle>
              <CardDescription>
                Cree, edite y gestione las plantillas de servicios para sus contratos de mantenimiento.
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <Skeleton className="h-5 w-1/3" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Planes de Mantenimiento">
        <Button onClick={handleNewPlan} variant="secondary">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Plan
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <Card>
           <CardHeader>
            <CardTitle>Gestión de Planes de Mantenimiento</CardTitle>
            <CardDescription>
              Cree, edite y gestione las plantillas de servicios para sus contratos de mantenimiento.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{plan.name}</CardTitle>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePlan(plan)}>
                         <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Plan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <h4 className="font-semibold">Tareas Incluidas:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    {(plan.tasks || []).map((task: any, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                            <CheckSquare className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                            <span>{task.description}</span>
                        </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <MaintenancePlanFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        plan={selectedPlan}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el plan de mantenimiento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPlan(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
