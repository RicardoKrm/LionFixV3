
"use client";

import { CheckCircle, Clock, Package, Wrench, Car, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkOrderStatus } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const statuses: { name: WorkOrderStatus; icon: React.ElementType }[] = [
  { name: "Recibido", icon: Clock },
  { name: "Esperando Aprobación", icon: FileCheck },
  { name: "En Reparación", icon: Wrench },
  { name: "Esperando Repuestos", icon: Package },
  { name: "Completado", icon: CheckCircle },
  { name: "Entregado", icon: Car },
];

type WorkOrderStatusTrackerProps = {
  currentStatus: WorkOrderStatus;
};

export function WorkOrderStatusTracker({ currentStatus }: WorkOrderStatusTrackerProps) {
  const currentIndex = statuses.findIndex(s => s.name === currentStatus);

  return (
    <TooltipProvider>
      <div className="flex items-center w-full py-4">
        {statuses.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;

          return (
            <div key={status.name} className="flex items-center w-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center cursor-pointer">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110",
                        isCompleted ? "bg-primary text-primary-foreground" :
                        isActive ? "bg-accent text-accent-foreground animate-pulse" :
                        "bg-muted text-muted-foreground"
                      )}
                    >
                      <status.icon className="h-6 w-6" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{status.name}</p>
                </TooltipContent>
              </Tooltip>

              {index < statuses.length - 1 && (
                <div className={cn(
                  "flex-1 h-1.5 transition-colors duration-500",
                  isCompleted ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
