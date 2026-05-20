
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { QuoteStatus, WorkOrderStatus, NotificationStatus, FleetContractStatus } from "@/types";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type Status = WorkOrderStatus | QuoteStatus | NotificationStatus | FleetContractStatus;

export const getStatusVariant = (status: Status): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Completado":
      case "Entregado":
      case "Aprobada":
      case "Enviada":
      case "Activo":
        return "default";
      case "En Reparación":
      case "Programada":
      case "En Negociación":
        return "secondary";
      case "Esperando Repuestos":
      case "Rechazada":
      case "Fallida":
      case "Vencido":
        return "destructive";
      case "Recibido":
      case "Esperando Aprobación":
      default:
        return "outline";
    }
  };
