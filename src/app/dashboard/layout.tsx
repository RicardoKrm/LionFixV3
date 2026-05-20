
'use client';
import { useAuth } from "@/context/auth-context";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
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
      } else if (user.role !== 'admin') {
        // If the user is logged in but not an admin, redirect them.
        router.push('/');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="text-center">
                <p className="text-lg text-muted-foreground">Verificando acceso de administrador...</p>
                <Skeleton className="w-64 h-8 mt-4 mx-auto" />
            </div>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
            {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
