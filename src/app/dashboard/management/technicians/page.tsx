
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
import { Badge } from "@/components/ui/badge";
import { PlusCircle, User, Calendar, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { technicians as initialTechnicians } from "@/lib/data";
import type { Technician } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
import { TechnicianFormDialog } from "@/components/technician-form-dialog";


export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  const handleNewTechnician = () => {
    setSelectedTechnician(null);
    setIsFormOpen(true);
  };
  
  const handleEditTechnician = (technician: Technician) => {
    setSelectedTechnician(technician);
    setIsFormOpen(true);
  };
  
  const handleDeleteTechnician = (technician: Technician) => {
    setSelectedTechnician(technician);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTechnician) {
      setTechnicians(technicians.filter((t) => t.id !== selectedTechnician.id));
      toast({
        title: "Técnico Eliminado",
        description: `El técnico ${selectedTechnician.name} ha sido eliminado.`,
      });
    }
    setIsAlertOpen(false);
    setSelectedTechnician(null);
  };

  const handleFormSubmit = (data: Omit<Technician, "id">) => {
    if (selectedTechnician) {
      // Edit
      setTechnicians(technicians.map((t) =>
        t.id === selectedTechnician.id ? { ...t, ...data } : t
      ));
      toast({
        title: "Técnico Actualizado",
        description: "Los datos del técnico han sido actualizados.",
      });
    } else {
      // Create
      const newTechnician: Technician = {
        id: `TECH-${(technicians.length + 1).toString().padStart(3, '0')}`,
        ...data,
      };
      setTechnicians([...technicians, newTechnician]);
       toast({
        title: "Técnico Creado",
        description: "El nuevo técnico ha sido añadido al equipo.",
      });
    }
    setIsFormOpen(false);
    setSelectedTechnician(null);
  };

  return (
    <>
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Gestión de Técnicos">
        <Button onClick={handleNewTechnician} variant="default">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Técnico
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicians.map((tech) => (
            <Card key={tech.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={tech.avatarUrl} data-ai-hint="mechanic portrait" />
                            <AvatarFallback>{tech.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                             <CardTitle>{tech.name}</CardTitle>
                             <CardDescription>ID: {tech.id}</CardDescription>
                        </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                           </Button>
                        </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTechnician(tech)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteTechnician(tech)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div>
                    <h4 className="text-sm font-semibold mb-2">Especialidades</h4>
                    <div className="flex flex-wrap gap-2">
                        {tech.specialties.map(spec => (
                            <Badge key={spec} variant="secondary">{spec}</Badge>
                        ))}
                    </div>
                </div>
                 <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Miembro desde: {new Date(tech.hireDate).toLocaleDateString()}</span>
                    </div>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-semibold">Horas Extra (Mes)</h4>
                        <span className="text-sm font-medium">{tech.extraHoursThisMonth} / {tech.maxExtraHours} hrs</span>
                    </div>
                    <Progress value={(tech.extraHoursThisMonth / tech.maxExtraHours) * 100} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>

    <TechnicianFormDialog
      isOpen={isFormOpen}
      onOpenChange={setIsFormOpen}
      onSubmit={handleFormSubmit}
      technician={selectedTechnician}
    />

    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará al técnico del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTechnician(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
