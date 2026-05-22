import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";

type DashboardHeaderProps = {
  title: string;
  children?: React.ReactNode;
  className?: string;
};

export function DashboardHeader({ title, children, className }: DashboardHeaderProps) {
  return (
    <header className={cn("flex items-center justify-between p-4 md:p-6 border-b bg-card/50 shrink-0", className)}>
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden -ml-2" />
        <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </header>
  );
}
