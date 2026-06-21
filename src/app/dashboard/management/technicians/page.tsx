"use client";

import { useState, useEffect } from "react";
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
import { PlusCircle, User, Calendar, MoreHorizontal, Edit, Trash2, Copy, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TechnicianFormDialog } from "@/components/technician-form-dialog";
import { Skeleton } from "@/components/ui/skeleton";

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}


export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTechnicians() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*, technician_details(*)')
        .eq('role', 'mechanic');

      if (error) {
        console.error('Error fetching technicians:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los técnicos.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (data) {
        const mapped: Technician[] = data.map((row: any) => {
          const details = Array.isArray(row.technician_details)
            ? row.technician_details[0]
            : row.technician_details;
          return {
            id: row.user_id,
            name: row.name || '',
            avatarUrl: details?.avatar_url || '',
            specialties: details?.specialties || [],
            hireDate: details?.hire_date || '',
            contact: row.email || '',
            baseSalary: 0,
            extraHourRate: 0,
            extraHoursThisMonth: details?.extra_hours_this_month || 0,
            maxExtraHours: details?.max_extra_hours || 40,
          };
        });
        setTechnicians(mapped);
      }
      setLoading(false);
    }

    fetchTechnicians();
  }, []);

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

  const confirmDelete = async () => {
    if (selectedTechnician) {
      // Delete technician_details first (if exists), then update role to remove mechanic access
      await supabase.from('technician_details').delete().eq('user_id', selectedTechnician.id);
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'client' })
        .eq('id', selectedTechnician.id);
      if (!error) {
        setTechnicians(technicians.filter((t) => t.id !== selectedTechnician.id));
        toast({ title: "Técnico Eliminado", description: `${selectedTechnician.name} ha sido removido del equipo.` });
      } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el técnico." });
      }
    }
    setIsAlertOpen(false);
    setSelectedTechnician(null);
  };

  const handleFormSubmit = async (data: any) => {
    if (selectedTechnician) {
      // EDIT: update profile name + upsert technician_details
      await supabase.from('profiles').update({ name: data.name }).eq('id', selectedTechnician.id);
      const { error } = await supabase.from('technician_details').upsert({
        profile_id: selectedTechnician.id,
        specialties: data.specialties,
        hire_date: data.hireDate,
        contact_phone: data.contact,
        base_salary: data.baseSalary,
        extra_hour_rate: data.extraHourRate,
        extra_hours_this_month: data.extraHoursThisMonth,
        max_extra_hours: data.maxExtraHours,
      }, { onConflict: 'profile_id' });
      if (!error) {
        setTechnicians(technicians.map((t) => t.id === selectedTechnician.id ? { ...t, ...data } : t));
        toast({ title: "Técnico Actualizado", description: "Los datos han sido guardados." });
      } else {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    } else {
      const autoPassword = generatePassword();

      // Use signUp to create the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: autoPassword,
        options: {
          data: { name: data.name, role: 'mechanic' }
        }
      });

      if (signUpError || !signUpData.user) {
        toast({ variant: "destructive", title: "Error al crear cuenta", description: signUpError?.message || "No se pudo crear la cuenta." });
        return;
      }

      const newUserId = signUpData.user.id;

      // Upsert profile with mechanic role
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: newUserId,
        email: data.email,
        name: data.name,
        role: 'mechanic',
        avatar_url: data.avatarUrl || null,
      }, { onConflict: 'id' });

      if (profileError) {
        toast({ variant: "destructive", title: "Cuenta creada pero error en perfil", description: profileError.message });
        return;
      }

      // Insert technician_details
      await supabase.from('technician_details').upsert({
        profile_id: newUserId,
        specialties: data.specialties,
        hire_date: data.hireDate,
        contact_phone: data.contact,
        base_salary: data.baseSalary,
        extra_hour_rate: data.extraHourRate,
        extra_hours_this_month: data.extraHoursThisMonth,
        max_extra_hours: data.maxExtraHours,
      }, { onConflict: 'profile_id' });

      const newTech: Technician = {
        id: newUserId,
        name: data.name,
        avatarUrl: data.avatarUrl || '',
        specialties: data.specialties,
        hireDate: data.hireDate,
        contact: data.contact,
        baseSalary: data.baseSalary,
        extraHourRate: data.extraHourRate,
        extraHoursThisMonth: data.extraHoursThisMonth,
        maxExtraHours: data.maxExtraHours,
      };
      setTechnicians([...technicians, newTech]);
      
      // Show the generated credentials
      setCreatedCredentials({ name: data.name, email: data.email, password: autoPassword });
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
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
          technicians.map((tech) => (
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
          ))
          )}
        </div>
      </main>
    </div>

    <TechnicianFormDialog
      isOpen={isFormOpen}
      onOpenChange={setIsFormOpen}
      onSubmit={handleFormSubmit}
      technician={selectedTechnician}
    />

    {/* Credentials Dialog — shown after creating a new technician */}
    <Dialog open={!!createdCredentials} onOpenChange={() => setCreatedCredentials(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="text-primary" /> ✅ Técnico Creado Exitosamente
          </DialogTitle>
          <DialogDescription>
            Guarda estas credenciales en un lugar seguro. La contraseña NO se podrá recuperar más tarde.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 my-2">
          <div className="p-4 rounded-lg bg-muted border space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Técnico</p>
              <p className="font-semibold">{createdCredentials?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Email de acceso</p>
              <p className="font-mono text-sm">{createdCredentials?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Contraseña generada</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-lg font-bold tracking-widest text-primary flex-1">{createdCredentials?.password}</p>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(createdCredentials?.password || '');
                    toast({ title: "Copiado al portapapeles" });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">El técnico debe cambiar su contraseña en el primer inicio de sesión.</p>
        </div>
        <DialogFooter>
          <Button onClick={() => setCreatedCredentials(null)}>Entendido, ya la guardé</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
