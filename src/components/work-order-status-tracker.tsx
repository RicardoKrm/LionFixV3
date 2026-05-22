
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
  { name: "Ingresado", icon: Clock },
  { name: "En Diagnóstico", icon: FileCheck },
  { name: "Esperando Aprobación", icon: FileCheck },
  { name: "Esperando Repuestos", icon: Package },
  { name: "En Reparación", icon: Wrench },
  { name: "Listo para Retiro", icon: CheckCircle },
  { name: "Entregado", icon: Car },
];

type WorkOrderStatusTrackerProps = {
  currentStatus: WorkOrderStatus;
};

export function WorkOrderStatusTracker({ currentStatus }: WorkOrderStatusTrackerProps) {
  const currentIndex = statuses.findIndex(s => s.name === currentStatus);

  return (
    <TooltipProvider>
      <div className="w-full overflow-x-auto pb-4 pt-2 -mt-2 -mb-4 custom-scrollbar">
        <div className="flex items-center w-full min-w-[700px]">
          {statuses.map((status, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;

            return (
              <div key={status.name} className="flex items-center flex-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center cursor-pointer shrink-0">
                      <div
                        className={cn(
                          "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110",
                          isCompleted ? "bg-primary text-primary-foreground" :
                          isActive ? "bg-accent text-accent-foreground animate-pulse" :
                          "bg-muted text-muted-foreground"
                        )}
                      >
                        <status.icon className="h-5 w-5 md:h-6 md:w-6" />
                      </div>
                      <span className="text-[10px] text-center mt-2 max-w-[80px] md:hidden leading-tight text-muted-foreground">
                        {status.name}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{status.name}</p>
                  </TooltipContent>
                </Tooltip>

                {index < statuses.length - 1 && (
                  <div className={cn(
                    "flex-1 h-1.5 transition-colors duration-500 min-w-[20px] mx-2",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
