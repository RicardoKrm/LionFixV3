
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { WorkOrder } from "@/types";
import { Textarea } from "./ui/textarea";

type SatisfactionSurveyToolProps = {
  workOrder: WorkOrder;
  onSurveySubmit: (rating: number, comment: string) => void;
};

export function SatisfactionSurveyTool({ workOrder, onSurveySubmit }: SatisfactionSurveyToolProps) {
  const [rating, setRating] = useState(workOrder.satisfactionRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(workOrder.satisfactionComment || "");
  const { toast } = useToast();

  const handleSendSurvey = () => {
    toast({
      title: "Encuesta Enviada (Simulación)",
      description: `Se ha enviado la encuesta de satisfacción al cliente.`,
    });
  };
  
  const handleRegisterResponse = () => {
    if (rating === 0) {
        toast({ variant: "destructive", title: "Error", description: "Por favor seleccione una calificación."});
        return;
    }
    onSurveySubmit(rating, comment);
    toast({ title: "Respuesta Registrada", description: "Se ha guardado la calificación del cliente." });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Encuesta de Satisfacción</CardTitle>
        <CardDescription>
          Envíe y registre la opinión del cliente sobre el servicio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Calificación del Cliente</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-8 w-8 cursor-pointer transition-colors",
                  (hoverRating || rating) >= star
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground"
                )}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>
        </div>
        <div>
            <label htmlFor="satisfaction-comment" className="text-sm font-medium">Comentarios</label>
            <Textarea 
                id="satisfaction-comment"
                placeholder="El cliente no dejó comentarios."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
            />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleSendSurvey}>
          <Send className="mr-2 h-4 w-4" /> Enviar Encuesta
        </Button>
        <Button onClick={handleRegisterResponse}>
            Registrar Respuesta
        </Button>
      </CardFooter>
    </Card>
  );
}
