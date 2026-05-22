"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, GripVertical, Search, AlertCircle, Plus, Calendar as CalendarIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard-header';
import { Button } from '@/components/ui/button';

type OTTipo = 'Preventiva' | 'Correctiva' | 'Evaluativa' | 'Preventiva Neumático' | 'Correctiva Neumático' | 'Evaluativa Neumático' | 'Inspección';

interface CalendarOT {
  id: string; 
  eventId?: string; 
  folio: string; 
  patente: string;
  tipo: string;
  actividad: string;
  startDate?: Date; 
  startHour?: number;
  duration?: number;
  estado?: string;
  isOverdue?: boolean;
}

interface MecanicoCalendar {
  id: string;
  nombre: string;
  especialidad: string;
  selected: boolean;
  ots: CalendarOT[];
}

const getTipoColor = (tipo: string) => {
  const lower = tipo?.toLowerCase() || '';
  if (lower.includes('preventiva')) return 'bg-blue-500 hover:bg-blue-600';
  if (lower.includes('correctiva')) return 'bg-red-500 hover:bg-red-600';
  if (lower.includes('evaluativa')) return 'bg-emerald-500 hover:bg-emerald-600';
  if (lower.includes('inspección') || lower.includes('diagnostico')) return 'bg-purple-500 hover:bg-purple-600';
  return 'bg-slate-500 hover:bg-slate-600'; 
};

