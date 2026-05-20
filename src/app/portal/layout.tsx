

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
  Car,
  FileText,
  LogOut,
  ShieldCheck,
  Briefcase,
  History,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";


function ClientSidebar() {
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
              Portal Cliente
            </h2>
            <p className="text-sm text-sidebar-foreground/70">LionFix</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/portal/dashboard" passHref>
              <SidebarMenuButton
                isActive={isActive("/portal/dashboard")}
                tooltip="Inicio"
              >
                <Home />
                <span>Inicio</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/portal/vehicles" passHref>
              <SidebarMenuButton
                isActive={isActive("/portal/vehicles")}
                tooltip="Mis Vehículos"
              >
                <Car />
                <span>Mis Vehículos</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/portal/contracts" passHref>
              <SidebarMenuButton
                isActive={isActive("/portal/contracts")}
                tooltip="Mis Contratos"
              >
                <Briefcase />
                <span>Mis Contratos</span>
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
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
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


export default function ClientPortalLayout({
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
      } else if (user.role !== 'client') {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'client') {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
             <div className="text-center">
                <p className="text-lg text-muted-foreground">Verificando acceso de cliente...</p>
                <Skeleton className="w-64 h-8 mt-4 mx-auto" />
            </div>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <ClientSidebar />
      <SidebarInset>
            {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
