"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function IsoSurveyModal({
  workOrder,
  onClose,
  onCompleted
}: {
  workOrder: any,
  onClose: () => void,
  onCompleted: () => void
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ variant: "destructive", title: "Atención", description: "Por favor seleccione una calificación." });
      return;
    }
    
    setSubmitting(true);
    try {
      // 1. Guardar encuesta en OT
      const { error: woError } = await supabase
        .from("work_orders")
        .update({
          satisfaction_rating: rating,
          satisfaction_comment: comment
        })
        .eq("id", workOrder.id);
        
      if (woError) throw woError;

      // 2. Registrar en ISO logs
      await supabase.from("iso_logs").insert({
        event_type: "Encuesta Satisfacción Cliente",
        description: `El cliente ha evaluado la OT ${workOrder.ot_number} con ${rating} estrellas. Comentario: ${comment || 'Sin comentarios.'}`,
        reference_id: workOrder.id,
        reference_table: "work_orders",
        clausula_iso: "9.1.2 Satisfacción del cliente"
      });

      toast({ title: "Gracias por su evaluación", description: "Su opinión nos ayuda a mejorar (ISO 9001)." });
      onCompleted();
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Encuesta de Satisfacción</DialogTitle>
          <DialogDescription>
            Ayúdenos a mejorar nuestro servicio evaluando su experiencia con la orden <strong>{workOrder?.ot_number}</strong> ({workOrder?.vehicles?.make} {workOrder?.vehicles?.model}).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <Label>¿Cómo califica el servicio recibido?</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      (hoverRating || rating) >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground opacity-30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {rating === 1 && "Muy insatisfecho"}
              {rating === 2 && "Insatisfecho"}
              {rating === 3 && "Regular"}
              {rating === 4 && "Satisfecho"}
              {rating === 5 && "Muy Satisfecho"}
            </span>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="comments">Comentarios (Opcional)</Label>
            <Textarea
              id="comments"
              placeholder="Cuéntenos más sobre su experiencia..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Más tarde</Button>
          <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
            {submitting ? "Enviando..." : "Enviar Evaluación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