export default function PizarraProgramacion() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<'Día' | 'Semana' | 'Mes'>('Semana');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedOt, setDraggedOt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const hours = Array.from({length: 11}, (_, i) => i + 8); 

  const [pendingOts, setPendingOts] = useState<CalendarOT[]>([]);
  const [mecanicos, setMecanicos] = useState<MecanicoCalendar[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: mechData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "mechanic");

      const { data: woData } = await supabase
        .from("work_orders")
        .select(`*, vehicles(make, model, license_plate)`)
        .not("status", "in", '("Entregado","Cancelado")');

      const { data: calData } = await supabase
        .from("calendar_events")
        .select(`*`);

      let initialMecanicos: MecanicoCalendar[] = (mechData || []).map(m => ({
        id: m.id,
        nombre: m.name,
        especialidad: 'Mecánico',
        selected: true,
        ots: []
      }));

      let unassigned: CalendarOT[] = [];

      if (woData) {
        const assignedEventMap = new Map();
        calData?.forEach(ev => {
          if (ev.work_order_id) {
            assignedEventMap.set(ev.work_order_id, ev);
          }
        });

        woData.forEach(wo => {
          const calEvent = assignedEventMap.get(wo.id);
          
          const otObj: CalendarOT = {
            id: wo.id,
            eventId: calEvent?.id,
            folio: wo.ot_number || 'S/N',
            patente: wo.vehicles?.license_plate || 'Sin Patente',
            tipo: wo.service_description || 'Mantenimiento',
            actividad: wo.status,
            estado: wo.status,
            duration: Math.ceil(wo.labor_hours) || 2, 
            isOverdue: false 
          };

          if (calEvent && calEvent.technician_id) {
            otObj.startDate = new Date(calEvent.start_time);
            otObj.startHour = otObj.startDate.getHours();
            
            const mec = initialMecanicos.find(m => m.id === calEvent.technician_id);
            if (mec) mec.ots.push(otObj);
          } else {
            unassigned.push(otObj);
          }
        });
      }

      setMecanicos(initialMecanicos);
      setPendingOts(unassigned);

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const toggleMechanic = (id: string) => {
    setMecanicos(mecanicos.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
  };

  const navigateDays = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedOt(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const saveEventToDB = async (ot: CalendarOT, mechanicId: string, startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + (ot.duration || 2));
    
    if (ot.eventId) {
      await supabase.from('calendar_events').update({
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        technician_id: mechanicId
      }).eq('id', ot.eventId);
    } else {
      const { data: inserted } = await supabase.from('calendar_events').insert({
        title: `${ot.folio} - ${ot.tipo}`,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        work_order_id: ot.id,
        technician_id: mechanicId,
        workstation: 1
      }).select().single();
      
      if (inserted) return inserted.id;
    }
    return ot.eventId;
  };

  const removeEventFromDB = async (eventId: string) => {
     await supabase.from('calendar_events').delete().eq('id', eventId);
  }

  const handleDrop = async (e: React.DragEvent, mechanicId: string, targetDate: Date) => {
    e.preventDefault();
    const otId = e.dataTransfer.getData('text/plain');
    if (!otId) return;
    
    const pendingOt = pendingOts.find(ot => ot.id === otId);
    let targetHour = targetDate.getHours();

    if (pendingOt) {
      setPendingOts(pendingOts.filter(ot => ot.id !== otId));
      const newOt = { ...pendingOt, startHour: targetHour, startDate: targetDate };
      
      setMecanicos(mecanicos.map(m => m.id === mechanicId ? {
        ...m, ots: [...m.ots, newOt]
      } : m));
      
      const newEventId = await saveEventToDB(newOt, mechanicId, targetDate);
      if(newEventId) {
         setMecanicos(prev => prev.map(m => m.id === mechanicId ? {
            ...m, ots: m.ots.map(o => o.id === otId ? {...o, eventId: newEventId} : o)
         } : m));
      }
    } else {
       let movedOt: CalendarOT | undefined;
       const newMecanicos = mecanicos.map(m => {
          const found = m.ots.find(ot => ot.id === otId);
          if (found) {
             movedOt = found;
             return { ...m, ots: m.ots.filter(ot => ot.id !== otId) };
          }
          return m;
       });

       if (movedOt) {
          const updatedOt = { ...movedOt, startHour: targetHour, startDate: targetDate };
          setMecanicos(newMecanicos.map(m => m.id === mechanicId ? {
            ...m, ots: [...m.ots, updatedOt]
          } : m));
          await saveEventToDB(updatedOt, mechanicId, targetDate);
       }
    }
    setDraggedOt(null);
  };

  const handleDropToPending = async (e: React.DragEvent) => {
    e.preventDefault();
    const otId = e.dataTransfer.getData('text/plain');
    if (!otId) return;
    
    if (pendingOts.find(ot => ot.id === otId)) return;

    let movedOt: CalendarOT | undefined;
    const newMecanicos = mecanicos.map(m => {
       const found = m.ots.find(ot => ot.id === otId);
       if (found) {
          movedOt = found;
          return { ...m, ots: m.ots.filter(ot => ot.id !== otId) };
       }
       return m;
    });

    if (movedOt) {
       setMecanicos(newMecanicos);
       const updatedOt = { ...movedOt, startHour: undefined, startDate: undefined };
       setPendingOts([updatedOt, ...pendingOts]);
       
       if (movedOt.eventId) {
          await removeEventFromDB(movedOt.eventId);
          setPendingOts(prev => prev.map(o => o.id === otId ? {...o, eventId: undefined} : o));
       }
    }
    setDraggedOt(null);
  };

  const getFormatDate = (date: Date) => {
    if (viewMode === 'Día') {
      const fullDateStr = date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      return fullDateStr.charAt(0).toUpperCase() + fullDateStr.slice(1);
    }
    if (viewMode === 'Semana') {
       const d = new Date(date);
       const day = d.getDay(); 
       const diff = d.getDate() - day + (day === 0 ? -6 : 1);
       const monday = new Date(d.setDate(diff));
       const sunday = new Date(monday);
       sunday.setDate(monday.getDate() + 6);
       
       const startStr = monday.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
       const endStr = sunday.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
       return `${startStr} al ${endStr}`;
    }
    return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  };

  const isSameDay = (d1: Date, d2: Date) => {
     return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  const renderMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startDayOfWeek = firstDay === 0 ? 6 : firstDay - 1; 
    
    const days = [];
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    for(let i=0; i<startDayOfWeek; i++) {
       days.push({ 
           date: new Date(year, month - 1, prevMonthDays - startDayOfWeek + i + 1), 
           isCurrentMonth: false, events: [] 
       });
    }
    
    for(let i=1; i<=daysInMonth; i++) {
       const dayDate = new Date(year, month, i);
       let dailyEvents: {title: string, color: string, isOverdue?: boolean, otId: string}[] = [];
       mecanicos.filter(m => m.selected).forEach(m => {
          m.ots.filter(ot => ot.startDate && isSameDay(ot.startDate, dayDate)).forEach(ot => {
             dailyEvents.push({
               title: `${ot.startHour}:00 ${ot.tipo} ${ot.patente}`,
               color: getTipoColor(ot.tipo),
               isOverdue: ot.isOverdue,
               otId: ot.id
             });
          });
       });
       dailyEvents.sort((a,b) => a.title.localeCompare(b.title));
       days.push({ date: dayDate, isCurrentMonth: true, isToday: isSameDay(dayDate, new Date()), events: dailyEvents });
    }

    const remaining = 42 - days.length; 
    for(let i=1; i<=remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false, events: [] });
    }

    const weekDaysInfo = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
          <div className="min-w-[700px] h-full flex flex-col min-h-full">
            <div className="grid grid-cols-7 border-b border-border shrink-0">
               {weekDaysInfo.map(d => (
                 <div key={d} className="py-2 text-center text-[10px] font-bold text-muted-foreground border-r border-border last:border-r-0 uppercase">
                   {d}
                 </div>
               ))}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-6 auto-rows-[1fr] overflow-hidden">
               {days.map((d, idx) => (
             <div key={idx} 
               onClick={d.isCurrentMonth ? () => {
                 setCurrentDate(d.date);
                 setViewMode('Día');
               } : undefined}
               className={cn(
                 "border-r border-b border-border p-1 flex flex-col transition-colors hover:bg-accent",
                 !d.isCurrentMonth && "bg-muted/30",
                 d.isCurrentMonth && "cursor-pointer"
               )}
               onDragOver={handleDragOver}
               onDrop={d.isCurrentMonth ? (e) => {
                  const targetDate = new Date(d.date);
                  targetDate.setHours(8, 0, 0, 0);
                  const firstMec = mecanicos.find(m => m.selected) || mecanicos[0];
                  if(firstMec) handleDrop(e, firstMec.id, targetDate);
               } : undefined}
             >
               <div className="flex justify-center mb-1">
                 <span 
                   className={cn(
                     "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mt-1 transition-all",
                     d.isToday ? "bg-primary text-primary-foreground" : (d.isCurrentMonth ? "text-foreground hover:bg-muted" : "text-muted-foreground")
                   )}
                 >
                   {d.date.getDate()}
                 </span>
               </div>
               <div className="flex-1 overflow-y-auto space-y-1.5 px-1 pb-1 custom-scrollbar">
                 {d.events.slice(0, 2).map((ev, i) => (
                    <div 
                      key={i} 
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/work-orders/${ev.otId}`); }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ev.otId)}
                      className={cn("text-[10px] px-1.5 py-1 rounded truncate cursor-pointer hover:opacity-90 flex items-center gap-1.5 font-medium shadow-sm transition-opacity",
                         ev.color,
                         ev.isOverdue ? "ring-2 ring-red-500" : "",
                         "text-white"
                      )}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80 shrink-0"></div>
                      <span className="truncate">{ev.title}</span>
                    </div>
                 ))}
                 {d.events.length > 2 && (
                    <div className="text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer pl-1 mt-1">
                      +{d.events.length - 2} más
                    </div>
                 )}
               </div>
             </div>
           ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeekGrid = () => {
     const d = new Date(currentDate);
     const day = d.getDay(); 
     const diff = d.getDate() - day + (day === 0 ? -6 : 1);
     const monday = new Date(d.setDate(diff));
     
     const weekDaysInfo = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
     const weekDates = Array.from({length: 7}, (_, i) => {
        const nd = new Date(monday);
        nd.setDate(monday.getDate() + i);
        return {
           date: nd,
           label: weekDaysInfo[i],
           dayNum: nd.getDate()
        };
     });

     const activeMecanicos = mecanicos.filter(m => m.selected);

     return (
        <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
           <div className="flex border-b border-border">
             <div className="w-16 shrink-0 border-r border-border bg-background z-20"></div>
             {weekDates.map(wd => (
               <div key={wd.label} className="flex-1 min-w-[120px] py-2 text-center border-r border-border last:border-r-0">
                 <div className="text-[10px] font-bold text-muted-foreground uppercase">{wd.label}</div>
                 <div className={cn("text-lg font-normal mb-1", isSameDay(wd.date, new Date()) ? "text-primary font-bold" : "text-foreground")}>
                    {wd.dayNum}
                 </div>
               </div>
             ))}
           </div>
           
           <div className="flex-1 overflow-y-auto overflow-x-auto relative flex custom-scrollbar">
              <div className="w-16 shrink-0 border-r border-border sticky left-0 bg-background z-20">
                 {hours.map(h => (
                   <div key={h} className="h-20 border-b border-border relative bg-background">
                     <span className="absolute -top-2.5 right-2 text-[10px] text-muted-foreground font-medium">{h}:00</span>
                   </div>
                 ))}
              </div>
              {weekDates.map(wd => {
                 return (
                 <div key={wd.label} className="flex-1 min-w-[120px] border-r border-border relative z-10">
                   {hours.map(h => (
                     <div key={h} className="h-20 border-b border-border border-dashed hover:bg-accent transition-colors"
                          onDragOver={handleDragOver}
                          onDrop={(e) => {
                             const dropDate = new Date(wd.date);
                             dropDate.setHours(h, 0, 0, 0);
                             const firstMec = activeMecanicos[0]; 
                             if(firstMec) handleDrop(e, firstMec.id, dropDate);
                          }}
                     >
                     </div>
                   ))}

                   {activeMecanicos.map(m => 
                      m.ots.filter(ot => ot.startDate && isSameDay(ot.startDate, wd.date)).map(ot => {
                         const top = (ot.startHour! - 8) * 80;
                         const height = (ot.duration || 1) * 80;
                         return (
                           <div key={ot.id} onClick={() => router.push(`/dashboard/work-orders/${ot.id}`)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, ot.id)}
                                className={cn("absolute left-1 right-1 flex flex-col rounded p-1.5 text-white shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all hover:z-50", 
                                  getTipoColor(ot.tipo)
                                )}
                                style={{ top: `${top + 1}px`, height: `${height - 2}px` }}>
                              <div className="text-[9px] font-bold opacity-90 truncate flex justify-between gap-1 items-center">
                                 <span>{ot.folio}</span>
                              </div>
                              <div className="text-[9px] leading-tight truncate mt-0.5 font-medium">{m.nombre}</div>
                              <div className="mt-auto flex flex-col gap-0.5">
                                 <div className="text-[9px] truncate opacity-90 flex justify-between items-center gap-1 w-full">
                                    <span className="font-bold">{ot.patente}</span>
                                 </div>
                              </div>
                           </div>
                         )
                      })
                   )}
                 </div>
                 )
              })}
           </div>
        </div>
     );
  };

  const renderDayView = () => {
     const activeMecanicos = mecanicos.filter(m => m.selected);
     return (
        <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
           <div className="flex border-b border-border">
             <div className="w-16 shrink-0 border-r border-border bg-background z-20"></div>
             {activeMecanicos.map(m => (
               <div key={m.id} className="flex-1 min-w-[150px] py-3 text-center border-r border-border last:border-r-0">
                 <div className="font-semibold text-foreground text-sm truncate px-2">{m.nombre}</div>
                 <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{m.especialidad}</div>
               </div>
             ))}
             {activeMecanicos.length === 0 && (
                <div className="flex-1 py-4 text-center text-muted-foreground text-sm">Seleccione mecánicos en el panel izquierdo.</div>
             )}
           </div>
           
           <div className="flex-1 overflow-y-auto overflow-x-auto relative flex custom-scrollbar">
              <div className="w-16 shrink-0 border-r border-border sticky left-0 bg-background z-20">
                 {hours.map(h => (
                   <div key={h} className="h-20 border-b border-border relative bg-background">
                     <span className="absolute -top-2.5 right-2 text-[10px] text-muted-foreground font-medium">{h}:00</span>
                   </div>
                 ))}
              </div>
              {activeMecanicos.map(m => (
                 <div key={m.id} className="flex-1 min-w-[150px] border-r border-border relative z-10">
                   {hours.map(h => (
                     <div key={h} className="h-20 border-b border-border border-dashed hover:bg-accent transition-colors"
                          onDragOver={handleDragOver}
                          onDrop={(e) => {
                             const dropDate = new Date(currentDate);
                             dropDate.setHours(h, 0, 0, 0);
                             handleDrop(e, m.id, dropDate);
                          }}>
                     </div>
                   ))}

                   {m.ots.filter(ot => ot.startDate && isSameDay(ot.startDate, currentDate)).map(ot => {
                      const top = (ot.startHour! - 8) * 80;
                      const height = (ot.duration || 1) * 80;
                      return (
                        <div key={ot.id} onClick={() => router.push(`/dashboard/work-orders/${ot.id}`)}
                             draggable
                             onDragStart={(e) => handleDragStart(e, ot.id)}
                             className={cn("absolute left-1 right-1 rounded-lg p-2 text-white shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all flex flex-col", 
                               getTipoColor(ot.tipo),
                               ot.isOverdue && "ring-2 ring-red-500 border-2 border-red-500 animate-pulse"
                             )}
                             style={{ top: `${top + 2}px`, height: `${height - 4}px` }}>
                           <div className="text-[10px] font-bold opacity-90 leading-tight truncate flex justify-between">
                              <span>{ot.folio}</span>
                           </div>
                           <div className="font-semibold text-xs leading-tight mt-0.5 truncate">{ot.tipo}</div>
                           <div className="text-[10px] leading-tight mt-0.5 truncate">{ot.actividad}</div>
                           
                           <div className="mt-auto pt-1 text-[10px] font-medium opacity-90 flex flex-col gap-1 w-full">
                              <div className="flex items-center gap-1 truncate justify-between w-full">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>{ot.startHour}:00 - {ot.startHour! + (ot.duration || 1)}:00</span>
                                </div>
                                <span className="font-bold">{ot.patente}</span>
                              </div>
                           </div>
                        </div>
                      )
                   })}
                 </div>
              ))}
           </div>
        </div>
     );
  };

  if(loading) return <div className="p-6">Cargando calendario...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] font-sans text-foreground bg-background">
      <DashboardHeader title="Calendario Digital del Taller" />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col shrink-0 overflow-y-auto custom-scrollbar max-h-[35vh] md:max-h-none">
           
           <div className="p-4 space-y-6">
              
              <Button 
                 onClick={() => router.push('/dashboard/work-orders/new')} 
                 className="w-full justify-start rounded-xl font-semibold shadow-sm"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear OT
              </Button>

              {/* Mini Calendar Navigation */}
              <div className="px-1">
                 <div className="flex justify-between items-center mb-3">
                   <span className="text-sm font-bold text-foreground capitalize">{getFormatDate(currentDate)}</span>
                   <div className="flex gap-1">
                     <button onClick={() => navigateDays(-30)} className="text-muted-foreground hover:bg-muted rounded p-1"><ChevronLeft className="w-4 h-4" /></button>
                     <button onClick={() => navigateDays(30)} className="text-muted-foreground hover:bg-muted rounded p-1"><ChevronRight className="w-4 h-4" /></button>
                   </div>
                 </div>
                 <div className="grid grid-cols-7 text-center text-[10px] font-medium text-muted-foreground mb-2">
                   <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
                 </div>
                 <div className="grid grid-cols-7 text-center text-xs gap-y-1">
                   {[...Array(4)].map((_,i) => <span key={`e-${i}`} className="text-muted-foreground/30 py-1">{27+i}</span>)}
                   {[...Array(31)].map((_,i) => {
                      const d = i + 1;
                      const isSelected = d === currentDate.getDate();
                      return (
                        <span 
                          key={`d-${i}`} 
                          onClick={() => {
                            const newDate = new Date(currentDate);
                            newDate.setDate(d);
                            setCurrentDate(newDate);
                            setViewMode('Día');
                          }}
                          className={cn("w-6 h-6 flex items-center justify-center rounded-full mx-auto cursor-pointer transition-colors", 
                             isSelected ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted text-foreground"
                          )}
                        >
                          {d}
                        </span>
                      );
                   })}
                 </div>
              </div>

              {/* Pending OTs (Drag and Drop List) */}
              <div
                 onDragOver={handleDragOver}
                 onDrop={handleDropToPending}
                 className={cn("transition-colors rounded-lg", draggedOt && !pendingOts.find(ot => ot.id === draggedOt) ? "bg-accent/50 outline-dashed outline-2 outline-muted-foreground/50 p-1" : "")}
              >
                 <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-1 flex items-center justify-between">
                   OTs Sin Asignar
                   <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full text-[10px]">{pendingOts.length}</span>
                 </h3>
                 <div className="space-y-2">
                   {pendingOts.map(ot => (
                      <div key={ot.id} draggable onDragStart={(e) => handleDragStart(e, ot.id)}
                           className="bg-background border border-border p-2.5 rounded-lg text-xs shadow-sm cursor-grab active:cursor-grabbing hover:border-primary transition-colors group">
                         <div className="font-bold text-foreground flex justify-between items-center mb-1 text-[11px]">
                           <span className="bg-muted px-1.5 py-0.5 rounded">{ot.folio}</span>
                           {ot.estado && <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider truncate max-w-[80px]">{ot.estado}</span>}
                           <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                         </div>
                         <div className="font-semibold text-foreground truncate">{ot.tipo}</div>
                         <div className="text-muted-foreground mt-0.5 font-bold">{ot.patente}</div>
                      </div>
                   ))}
                   {pendingOts.length === 0 && (
                      <div className="text-xs text-center text-muted-foreground py-4 border border-dashed border-border rounded-lg mx-1">
                         Todo asignado
                      </div>
                   )}
                 </div>
              </div>

              {/* Mechanics Filter */}
              <div className="pb-4">
                 <h3 className="text-xs font-semibold text-muted-foreground mt-2 mb-3 px-1">
                   Mis Mecánicos
                 </h3>
                 <div className="space-y-1">
                   {mecanicos.map(m => (
                      <label key={m.id} className="flex items-center gap-3 cursor-pointer group hover:bg-muted px-1 py-1.5 rounded-md">
                         <div className={cn("w-4 h-4 rounded appearance-none border flex items-center justify-center transition-colors", 
                            m.selected ? "bg-primary border-transparent text-primary-foreground" : "border-border bg-transparent group-hover:border-muted-foreground"
                         )}>
                           {m.selected && <Check className="w-3 h-3" />}
                         </div>
                         <input type="checkbox" className="hidden" checked={m.selected} onChange={() => toggleMechanic(m.id)} />
                         <span className="text-sm text-foreground group-hover:text-foreground truncate flex-1">{m.nombre}</span>
                      </label>
                   ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
           
           {/* Top Header Bar */}
           <div className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card shrink-0">
              <div className="flex items-center gap-4 lg:gap-6">
                 <div className="flex items-center gap-4">
                   <button onClick={() => { setCurrentDate(new Date()); setViewMode('Día'); }} className="text-sm font-medium px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors shadow-sm">
                     Hoy
                   </button>
                   <div className="flex gap-1">
                     <button onClick={() => navigateDays(viewMode === 'Mes' ? -30 : viewMode === 'Semana' ? -7 : -1)} className="p-1.5 hover:bg-muted rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
                     <button onClick={() => navigateDays(viewMode === 'Mes' ? 30 : viewMode === 'Semana' ? 7 : 1)} className="p-1.5 hover:bg-muted rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-muted-foreground" /></button>
                   </div>
                   <h2 className="text-xl lg:text-2xl font-normal text-foreground min-w-[140px] capitalize">
                     {getFormatDate(currentDate)}
                   </h2>
                 </div>
              </div>

              <div className="flex items-center gap-4">                 
                 <select 
                    value={viewMode} 
                    onChange={(e) => setViewMode(e.target.value as any)}
                    className="bg-background border border-border text-foreground text-sm font-medium rounded-md px-3 py-2 hover:bg-accent transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  >
                   <option value="Día">Día</option>
                   <option value="Semana">Semana</option>
                   <option value="Mes">Mes</option>
                 </select>
              </div>
           </div>

           {/* Calendar Views */}
           <div className="flex-1 overflow-hidden flex flex-col bg-background/50">
              {viewMode === 'Mes' && renderMonthGrid()}
              {viewMode === 'Día' && renderDayView()}
              {viewMode === 'Semana' && renderWeekGrid()}
           </div>

        </div>
      </div>
    </div>
  );
}
