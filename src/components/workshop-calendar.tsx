
"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';

const WORKSTATIONS = [1, 2, 3];
const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => `${i + 8}:00`); // 8:00 to 18:00

type WorkshopCalendarProps = {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
};


export function WorkshopCalendar({ events, onEventClick }: WorkshopCalendarProps) {
  const eventsByWorkstation = useMemo(() => {
    const grouped = new Map<number, typeof events>();
    events.forEach(event => {
      if (!grouped.has(event.workstation)) {
        grouped.set(event.workstation, []);
      }
      grouped.get(event.workstation)!.push(event);
    });
    return grouped;
  }, [events]);

  const getEventPositionAndDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    const endHour = endDate.getHours() + endDate.getMinutes() / 60;
    const top = (startHour - 8) * 4; // 4rem per hour (h-16)
    const height = (endHour - startHour) * 4;
    return { top: `${top}rem`, height: `${height}rem` };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agenda del Taller</CardTitle>
        <CardDescription>Vista de la planificación diaria por puesto de trabajo. Haga clic en una cita para editarla.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative grid grid-cols-[auto_repeat(3,1fr)] gap-x-4">
          {/* Time Gutter */}
          <div className="relative -top-4">
            {TIME_SLOTS.map(time => (
              <div key={time} className="h-16 flex items-start -mt-3">
                <span className="text-xs text-muted-foreground">{time}</span>
              </div>
            ))}
          </div>

          {/* Workstation Columns */}
          {WORKSTATIONS.map(ws => (
            <div key={ws} className="relative border-l border-dashed border-border/50">
              <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm py-2 text-center font-semibold text-foreground border-b -mt-6 mb-2">
                Puesto {ws}
              </div>
              <div className="relative h-full">
                {/* Grid Lines */}
                {TIME_SLOTS.slice(1).map(time => (
                  <div key={`${ws}-${time}`} className="h-16 border-t border-dashed border-border/50"></div>
                ))}
                
                {/* Events */}
                {eventsByWorkstation.get(ws)?.map(event => {
                  const { top, height } = getEventPositionAndDuration(event.start, event.end);
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute left-1 right-1 p-2 rounded-lg text-xs flex flex-col overflow-hidden cursor-pointer shadow-md transition-all hover:ring-2 hover:ring-ring",
                        "bg-accent/90 text-accent-foreground"
                      )}
                      style={{ top, height }}
                      title={`${event.title} - ${event.vehicle}`}
                      onClick={() => onEventClick(event)}
                    >
                      <p className="font-bold truncate">{event.title}</p>
                      <p className="truncate font-mono">{event.vehicle}</p>
                      <div className="mt-auto">
                        <Badge variant="secondary" className="text-xs bg-background/20 border-none px-1.5 py-0.5 font-normal">
                            {event.technician}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
