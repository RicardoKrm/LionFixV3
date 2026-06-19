"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { format, parseISO, differenceInMinutes, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Calculator, Fingerprint, Clock, Users, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EmployeeMap = {
  id: string;
  profile_id: string | null;
  device_user_id: string;
  name_override: string | null;
  base_salary: number;
  work_hours_per_day: number;
  profiles?: { name: string } | null;
};

type Log = {
  id: string;
  device_user_id: string;
  timestamp: string;
  punch_type: string;
};

export default function AttendancePage() {
  const [employees, setEmployees] = useState<EmployeeMap[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [month]);

  async function fetchData() {
    setLoading(true);
    try {
      // Traer empleados
      const { data: empData } = await supabase
        .from('employee_device_map')
        .select(`*, profiles(name)`)
        .order('device_user_id');
      
      if (empData) setEmployees(empData);

      // Traer logs del mes
      const start = startOfMonth(month).toISOString();
      const end = endOfMonth(month).toISOString();

      const { data: logData } = await supabase
        .from('attendance_logs')
        .select('*')
        .gte('timestamp', start)
        .lte('timestamp', end)
        .order('timestamp', { ascending: false });

      if (logData) setLogs(logData);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Fallo al cargar datos", variant: "destructive" });
    }
    setLoading(false);
  }

  // Actualizar salario o nombre
  const handleUpdateEmployee = async (id: string, field: string, value: any) => {
    const { error } = await supabase.from('employee_device_map').update({ [field]: value }).eq('id', id);
    if (!error) {
       setEmployees(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
       toast({ title: "Actualizado", description: "Se ha guardado el cambio" });
    }
  };

  // Calcular horas trabajadas
  const calculateStats = (deviceUserId: string) => {
     const empLogs = logs.filter(l => l.device_user_id === deviceUserId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
     
     let totalMinutes = 0;
     let daysWorked = new Set<string>();
     let currentIn: Date | null = null;

     empLogs.forEach(log => {
        const date = new Date(log.timestamp);
        daysWorked.add(date.toISOString().split('T')[0]);

        // Si el huellero no manda IN/OUT y todo es UNKNOWN, asumimos que el 1er toque es entrada, 2do es salida.
        if (log.punch_type === 'IN' || (!currentIn && log.punch_type === 'UNKNOWN')) {
           currentIn = date;
        } else if (log.punch_type === 'OUT' || (currentIn && log.punch_type === 'UNKNOWN')) {
           if (currentIn) {
               // Si son del mismo día
               if (currentIn.getDate() === date.getDate()) {
                  totalMinutes += differenceInMinutes(date, currentIn);
               }
               currentIn = null; // reset
           }
        }
     });

     return {
        hours: (totalMinutes / 60).toFixed(1),
        days: daysWorked.size
     };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Control de Asistencia y Nómina">
         <div className="flex gap-2">
            <Input type="month" value={format(month, "yyyy-MM")} onChange={(e) => setMonth(new Date(e.target.value))} className="w-40 bg-card" />
            <Button onClick={fetchData} variant="outline" size="icon"><Clock className="w-4 h-4" /></Button>
         </div>
      </DashboardHeader>

      <main className="flex-1 p-6 overflow-y-auto space-y-6">
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* PANEL EMPLEADOS Y SUELDOS */}
             <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Empleados Vinculados</CardTitle>
                    <CardDescription>Mapeo entre el ID del huellero y el empleado real.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    {loading ? <p>Cargando...</p> : employees.length === 0 ? <p className="text-sm text-muted-foreground">Nadie ha puesto la huella aún.</p> : null}
                    
                    {employees.map(emp => {
                       const stats = calculateStats(emp.device_user_id);
                       // Cálculo rápido de sueldo: Si trabaja ~180h al mes
                       const hourlyRate = emp.base_salary / 180;
                       const salaryCalc = (parseFloat(stats.hours) * hourlyRate).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

                       return (
                         <div key={emp.id} className="p-4 border border-border rounded-lg bg-card/50 space-y-3">
                             <div className="flex justify-between items-center border-b pb-2">
                                <div className="flex items-center gap-2">
                                   <div className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold">
                                      {emp.device_user_id}
                                   </div>
                                   <Input 
                                      value={emp.name_override || emp.profiles?.name || ''}
                                      onChange={(e) => handleUpdateEmployee(emp.id, 'name_override', e.target.value)}
                                      className="h-8 text-sm font-semibold border-transparent bg-transparent hover:border-input focus:border-input"
                                      placeholder="Nombre del Empleado..."
                                   />
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                   <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Días Trabajados</p>
                                   <p className="font-semibold">{stats.days} días</p>
                                </div>
                                <div>
                                   <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Horas Totales</p>
                                   <p className="font-semibold text-primary">{stats.hours} hrs</p>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4 items-end bg-accent/30 p-2 rounded-md">
                                <div>
                                   <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Sueldo Base Mensual</p>
                                   <Input 
                                      type="number"
                                      value={emp.base_salary || ''}
                                      onChange={(e) => handleUpdateEmployee(emp.id, 'base_salary', parseFloat(e.target.value) || 0)}
                                      className="h-8 text-xs font-mono"
                                      placeholder="$ 0"
                                   />
                                </div>
                                <div className="text-right">
                                   <p className="text-muted-foreground text-xs uppercase font-bold mb-1">Cálculo Proporcional</p>
                                   <p className="font-bold text-emerald-500 font-mono text-lg">{salaryCalc}</p>
                                </div>
                             </div>
                         </div>
                       )
                    })}
                 </CardContent>
             </Card>

             {/* REGISTRO EN VIVO */}
             <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Fingerprint className="w-5 h-5 text-primary" /> Registro de Marcadas (Logs)</CardTitle>
                    <CardDescription>Todas las entradas y salidas registradas por el ZK TX626.</CardDescription>
                 </CardHeader>
                 <CardContent>
                     <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {logs.length === 0 && !loading && <p className="text-sm text-muted-foreground text-center py-10">No hay registros este mes.</p>}
                        
                        {logs.map(log => {
                           const emp = employees.find(e => e.device_user_id === log.device_user_id);
                           const name = emp?.name_override || emp?.profiles?.name || `Usuario ID: ${log.device_user_id}`;
                           const dateObj = parseISO(log.timestamp);

                           return (
                             <div key={log.id} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-muted/50 rounded-lg">
                                <div>
                                   <p className="font-semibold text-sm">{name}</p>
                                   <p className="text-xs text-muted-foreground">{format(dateObj, "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                   <span className="font-mono text-sm font-bold bg-background px-2 py-1 border rounded shadow-sm">
                                      {format(dateObj, "HH:mm:ss")}
                                   </span>
                                   <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                                      log.punch_type === 'IN' ? 'bg-blue-500/20 text-blue-500' :
                                      log.punch_type === 'OUT' ? 'bg-orange-500/20 text-orange-500' :
                                      'bg-gray-500/20 text-gray-400'
                                   }`}>
                                      {log.punch_type === 'IN' ? 'ENTRADA' : log.punch_type === 'OUT' ? 'SALIDA' : 'MARCADA'}
                                   </span>
                                </div>
                             </div>
                           )
                        })}
                     </div>
                 </CardContent>
             </Card>
         </div>

      </main>
    </div>
  );
}
