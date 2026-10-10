"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, UserPlus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const LOCAL_STAFF_KEY = "lionfix_staff_directory";

interface StaffProfile {
  id: string;
  name: string;
  email: string;
  role: "admin" | "mechanic" | "client";
  created_at: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "mechanic" | "client">("mechanic");
  const { toast } = useToast();

  const getLocalStaff = useCallback((): StaffProfile[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(LOCAL_STAFF_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const saveLocalStaff = useCallback((list: StaffProfile[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(list));
    } catch {
      // ignore storage errors
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setProfiles(json.data);
        saveLocalStaff(json.data);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback if offline
    }

    const localList = getLocalStaff();
    const fallbackList: StaffProfile[] = [
      {
        id: user?.uid || "admin-principal",
        name: user?.name || "Administrador General",
        email: user?.email || "admin@lionfix.cl",
        role: (user?.role as "admin" | "mechanic" | "client") || "admin",
        created_at: new Date().toISOString(),
      },
      ...localList.filter((item) => item.email !== (user?.email || "admin@lionfix.cl")),
    ];
    setProfiles(fallbackList);
    setLoading(false);
  }, [getLocalStaff, saveLocalStaff, user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleRoleChange = async (userId: string, updatedRole: "admin" | "mechanic" | "client") => {
    const updated = profiles.map((p) => (p.id === userId ? { ...p, role: updatedRole } : p));
    setProfiles(updated);
    saveLocalStaff(updated);

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: updatedRole }),
      });
      if (!res.ok) throw new Error("Error al actualizar rol");
      toast({
        title: "Rol Guardado en Base de Datos",
        description: "Los permisos del usuario han sido actualizados en Supabase.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el rol en la base de datos.",
      });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          role: newRole,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) {
        throw new Error(json.error || "No se pudo crear el usuario");
      }

      const updated = [json.data, ...profiles.filter((p) => p.id !== json.data.id)];
      setProfiles(updated);
      saveLocalStaff(updated);

      toast({
        title: "Personal Guardado en Supabase",
        description: `${json.data.name} (${json.data.email}) fue creado en la base de datos.`,
      });

      setNewName("");
      setNewEmail("");
      setNewRole("mechanic");
      setIsAddOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al registrar usuario",
        description: err.message || "Ocurrió un error al guardar en Supabase.",
      });
    }
  };

  const handleDeleteUser = async (target: StaffProfile) => {
    if (target.email === (user?.email || "admin@lionfix.cl")) {
      toast({
        variant: "destructive",
        title: "Acción no permitida",
        description: "No puedes eliminar tu propia cuenta de administrador activo.",
      });
      return;
    }

    const updated = profiles.filter((p) => p.id !== target.id);
    setProfiles(updated);
    saveLocalStaff(updated);

    try {
      await fetch(`/api/users?id=${encodeURIComponent(target.id)}`, { method: "DELETE" });
      toast({
        title: "Usuario Eliminado",
        description: `${target.name} ha sido eliminado de la base de datos.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el usuario.",
      });
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (p.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Administrador</Badge>;
      case "mechanic":
        return <Badge variant="outline" className="text-blue-400 border-blue-500/30">Mecánico</Badge>;
      case "client":
        return <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Cliente</Badge>;
      default:
        return <Badge variant="secondary">Usuario</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] font-sans">
      <DashboardHeader title="Personal & Usuarios">
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Registrar Personal / Usuario
        </Button>
      </DashboardHeader>

      <main className="flex-1 p-6 overflow-y-auto bg-background/50">
        <Card className="border-border/50 shadow-xl bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-headline font-bold">Directorio de Personal y Accesos</CardTitle>
                <CardDescription>
                  Administra los roles, técnicos mecánicos y permisos de los usuarios de la plataforma.
                </CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background/50 border-border/50"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/50 overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Usuario / Integrante</TableHead>
                    <TableHead>Email de Acceso</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Cambiar Rol</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Cargando directorio...
                      </TableCell>
                    </TableRow>
                  ) : filteredProfiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No se encontraron usuarios.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfiles.map((profile) => (
                      <TableRow key={profile.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {profile.name?.substring(0, 2).toUpperCase() || "US"}
                            </div>
                            {profile.name || "Sin nombre"}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                        <TableCell>{getRoleBadge(profile.role)}</TableCell>
                        <TableCell>
                          <Select
                            value={profile.role || "mechanic"}
                            onValueChange={(val) =>
                              handleRoleChange(profile.id, val as "admin" | "mechanic" | "client")
                            }
                          >
                            <SelectTrigger className="w-[150px] h-8 text-xs border-border/50 bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="mechanic">Mecánico</SelectItem>
                              <SelectItem value="client">Cliente</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(profile.created_at).toLocaleDateString("es-CL")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Eliminar del directorio"
                              onClick={() => handleDeleteUser(profile)}
                              disabled={profile.email === (user?.email || "admin@lionfix.cl")}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Personal / Usuario</DialogTitle>
            <DialogDescription>
              Agrega un mecánico, administrador o usuario al directorio operativo del taller.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Nombre Completo</Label>
              <Input
                id="staff-name"
                required
                placeholder="Ej: Carlos Soto"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Correo Electrónico</Label>
              <Input
                id="staff-email"
                type="email"
                required
                placeholder="carlos@lionfix.cl"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol en el Taller</Label>
              <Select
                value={newRole}
                onValueChange={(val) => setNewRole(val as "admin" | "mechanic" | "client")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mechanic">Mecánico / Técnico</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Usuario</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
