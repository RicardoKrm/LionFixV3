
"use client";

import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileText, Search, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ChecklistDialog } from "@/components/checklist-dialog";
import type { Checklist } from "@/types";

const initialChecklists: Checklist[] = [
  { id: "CHK-001", type: "Recepción", vehiclePlate: "ABCD-12", date: "2024-07-28", completed: true, notes: "Cliente deja cargador de teléfono.", images: [], checkedItems: { "Luces Delanteras": true, "Nivel de Combustible": true } },
  { id: "CHK-002", type: "Entrega", vehiclePlate: "EFGH-34", date: "2024-07-29", completed: true, notes: "Vehículo se entrega lavado.", images: [], checkedItems: { "Carrocería (Rayones/Abolladuras)": true } },
  { id: "CHK-003", type: "Recepción", vehiclePlate: "IJKL-56", date: "2024-07-30", completed: false, notes: "Revisar rayón en puerta trasera derecha.", images: [], checkedItems: {} },
  { id: "CHK-004", type: "Recepción", vehiclePlate: "QRST-90", date: "2024-07-31", completed: false, notes: "", images: [], checkedItems: {} },
];


export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState(initialChecklists);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleNew = () => {
    setSelectedChecklist(null);
    setIsDialogOpen(true);
  }

  const handleEdit = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setIsDialogOpen(true);
  }

  const handleSave = (data: Checklist) => {
    if (selectedChecklist && data.id) {
        setChecklists(checklists.map(c => c.id === data.id ? data : c));
    } else {
        const newChecklist = { ...data, id: `CHK-${(checklists.length + 1).toString().padStart(3, '0')}`};
        setChecklists([newChecklist, ...checklists]);
    }
    setIsDialogOpen(false);
  }

  const filteredChecklists = useMemo(() => {
    return checklists
      .filter(c => {
        // Search term filter
        return c.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .filter(c => {
        // Status filter
        if (statusFilter === "todos") return true;
        if (statusFilter === "completado") return c.completed;
        if (statusFilter === "pendiente") return !c.completed;
        return true;
      })
      .filter(c => {
        // Date range filter
        if (!dateRange || (!dateRange.from && !dateRange.to)) return true;
        const checklistDate = new Date(c.date);
        if (dateRange.from && checklistDate < dateRange.from) return false;
        if (dateRange.to && checklistDate > dateRange.to) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [checklists, searchTerm, statusFilter, dateRange]);


  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Checklists de Vehículos">
          <Button onClick={handleNew} variant="secondary">
            <PlusCircle />
            Nuevo Checklist
          </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
         {/* Filter Section */}
        <Card>
            <CardHeader>
                <CardTitle>Filtros de Búsqueda</CardTitle>
                <CardDescription>Utilice los filtros para encontrar checklists específicos.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Input
                            placeholder="Buscar por patente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                            startIcon={Search}
                        />
                    </div>
                    <div className="space-y-2">
                         <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos los Estados</SelectItem>
                                <SelectItem value="completado">Completado</SelectItem>
                                <SelectItem value="pendiente">Pendiente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className="w-full justify-start text-left font-normal"
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                    </>
                                    ) : (
                                    format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Seleccionar rango de fechas</span>
                                )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredChecklists.map((checklist) => (
                <Card key={checklist.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2 text-accent">
                                <FileText className="h-5 w-5"/> {checklist.id}
                            </CardTitle>
                             <Badge variant={checklist.completed ? "default" : "secondary"}>
                                {checklist.completed ? "Completado" : "Pendiente"}
                            </Badge>
                        </div>
                        <CardDescription>{checklist.type} - {new Date(checklist.date).toLocaleDateString()}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="font-mono text-xl uppercase tracking-wider bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-center">
                            {checklist.vehiclePlate}
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button variant="outline" className="w-full" onClick={() => handleEdit(checklist)}>
                            Ver / Editar <ArrowRight className="ml-2"/>
                         </Button>
                    </CardFooter>
                </Card>
            ))}
             {filteredChecklists.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-10">
                    No se encontraron checklists que coincidan con los filtros.
                </div>
            )}
        </div>

      </main>
      <ChecklistDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        checklist={selectedChecklist}
        onSave={handleSave}
       />
    </div>
  );
}
