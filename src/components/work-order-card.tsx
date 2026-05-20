
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { EnrichedWorkOrder } from "@/types";
import { Wrench, ArrowRight } from "lucide-react";
import { getStatusVariant } from "@/lib/utils";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export function WorkOrderCard({ workOrder }: { workOrder: EnrichedWorkOrder }) {

  return (
    <Card className="flex flex-col group overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
            <Image 
                src={`https://placehold.co/600x400.png`}
                alt={`${workOrder.vehicle.make} ${workOrder.vehicle.model}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={`${workOrder.vehicle.make} ${workOrder.vehicle.model}`}
            />
        </div>
        <CardContent className="p-4 flex-grow flex flex-col">
            <div className="flex justify-between items-start gap-2">
                <div>
                    <CardTitle className="text-lg">{workOrder.vehicle.make} {workOrder.vehicle.model}</CardTitle>
                    <CardDescription>
                        {workOrder.client.name} / <span className="font-mono">{workOrder.vehicle.licensePlate}</span>
                    </CardDescription>
                </div>
                <Badge variant={getStatusVariant(workOrder.status)} className="flex-shrink-0">{workOrder.status}</Badge>
            </div>
            
            <div className="flex items-start gap-3 pt-4 flex-grow">
                <Wrench className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-semibold leading-tight text-primary">{workOrder.id}</p>
                    <p className="text-sm text-muted-foreground">{workOrder.service}</p>
                </div>
            </div>
        </CardContent>
        <CardFooter className="p-0">
            <Link href={`/dashboard/work-orders/${workOrder.id}`} className="w-full">
                <div className="flex items-center justify-between w-full px-4 py-3 bg-muted/30 group-hover:bg-primary/10 transition-colors duration-300">
                    <span className="text-sm font-semibold">Ver Orden de Trabajo</span>
                    <ArrowRight className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                </div>
            </Link>
        </CardFooter>
    </Card>
  );
}
