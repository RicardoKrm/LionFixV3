"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, CalendarX2 } from "lucide-react";

type BlockedDatesDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BlockedDatesDialog({ isOpen, onOpenChange }: BlockedDatesDialogProps) {
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  const fetchBlockedDates = async () => {
    const { data, error } = await supabase
      .from("blocked_dates")
      .select("*")
      .order("blocked_date", { ascending: true });
    
    if (data) setBlockedDates(data);
  };

  useEffect(() => {
    if (isOpen) {
      fetchBlockedDates();
    }
  }, [isOpen]);

  const handleAddDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    setLoading(true);
    const { error } = await supabase.from("blocked_dates").insert({
      blocked_date: newDate,
      reason: reason || "Taller Lleno / Bloqueado por Admin",
    });

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        toast({ variant: "destructive", title: "Error", description: "Esta fecha ya está bloqueada." });
      } else {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    } else {
      toast({ title: "Fecha bloqueada", description: "El día ha sido cerrado exitosamente." });
      setNewDate("");
      setReason("");
      fetchBlockedDates();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
    if (!error) {
       toast({ title: "Día desbloqueado", description: "La fecha vuelve a estar disponible." });
       fetchBlockedDates();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarX2 className="w-5 h-5 text-destructive" />
            Gestionar Disponibilidad
          </DialogTitle>
          <DialogDescription>
            Bloquea días específicos para que los clientes no puedan agendar citas. Útil cuando el taller está lleno.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddDate} className="space-y-4 my-4 p-4 bg-muted/50 rounded-lg border border-border">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Fecha a bloquear</label>
            <Input 
              type="date" 
              value={newDate} 
              onChange={(e) => setNewDate(e.target.value)} 
              required 
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground">Motivo (Opcional)</label>
            <Input 
              placeholder="Ej: Mucho trabajo, Feriado..." 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Bloquear Día
          </Button>
        </form>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
          <h4 className="text-sm font-semibold border-b pb-2">Días Bloqueados Actualmente</h4>
          {blockedDates.length === 0 ? (
             <p className="text-sm text-muted-foreground italic text-center py-4">No hay días bloqueados.</p>
          ) : (
            blockedDates.map(bd => (
              <div key={bd.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                 <div>
                    <p className="font-medium text-destructive capitalize">
                       {format(parseISO(bd.blocked_date), "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground">{bd.reason}</p>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => handleDelete(bd.id)} className="text-muted-foreground hover:text-foreground">
                    <Trash2 className="w-4 h-4" />
                 </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
