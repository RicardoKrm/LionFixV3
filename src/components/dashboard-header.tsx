import { cn } from "@/lib/utils";

type DashboardHeaderProps = {
  title: string;
  children?: React.ReactNode;
  className?: string;
};

export function DashboardHeader({ title, children, className }: DashboardHeaderProps) {
  return (
    <header className={cn("flex items-center justify-between p-6 border-b bg-card/50", className)}>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
