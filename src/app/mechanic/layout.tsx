

"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  Home,
  Wrench,
  Calendar,
  LogOut,
  ShieldCheck,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function MechanicSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 bg-sidebar-primary flex items-center justify-center rounded-lg">
             <ShieldCheck className="text-sidebar-primary-foreground" />
          </Avatar>
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-sidebar-foreground">
              Portal Mecánico
            </h2>
            <p className="text-sm text-sidebar-foreground/70">LionFix</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/mechanic/dashboard" passHref>
              <SidebarMenuButton
                isActive={isActive("/mechanic/dashboard")}
                tooltip="Mis Tareas"
              >
                <Wrench />
                <span>Mis Tareas</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <Link href="/dashboard/management/checklists" passHref>
               <SidebarMenuButton
                isActive={isActive("/dashboard/management/checklists")}
                tooltip="Checklists"
              >
                <ClipboardCheck />
                <span>Checklists</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/calendar" passHref>
               <SidebarMenuButton
                isActive={isActive("/dashboard/calendar")}
                tooltip="Calendario"
              >
                <Calendar />
                <span>Calendario Taller</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Perfil">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl} alt={user?.name || ''} />
                    <AvatarFallback>{user?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                    <span className="text-sm font-medium text-sidebar-foreground">{user?.name}</span>
                    <span className="text-xs text-sidebar-foreground/70 capitalize">{user?.role}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton tooltip="Cerrar Sesión" onClick={logout}>
              <LogOut />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}


export default function MechanicPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'mechanic') {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'mechanic') {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
           <div className="text-center">
                <p className="text-lg text-muted-foreground">Verificando acceso de mecánico...</p>
                <Skeleton className="w-64 h-8 mt-4 mx-auto" />
            </div>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <MechanicSidebar />
      <SidebarInset>
            {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
