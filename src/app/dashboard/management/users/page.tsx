"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, ShieldAlert, CarFront } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UsersPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProfiles(data);
    } else {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
      });
    }
    setLoading(false);
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el rol.",
      });
    } else {
      toast({
        title: "Rol Actualizado",
        description: "Los permisos del usuario han sido modificados.",
      });
      fetchProfiles();
    }
  };

  const filteredProfiles = profiles.filter(p => 
    (p.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (p.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge variant="destructive" className="bg-red-500/20 text-red-500 hover:bg-red-500/30">Administrador</Badge>;
      case "mechanic": return <Badge variant="outline" className="text-blue-500 border-blue-500/30">Mecánico</Badge>;
      case "client": return <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Cliente</Badge>;
      default: return <Badge variant="secondary">Usuario</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] font-sans">
      <DashboardHeader title="Gestión de Usuarios">
        <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar Cliente
        </Button>
      </DashboardHeader>

      <main className="flex-1 p-6 overflow-y-auto bg-background/50">
        <Card className="border-border/50 shadow-xl bg-card/40 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-headline font-bold">Directorio de Accesos</CardTitle>
                <CardDescription>
                  Administra los roles, permisos y credenciales de todos los usuarios de la plataforma.
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
                     <TableHead>Usuario</TableHead>
                     <TableHead>Email de Acceso</TableHead>
                     <TableHead>Rol Actual</TableHead>
                     <TableHead>Registro</TableHead>
                     <TableHead className="text-right">Acciones</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {loading ? (
                     <TableRow>
                       <TableCell colSpan={5} className="h-24 text-center">Cargando directorio...</TableCell>
                     </TableRow>
                   ) : filteredProfiles.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No se encontraron usuarios.</TableCell>
                     </TableRow>
                   ) : (
                     filteredProfiles.map((profile) => (
                       <TableRow key={profile.id} className="hover:bg-muted/20">
                         <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                {profile.name?.substring(0,2).toUpperCase() || 'US'}
                              </div>
                              {profile.name || "Sin nombre"}
                            </div>
                         </TableCell>
                         <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                         <TableCell>
                            <Select
                                defaultValue={profile.role || "client"}
                                onValueChange={(val) => handleRoleChange(profile.id, val)}
                              >
                                <SelectTrigger className="w-[140px] h-8 text-xs border-border/50 bg-transparent">
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
                           {new Date(profile.created_at).toLocaleDateString('es-CL')}
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="icon" title="Restablecer Contraseña" disabled>
                               <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                             </Button>
                             {profile.role === 'client' && (
                               <Button variant="ghost" size="icon" title="Ver Vehículos Asignados">
                                 <CarFront className="h-4 w-4 text-muted-foreground" />
                               </Button>
                             )}
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
    </div>
  );
}
