
"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { WorkshopCalendar } from "@/components/workshop-calendar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle } from "lucide-react";
import { AppointmentFormDialog } from "@/components/appointment-form-dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*");

      if (error) {
        console.error("Error fetching calendar events:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los eventos del calendario.",
          variant: "destructive",
        });
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    }

    fetchEvents();
  }, []);

  const handleNewAppointment = () => {
    setSelectedEvent(null);
    setIsFormOpen(true);
  };
  
  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);
    if (!error) {
      setEvents(events.filter(e => e.id !== eventId));
      toast({ title: "Cita Eliminada", description: "La cita ha sido eliminada del calendario.", variant: "destructive" });
    } else {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la cita." });
    }
    setIsFormOpen(false);
    setSelectedEvent(null);
  };

  const handleFormSubmit = async (data: any) => {
    if (selectedEvent) {
      const { error } = await supabase.from('calendar_events').update(data).eq('id', selectedEvent.id);
      if (!error) {
        setEvents(events.map(e => e.id === selectedEvent.id ? { ...e, ...data } : e));
        toast({ title: "Cita Actualizada", description: `Cita para ${data.vehicle} actualizada.` });
      } else {
        toast({ variant: "destructive", title: "Error", description: error.message });
      }
    } else {
      const { data: newEvent, error } = await supabase.from('calendar_events').insert(data).select().single();
      if (!error && newEvent) {
        setEvents([...events, newEvent]);
        toast({ title: "Cita Creada", description: `Cita para ${data.vehicle} agendada exitosamente.` });
      } else {
        toast({ variant: "destructive", title: "Error", description: error?.message || "No se pudo crear la cita." });
      }
    }
    setIsFormOpen(false);
    setSelectedEvent(null);
  };


  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <DashboardHeader title="Calendario Digital del Taller">
          <Button disabled variant="secondary">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Cita
          </Button>
        </DashboardHeader>
        <main className="flex-1 p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[calc(100vh-220px)] w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Calendario Digital del Taller">
        <Button onClick={handleNewAppointment} variant="secondary">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Cita
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 overflow-x-auto">
        <WorkshopCalendar events={events} onEventClick={handleSelectEvent} />
      </main>
      <AppointmentFormDialog 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
      />
    </div>
  );
}
