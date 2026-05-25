"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wrench, PaintBucket, Search, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

type Mode = "initial" | "agendar" | "consultar";

const VEHICLE_TYPES = ["Automóvil", "Vehículo Eléctrico", "Camión", "Bus", "Van", "Camioneta"];
const MERCEDES_MODELS = [
  "A 200", "A 250", "C 200", "C 300", "E 300", "S 500", "GLC 200", "GLC 300", "GLE 400", "Sprinter 315", "Sprinter 415", "Sprinter 515", "Vito", "Actros", "Atego"
];
const HOURS = ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

export function BookingForm() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("initial");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [reservationResult, setReservationResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    plate: "",
    vehicleType: "",
    make: "Mercedes-Benz",
    model: "",
    mileage: "",
    serviceType: "",
    date: undefined as Date | undefined,
    time: "",
    rut: "",
    name: "",
    email: "",
    phone: "",
    reservationCode: "", // for consulting and created
  });

  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (mode === "agendar") {
      if (step === 1 && (!formData.plate || !formData.vehicleType || !formData.make || !formData.model)) {
        toast({ title: "Datos incompletos", description: "Por favor, completa los campos requeridos.", variant: "destructive" });
        return;
      }
      if (step === 2 && !formData.serviceType) {
        toast({ title: "Servicio no seleccionado", description: "Por favor, selecciona un servicio.", variant: "destructive" });
        return;
      }
      if (step === 3 && (!formData.date || !formData.time)) {
        toast({ title: "Fecha y hora no seleccionadas", description: "Por favor, selecciona fecha y hora.", variant: "destructive" });
        return;
      }
    }
    setStep(s => s + 1);
  };

  const prevStep = () => {
    if (step === 1) {
      setMode("initial");
    } else {
      setStep(s => s - 1);
    }
  };

  const handleAgendarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase.from('appointments').insert({
      client_name: formData.name,
      client_rut: formData.rut,
      client_email: formData.email,
      client_phone: formData.phone,
      vehicle_plate: formData.plate.toUpperCase(),
      vehicle_make: formData.make,
      vehicle_model: formData.model,
      vehicle_type: formData.vehicleType,
      mileage: parseInt(formData.mileage) || null,
      type: formData.serviceType,
      requested_date: formData.date?.toISOString().split('T')[0],
      requested_time: formData.time,
      reservation_code: generatedCode,
      status: 'Pendiente'
    }).select().single();

    setLoading(false);

    if (error) {
       toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
       toast({ title: "Hora agendada", description: "Tu reserva ha sido creada exitosamente." });
       setFormData(prev => ({ ...prev, reservationCode: generatedCode }));
       setStep(5); // Detalle / Éxito
    }
  };

  const handleConsultarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('reservation_code', formData.reservationCode.toUpperCase())
      .eq('client_rut', formData.rut)
      .single();

    setLoading(false);

    if (error || !data) {
      toast({ variant: "destructive", title: "No encontrado", description: "No se encontró una reserva con esos datos." });
    } else {
      setReservationResult(data);
      setStep(2);
    }
  };

  const renderStepsIndicator = (labels: string[]) => (
    <div className="flex items-center justify-center w-full mb-12">
      {labels.map((label, index) => {
        const isActive = step === index + 1;
        const isPast = step > index + 1;
        return (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors shadow-sm",
                isActive ? "bg-primary text-primary-foreground" : isPast ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/50 border border-border"
              )}>
                {isPast ? <CheckCircle className="w-5 h-5" /> : index + 1}
              </div>
              <span className={cn(
                "text-sm font-medium hidden md:block",
                isActive ? "text-primary" : isPast ? "text-muted-foreground" : "text-muted-foreground/50"
              )}>
                {label}
              </span>
            </div>
            {index < labels.length - 1 && (
              <div className="w-8 md:w-16 h-[2px] bg-border mx-4"></div>
            )}
          </div>
        );
      })}
    </div>
  );

  // --- RENDERS ---

  if (mode === "initial") {
    return (
      <div className="text-center py-6">
        <h2 className="text-3xl font-light text-foreground mb-4">Agenda tu servicio con nosotros</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
          El sistema de agendamiento online está disponible para automóviles y vehículos comerciales en nuestro taller experto.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card p-8 rounded-xl shadow-sm border border-border text-left hover:border-primary/50 transition-colors flex flex-col h-full">
            <h3 className="text-xl font-medium text-foreground mb-4">Agendar Servicio de Taller</h3>
            <p className="text-muted-foreground text-sm mb-8 flex-grow">
              Si necesitas realizar tu mantención o reparación de tu vehículo puedes agendar aquí.
            </p>
            <Button onClick={() => setMode("agendar")} className="w-full sm:w-auto h-12 text-base justify-between bg-primary hover:bg-primary/90 rounded-none group">
              Agendar <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          <div className="bg-card p-8 rounded-xl shadow-sm border border-border text-left hover:border-primary/50 transition-colors flex flex-col h-full">
            <h3 className="text-xl font-medium text-foreground mb-4">Consultar mis reservas</h3>
            <p className="text-muted-foreground text-sm mb-8 flex-grow">
              Si ya agendaste tu atención en taller, puedes consultar con tu código de reserva.
            </p>
            <Button onClick={() => setMode("consultar")} className="w-full sm:w-auto h-12 text-base justify-between bg-primary hover:bg-primary/90 rounded-none group">
              Consultar <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "consultar") {
    return (
      <div className="w-full max-w-4xl mx-auto py-6">
        {renderStepsIndicator(["Datos reserva", "Detalle"])}
        
        {step === 1 && (
          <form onSubmit={handleConsultarSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="text-2xl font-light text-foreground mb-8">Ingresa datos de tu reserva</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Rut</Label>
                  <Input name="rut" value={formData.rut} onChange={handleChange} placeholder="Ej: 12345678-9" required className="h-12 bg-background/50 rounded-none" />
                  <p className="text-[10px] text-muted-foreground">Ingresa tu RUT con guión.</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Patente</Label>
                  <Input name="plate" value={formData.plate} onChange={handleChange} placeholder="Ej: AB1234" required className="h-12 bg-background/50 uppercase rounded-none" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Código de Reserva</Label>
                  <Input name="reservationCode" value={formData.reservationCode} onChange={handleChange} placeholder="Ej: XJ9K2L" required className="h-12 bg-background/50 uppercase rounded-none" />
                  <p className="text-[10px] text-muted-foreground">Ingresa tu código de reserva enviado a tu correo.</p>
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-border flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8 rounded-none border-border hover:bg-muted text-muted-foreground font-medium">Atrás</Button>
              <Button type="submit" className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-none font-medium" disabled={loading}>
                {loading ? "Consultando..." : "Consultar Reserva"}
              </Button>
            </div>
          </form>
        )}

        {step === 2 && reservationResult && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-2xl font-light text-foreground mb-6">Detalle de la Reserva</h3>
            <div className="bg-card border border-border p-8 rounded-none space-y-6">
              <div className="grid grid-cols-2 gap-y-4">
                <div><p className="text-sm text-muted-foreground uppercase text-[10px] font-bold">Estado</p><p className="text-lg font-medium text-primary">{reservationResult.status}</p></div>
                <div><p className="text-sm text-muted-foreground uppercase text-[10px] font-bold">Código</p><p className="text-lg font-mono">{reservationResult.reservation_code}</p></div>
                <div><p className="text-sm text-muted-foreground uppercase text-[10px] font-bold">Vehículo</p><p>{reservationResult.vehicle_make} {reservationResult.vehicle_model} ({reservationResult.vehicle_plate})</p></div>
                <div><p className="text-sm text-muted-foreground uppercase text-[10px] font-bold">Servicio</p><p>{reservationResult.type}</p></div>
                <div><p className="text-sm text-muted-foreground uppercase text-[10px] font-bold">Fecha Solicitada</p><p>{format(new Date(reservationResult.requested_date), 'PPP', { locale: es })} a las {reservationResult.requested_time}</p></div>
              </div>
            </div>
            <div className="pt-8 flex justify-start">
              <Button type="button" variant="outline" onClick={() => setMode("initial")} className="h-12 px-8 rounded-none">Volver al Inicio</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- AGENDAR FLOW ---
  if (mode === "agendar") {
    return (
      <div className="w-full max-w-5xl mx-auto py-6">
        {step < 5 && renderStepsIndicator(["Datos vehículo", "Seleccionar servicio", "Agendamiento", "Detalle"])}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-2xl font-light text-foreground mb-8">Ingresa datos de tu vehículo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Patente</Label>
                <Input name="plate" value={formData.plate} onChange={handleChange} className="h-12 uppercase rounded-none bg-background/50 border-border" placeholder="Ej: AB1234" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Tipo de vehículo</Label>
                <Select value={formData.vehicleType} onValueChange={(val) => handleSelectChange("vehicleType", val)}>
                  <SelectTrigger className="h-12 rounded-none bg-background/50 border-border">
                    <SelectValue placeholder="Seleccione Tipo de vehículo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {VEHICLE_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Marca vehículo</Label>
                <Select value={formData.make} onValueChange={(val) => handleSelectChange("make", val)}>
                  <SelectTrigger className="h-12 rounded-none bg-background/50 border-border">
                    <SelectValue placeholder="Seleccione Marca de vehículo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="Mercedes-Benz">Mercedes-Benz</SelectItem>
                    <SelectItem value="Maxus">Maxus</SelectItem>
                    <SelectItem value="Hyundai">Hyundai</SelectItem>
                    <SelectItem value="Otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Modelo</Label>
                <Select value={formData.model} onValueChange={(val) => handleSelectChange("model", val)}>
                  <SelectTrigger className="h-12 rounded-none bg-background/50 border-border">
                    <SelectValue placeholder="Seleccione Modelo del vehículo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none max-h-64">
                    {MERCEDES_MODELS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Kilometraje Actual</Label>
                <Input name="mileage" type="number" value={formData.mileage} onChange={handleChange} className="h-12 rounded-none bg-background/50 border-border" placeholder="Ej: 45000" />
              </div>
            </div>
            
            <div className="pt-8 border-t border-border flex justify-end gap-4 mt-12">
              <Button variant="outline" onClick={prevStep} className="h-12 px-8 rounded-none border-border hover:bg-muted text-muted-foreground font-medium">Atrás</Button>
              <Button onClick={nextStep} className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-none font-medium">Siguiente</Button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-2xl font-light text-foreground mb-8">Selecciona los servicios que necesitas para tu mantención</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: "Desabollado y Pintura", icon: PaintBucket },
                { id: "Mantención Preventiva", icon: CalendarIcon },
                { id: "Reparación", icon: Wrench },
              ].map(srv => {
                const isSelected = formData.serviceType === srv.id;
                const Icon = srv.icon;
                return (
                  <div 
                    key={srv.id} 
                    onClick={() => handleSelectChange("serviceType", srv.id)}
                    className={cn(
                      "border p-6 cursor-pointer transition-all flex flex-col items-center justify-center gap-4 min-h-[140px] rounded-none shadow-sm relative group",
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className={cn("absolute top-3 left-3 w-4 h-4 rounded-full border flex items-center justify-center transition-colors", isSelected ? "border-primary" : "border-muted-foreground")}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <Icon className={cn("w-8 h-8", isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary/70")} />
                    <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>{srv.id}</span>
                  </div>
                )
              })}
            </div>

            <div className="pt-8 border-t border-border flex justify-end gap-4 mt-12">
              <Button variant="outline" onClick={prevStep} className="h-12 px-8 rounded-none border-border hover:bg-muted text-muted-foreground font-medium">Atrás</Button>
              <Button onClick={nextStep} className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-none font-medium">Siguiente</Button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-8">
              <h3 className="text-2xl font-light text-foreground mb-2">Sugerencias</h3>
              <p className="text-muted-foreground text-sm">Estas son las fechas recomendadas para tu agendamiento, selecciona una de ellas.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
               {/* Left: Calendar Grid */}
               <div className="flex-1">
                  <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                     <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))} className="p-2 hover:bg-muted rounded"><ChevronLeft className="w-5 h-5 text-primary" /></button>
                     <span className="font-semibold capitalize text-lg text-foreground">
                        {format(currentWeekStart, 'MMMM yyyy', { locale: es })}
                     </span>
                     <button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))} className="p-2 hover:bg-muted rounded"><ChevronRight className="w-5 h-5 text-primary" /></button>
                  </div>
                  
                  <div className="grid grid-cols-6 gap-2">
                     {/* Weekdays */}
                     {Array.from({ length: 6 }).map((_, i) => {
                        const dayDate = addDays(currentWeekStart, i);
                        const isPast = dayDate < new Date(new Date().setHours(0,0,0,0));
                        return (
                          <div key={i} className="flex flex-col gap-2">
                            <div className="text-center pb-2">
                              <p className="text-xs font-medium text-foreground capitalize">{format(dayDate, 'EEEE', { locale: es })}</p>
                              <p className="text-sm font-bold text-muted-foreground">{format(dayDate, 'd')}</p>
                            </div>
                            {HOURS.map(hour => {
                               const isSelected = formData.date && isSameDay(formData.date, dayDate) && formData.time === hour;
                               return (
                                 <button
                                   key={hour}
                                   disabled={isPast}
                                   onClick={() => {
                                      setFormData(prev => ({...prev, date: dayDate, time: hour}));
                                   }}
                                   className={cn(
                                     "py-2 text-xs font-medium border rounded-none transition-colors",
                                     isSelected ? "bg-primary text-primary-foreground border-primary" : 
                                     isPast ? "bg-muted text-muted-foreground/30 border-transparent cursor-not-allowed" : 
                                     "bg-card text-primary border-primary/30 hover:border-primary hover:bg-primary/5"
                                   )}
                                 >
                                   {hour}
                                 </button>
                               )
                            })}
                          </div>
                        )
                     })}
                  </div>
               </div>

               {/* Right: Selected Summary Cards (To mimic the image) */}
               <div className="w-full lg:w-[350px] border-l border-border pl-0 lg:pl-8 flex flex-col gap-4">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-2">Tu Selección</h4>
                  {formData.date && formData.time ? (
                     <div className="border border-primary bg-primary/5 p-6 rounded-none text-center shadow-sm relative">
                        <div className="absolute top-3 left-3 w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                           <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <CalendarIcon className="w-8 h-8 text-primary mx-auto mb-4" />
                        <p className="text-primary font-medium mb-1 capitalize">
                           {format(formData.date, 'EEEE d \'de\' MMMM \'del\' yyyy', { locale: es })}
                        </p>
                        <p className="text-foreground text-sm font-bold">Horario {formData.time}</p>
                        <p className="text-muted-foreground text-xs mt-2">Taller LionFix Service</p>
                     </div>
                  ) : (
                     <div className="border border-dashed border-border p-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center min-h-[200px]">
                        <p>Selecciona un bloque en el calendario para continuar.</p>
                     </div>
                  )}
               </div>
            </div>

            <div className="pt-8 border-t border-border flex justify-end gap-4 mt-12">
              <Button variant="outline" onClick={prevStep} className="h-12 px-8 rounded-none border-border hover:bg-muted text-muted-foreground font-medium">Atrás</Button>
              <Button onClick={nextStep} className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-none font-medium">Siguiente</Button>
            </div>
          </div>
        )}

        {/* STEP 4: Detalles Personales */}
        {step === 4 && (
          <form onSubmit={handleAgendarSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-2xl font-light text-foreground mb-8">Ingresa tus datos personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                 <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Nombre Completo</Label>
                 <Input name="name" value={formData.name} onChange={handleChange} required className="h-12 bg-background/50 rounded-none border-border" placeholder="Ej: Juan Pérez" />
               </div>
               <div className="space-y-2">
                 <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">RUT</Label>
                 <Input name="rut" value={formData.rut} onChange={handleChange} required className="h-12 bg-background/50 rounded-none border-border" placeholder="Ej: 12345678-9" />
               </div>
               <div className="space-y-2">
                 <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                 <Input name="email" type="email" value={formData.email} onChange={handleChange} required className="h-12 bg-background/50 rounded-none border-border" placeholder="Ej: juan@empresa.cl" />
               </div>
               <div className="space-y-2">
                 <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Teléfono</Label>
                 <Input name="phone" value={formData.phone} onChange={handleChange} required className="h-12 bg-background/50 rounded-none border-border" placeholder="Ej: +56 9 1234 5678" />
               </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-none mt-8 flex flex-col md:flex-row gap-6 justify-between items-center">
               <div className="text-sm">
                  <p className="text-muted-foreground font-medium mb-1">Resumen:</p>
                  <p className="font-bold text-foreground">{formData.serviceType} para {formData.make} {formData.model}</p>
                  <p className="text-primary font-medium capitalize mt-1">
                     {formData.date && format(formData.date, 'EEEE d \'de\' MMMM, yyyy', { locale: es })} a las {formData.time}
                  </p>
               </div>
            </div>

            <div className="pt-8 border-t border-border flex justify-end gap-4 mt-12">
              <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8 rounded-none border-border hover:bg-muted text-muted-foreground font-medium">Atrás</Button>
              <Button type="submit" className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-none font-medium" disabled={loading}>
                 {loading ? "Procesando..." : "Confirmar Agendamiento"}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 5: Éxito */}
        {step === 5 && (
           <div className="max-w-2xl mx-auto text-center space-y-6 py-12 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-3xl font-light text-foreground">¡Solicitud recibida!</h3>
              <p className="text-muted-foreground text-lg">
                 Hemos registrado tu solicitud para el día <span className="font-semibold text-foreground">{formData.date && format(formData.date, 'dd/MM/yyyy')} a las {formData.time}</span>.
              </p>
              
              <div className="bg-card border border-border p-8 mt-8">
                 <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-2">Tu Código de Reserva</p>
                 <p className="text-4xl font-mono font-bold tracking-widest text-primary">{formData.reservationCode}</p>
                 <p className="text-xs text-muted-foreground mt-4">Guarda este código para consultar el estado de tu agendamiento más adelante.</p>
              </div>

              <div className="pt-8">
                 <Button onClick={() => setMode("initial")} className="h-12 px-8 rounded-none bg-primary hover:bg-primary/90">
                    Volver al Inicio
                 </Button>
              </div>
           </div>
        )}
      </div>
    );
  }

  return null;
}
