
"use client";

import { useState } from "react";
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

import { maintenancePlans as initialPlans } from "@/lib/data";
import type { MaintenancePlan } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { MaintenancePlanFormDialog } from "@/components/maintenance-plan-form-dialog";

export default function MaintenancePlansPage() {
  const [plans, setPlans] = useState<MaintenancePlan[]>(initialPlans);
  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  const handleNewPlan = () => {
    setSelectedPlan(null);
    setIsFormOpen(true);
  };

  const handleEditPlan = (plan: MaintenancePlan) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  const handleDeletePlan = (plan: MaintenancePlan) => {
    setSelectedPlan(plan);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPlan) {
      setPlans(plans.filter(p => p.id !== selectedPlan.id));
      toast({
        title: "Plan Eliminado",
        description: `El plan de mantenimiento "${selectedPlan.name}" ha sido eliminado.`,
      });
    }
    setIsAlertOpen(false);
    setSelectedPlan(null);
  };

  const handleFormSubmit = (data: Omit<MaintenancePlan, 'id'>) => {
    if (selectedPlan) {
      // Edit existing plan
      const updatedPlan = { ...selectedPlan, ...data };
      setPlans(plans.map(p => p.id === selectedPlan.id ? updatedPlan : p));
      toast({
        title: "Plan Actualizado",
        description: "El plan de mantenimiento ha sido actualizado.",
      });
    } else {
      // Create new plan
      const newPlan: MaintenancePlan = {
        id: `PLAN-${(plans.length + 1).toString().padStart(3, '0')}`,
        ...data,
      };
      setPlans([newPlan, ...plans]);
      toast({
        title: "Plan Creado",
        description: "El nuevo plan de mantenimiento ha sido añadido.",
      });
    }
    setIsFormOpen(false);
    setSelectedPlan(null);
  };

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
                    {plan.tasks.map((task, index) => (
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
