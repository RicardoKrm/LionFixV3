"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Square, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type WorkOrderTimerProps = {
  workOrderId: string;
  initialHours: number;
};

export function WorkOrderTimer({ workOrderId, initialHours }: WorkOrderTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [totalAccumulated, setTotalAccumulated] = useState(initialHours * 3600);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else if (!isActive && secondsElapsed !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsElapsed]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const stopTimerAndSave = async () => {
    if (!isActive && secondsElapsed === 0) return;
    
    setIsActive(false);
    
    const newTotalSeconds = totalAccumulated + secondsElapsed;
    const newTotalHours = parseFloat((newTotalSeconds / 3600).toFixed(2));
    
    setTotalAccumulated(newTotalSeconds);
    setSecondsElapsed(0);

    const { error } = await supabase
      .from("work_orders")
      .update({ labor_hours: newTotalHours })
      .eq("id", workOrderId);

    if (error) {
      toast({ title: "Error", description: "No se pudo guardar el tiempo.", variant: "destructive" });
    } else {
      toast({ title: "Tiempo Registrado", description: `Se han guardado ${newTotalHours} horas totales.` });
    }
  };

  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = Math.floor(totalSecs % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-accent/30 border-accent/50 shadow-sm mb-6">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Tiempo Invertido</p>
            <p className="text-xs text-muted-foreground">Sesión actual: {formatTime(secondsElapsed)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-center">
          <div className="font-mono text-2xl font-bold tracking-wider text-primary">
            {formatTime(totalAccumulated + secondsElapsed)}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={isActive ? "outline" : "default"} 
              size="icon" 
              onClick={toggleTimer}
              className={isActive ? "border-amber-500 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500" : ""}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button 
              variant="destructive" 
              size="icon" 
              onClick={stopTimerAndSave}
              disabled={secondsElapsed === 0}
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
