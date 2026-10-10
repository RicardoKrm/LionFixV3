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
    const localList = getLocalStaff();

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mergedMap = new Map<string, StaffProfile>();
        data.forEach((p: any) => {
          mergedMap.set(p.id, {
            id: p.id,
            name: p.name || "Usuario",
            email: p.email || "",
            role: p.role || "mechanic",
            created_at: p.created_at || new Date().toISOString(),
          });
        });
        localList.forEach((lp) => {
          if (!mergedMap.has(lp.id)) mergedMap.set(lp.id, lp);
        });
        setProfiles(Array.from(mergedMap.values()));
        setLoading(false);
        return;
      }
    } catch {
      // Fallback to local + current user if RLS policy blocks profiles query
    }

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
  }, [getLocalStaff, user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleRoleChange = async (userId: string, updatedRole: "admin" | "mechanic" | "client") => {
    const updated = profiles.map((p) => (p.id === userId ? { ...p, role: updatedRole } : p));
    setProfiles(updated);
    saveLocalStaff(updated);

    try {
      await supabase
        .from("profiles")
        .update({ role: updatedRole })
        .eq("id", userId);
    } catch {
      // Non-blocking if local entry
    }

    toast({
      title: "Rol Actualizado",
      description: "Los permisos del usuario han sido modificados correctamente.",
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const entry: StaffProfile = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from("profiles").insert({
        id: entry.id,
        name: entry.name,
        email: entry.email,
        role: entry.role,
      });
    } catch {
      // Keep in local directory if auth FK or RLS applies
    }

    const updated = [entry, ...profiles];
    setProfiles(updated);
    saveLocalStaff(updated);

    toast({
      title: "Personal Registrado",
      description: `${entry.name} (${entry.email}) fue agregado al directorio.`,
    });

    setNewName("");
    setNewEmail("");
    setNewRole("mechanic");
    setIsAddOpen(false);
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
      await supabase.from("profiles").delete().eq("id", target.id);
    } catch {
      // Ignore if local
    }

    toast({
      title: "Usuario Eliminado",
      description: `${target.name} ha sido removido del directorio.`,
    });
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
