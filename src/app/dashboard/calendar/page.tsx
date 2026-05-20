
"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { WorkshopCalendar } from "@/components/workshop-calendar";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AppointmentFormDialog } from "@/components/appointment-form-dialog";
import { calendarEvents as initialEvents } from "@/lib/data";
import type { CalendarEvent } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  const handleNewAppointment = () => {
    setSelectedEvent(null);
    setIsFormOpen(true);
  };
  
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
     setEvents(events.filter(e => e.id !== eventId));
     toast({
        title: "Cita Eliminada",
        description: "La cita ha sido eliminada del calendario.",
        variant: "destructive"
     });
     setIsFormOpen(false);
     setSelectedEvent(null);
  }

  const handleFormSubmit = (data: Omit<CalendarEvent, 'id'>) => {
    if (selectedEvent) {
        // Edit existing event
        const updatedEvent = { ...selectedEvent, ...data };
        setEvents(events.map(e => e.id === selectedEvent.id ? updatedEvent : e));
        toast({
            title: "Cita Actualizada",
            description: `Se ha actualizado la cita para el vehículo ${data.vehicle}.`,
        });

    } else {
       // Create new event
       const newEvent: CalendarEvent = {
        id: `E${(events.length + 1).toString().padStart(3, '0')}`,
        ...data,
       };
       setEvents([...events, newEvent]);
       toast({
           title: "Cita Creada",
           description: `Se ha agendado la cita para el vehículo ${data.vehicle}.`,
       });
    }

    setIsFormOpen(false);
    setSelectedEvent(null);
  };

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
