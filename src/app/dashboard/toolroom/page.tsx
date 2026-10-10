"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wrench,
  PlusCircle,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Trash2,
  ClipboardCheck,
  PackagePlus,
  Clock,
  Award,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/export-excel";

type ToolroomTool = {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  location: string;
  status: "Disponible" | "En Uso" | "En Certificación" | "Para Reposición";
  condition: "Óptima" | "Desgaste Leve" | "Dañada";
  assignedToName?: string | null;
  workOrderFolio?: string | null;
  lastCheckoutAt?: string | null;
  lastCheckinAt?: string | null;
  requiresCert: boolean;
  certStatus: "Vigente" | "Próximo a Vencer" | "Vencido" | "No Requiere";
  certNumber?: string | null;
  certLab?: string | null;
  certIssuedAt?: string | null;
  certExpiresAt?: string | null;
  cost: number;
  supplier?: string | null;
  notes?: string | null;
};

type ToolroomMovement = {
  id: string;
  toolId: string;
  toolCode: string;
  toolName: string;
  type: "SALIDA" | "ENTRADA_RECEPCION" | "CERTIFICACION" | "REPOSICION";
  mechanicName: string;
  workOrderFolio?: string | null;
  conditionOnReturn?: string | null;
  notes?: string | null;
  timestamp: string;
};

type ToolroomReplacement = {
  id: string;
  toolId?: string | null;
  toolCode: string;
  toolName: string;
  reason: string;
  priority: "Urgente" | "Alta" | "Normal";
  status: "Pendiente de Compra" | "Orden Enviada a Proveedor" | "Repuesta en Pañol";
  supplier: string;
  estimatedCost: number;
  requestedBy: string;
  requestedAt: string;
  resolvedAt?: string | null;
  notes?: string | null;
};

export default function ToolroomPage() {
  const { toast } = useToast();
  const [tools, setTools] = useState<ToolroomTool[]>([]);
  const [movements, setMovements] = useState<ToolroomMovement[]>([]);
  const [replacements, setReplacements] = useState<ToolroomReplacement[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal: Crear Nueva Herramienta
  const [isNewToolOpen, setIsNewToolOpen] = useState(false);
  const [newToolForm, setNewToolForm] = useState({
    code: "",
    name: "",
    brand: "",
    category: "Precisión y Torque",
    location: "Gabinete Pañol A-1",
    cost: 150000,
    supplier: "",
    requiresCert: true,
    certNumber: "",
    certLab: "LabMet Metrología Chile",
    certExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    notes: "",
  });

  // Modal: Registrar Salida (Entrega a Mecánico)
  const [checkoutTool, setCheckoutTool] = useState<ToolroomTool | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({
    mechanicName: "",
    workOrderFolio: "SIN_OT",
    notes: "",
  });

  // Modal: Registrar Entrada / Recepción en Pañol
  const [checkinTool, setCheckinTool] = useState<ToolroomTool | null>(null);
  const [checkinForm, setCheckinForm] = useState({
    conditionOnReturn: "Óptima",
    notes: "Recepcionada limpia, completa y verificada en pañol.",
  });

  // Modal: Emitir / Renovar Certificado ISO
  const [certTool, setCertTool] = useState<ToolroomTool | null>(null);
  const [certForm, setCertForm] = useState({
    certNumber: "",
    certLab: "LabMet Metrología Chile",
    certIssuedAt: new Date().toISOString().split("T")[0],
    certExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    certStatus: "Vigente",
    notes: "Calibración conforme a norma ISO 9001 (Cláusula 7.1.5).",
  });

  // Modal: Ver / Imprimir Certificado Oficial
  const [previewCertTool, setPreviewCertTool] = useState<ToolroomTool | null>(null);

  // Modal: Solicitar Reposición
  const [isReplacementOpen, setIsReplacementOpen] = useState(false);
  const [replacementForm, setReplacementForm] = useState({
    toolId: "CUSTOM",
    toolCode: "",
    toolName: "",
    reason: "Ruptura en Servicio",
    priority: "Urgente",
    supplier: "Ferretería Industrial / Distribuidor OEM",
    estimatedCost: 180000,
    requestedBy: "Carlos Muñoz (Jefe de Taller)",
    notes: "",
  });

  const fetchToolroomData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/toolroom", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando Pañol");
      setTools(json.tools || []);
      setMovements(json.movements || []);
      setReplacements(json.replacements || []);
      setMechanics(json.mechanics || []);
      setWorkOrders(json.workOrders || []);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar Pañol de Taller",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchToolroomData();
  }, [fetchToolroomData]);

  // Crear Herramienta
  const handleCreateTool = async () => {
    if (!newToolForm.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nombre requerido",
        description: "Ingresa el nombre de la herramienta o equipo.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/toolroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_tool",
          ...newToolForm,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast({
        title: "Herramienta Registrada en Pañol",
        description: `${json.data.code} — ${json.data.name} agregada correctamente.`,
      });
      setIsNewToolOpen(false);
      setNewToolForm({
        code: "",
        name: "",
        brand: "",
        category: "Precisión y Torque",
        location: "Gabinete Pañol A-1",
        cost: 150000,
        supplier: "",
        requiresCert: true,
        certNumber: "",
        certLab: "LabMet Metrología Chile",
        certExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
        notes: "",
      });
      await fetchToolroomData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Registrar Salida (Entrega a Mecánico)
  const handleOpenCheckout = (tool: ToolroomTool) => {
    setCheckoutTool(tool);
    setCheckoutForm({
      mechanicName: mechanics[0]?.name || "Carlos Muñoz",
      workOrderFolio: workOrders[0]?.folio || "SIN_OT",
      notes: "Entregada en óptimas condiciones desde pañol.",
    });
  };

  const handleConfirmCheckout = async () => {
    if (!checkoutTool) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/toolroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkout_tool",
          toolId: checkoutTool.id,
          mechanicName: checkoutForm.mechanicName,
          workOrderFolio:
            checkoutForm.workOrderFolio === "SIN_OT" ? null : checkoutForm.workOrderFolio,
          notes: checkoutForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast({
        title: "Salida de Herramienta Registrada",
        description: `${checkoutTool.code} entregada a ${checkoutForm.mechanicName}.`,
      });
      setCheckoutTool(null);
      await fetchToolroomData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Registrar Entrada / Recepción en Pañol
  const handleOpenCheckin = (tool: ToolroomTool) => {
    setCheckinTool(tool);
    setCheckinForm({
      conditionOnReturn: "Óptima",
      notes: "Recepcionada limpia, completa y verificada en pañol.",
    });
  };

  const handleConfirmCheckin = async () => {
    if (!checkinTool) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/toolroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkin_tool",
          toolId: checkinTool.id,
          conditionOnReturn: checkinForm.conditionOnReturn,
          notes: checkinForm.notes,
          createReplacementIfDamaged: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast({
        title:
          checkinForm.conditionOnReturn === "Dañada"
            ? "Recepcionada con Daño -> Enviada a Reposición"
            : "Recepción en Pañol Exitosa",
        description:
          checkinForm.conditionOnReturn === "Dañada"
            ? `Se generó automáticamente una solicitud de reposición para ${checkinTool.code}.`
            : `${checkinTool.code} ya está nuevamente Disponible en Pañol.`,
      });
      setCheckinTool(null);
      await fetchToolroomData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Emitir / Renovar Certificado ISO
  const handleOpenCertModal = (tool: ToolroomTool) => {
    setCertTool(tool);
    setCertForm({
      certNumber:
        tool.certNumber ||
        `CERT-ISO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      certLab: tool.certLab || "LabMet Metrología Chile",
      certIssuedAt: new Date().toISOString().split("T")[0],
      certExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      certStatus: "Vigente",
      notes: "Verificación de exactitud y calibración aprobada según ISO 9001:2015.",
    });
  };

  const handleConfirmCert = async () => {
    if (!certTool) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/toolroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "certify_tool",
          toolId: certTool.id,
          ...certForm,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast({
        title: "Certificado de Calibración Actualizado",
        description: `${certTool.code} cuenta ahora con certificado ${certForm.certNumber} (${certForm.certStatus}).`,
      });
      setCertTool(null);
      await fetchToolroomData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Crear Solicitud de Reposición
  const handleCreateReplacement = async () => {
    const selectedTool = tools.find((t) => t.id === replacementForm.toolId);
    const code = selectedTool ? selectedTool.code : replacementForm.toolCode || "HER-NUEVA";
    const name = selectedTool ? selectedTool.name : replacementForm.toolName;

    if (!name?.trim()) {
      toast({
        variant: "destructive",
        title: "Herramienta requerida",
        description: "Selecciona una herramienta del pañol o escribe el nombre a reponer.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/toolroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_replacement",
          toolId: selectedTool ? selectedTool.id : null,
          toolCode: code,
          toolName: name,
          reason: replacementForm.reason,
          priority: replacementForm.priority,
          supplier: replacementForm.supplier,
          estimatedCost: replacementForm.estimatedCost,
          requestedBy: replacementForm.requestedBy,
          notes: replacementForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast({
        title: "Solicitud de Reposición Creada",
        description: `Se registró la reposición para ${code} (${name}).`,
      });
      setIsReplacementOpen(false);
      await fetchToolroomData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Completar Reposición y Reingresar Herramienta al Pañol
  const handleCompleteReplacement = async (repId: string, toolCode: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/toolroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_replacement",
          replacementId: repId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast({
        title: "Reposición Recepcionada en Pañol",
        description: `La herramienta ${toolCode} fue repuesta y ya figura como Disponible y Óptima.`,
      });
      await fetchToolroomData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar Herramienta
  const handleDeleteTool = async (tool: ToolroomTool) => {
    try {
      const res = await fetch(`/api/toolroom?id=${tool.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar la herramienta");
      toast({
        title: "Herramienta Eliminada",
        description: `${tool.code} fue retirada del registro del pañol.`,
      });
      await fetchToolroomData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    const headers = [
      "Código",
      "Herramienta",
      "Marca",
      "Categoría",
      "Ubicación Pañol",
      "Estado Actual",
      "Condición Física",
      "Mecánico Asignado",
      "OT Vinculada",
      "Estado Certificado ISO",
      "Número Certificado",
      "Laboratorio",
      "Vencimiento Certificado",
      "Valor Costo CLP",
    ];
    const rows = tools.map((t) => [
      t.code,
      t.name,
      t.brand,
      t.category,
      t.location,
      t.status,
      t.condition,
      t.assignedToName || "En Pañol",
      t.workOrderFolio || "-",
      t.certStatus,
      t.certNumber || "-",
      t.certLab || "-",
      t.certExpiresAt || "-",
      t.cost || 0,
    ]);
    exportToExcel("Panol_Herramientas_LionFix", headers, rows);
    toast({
      title: "Excel Descargado",
      description: "Se exportó la planilla completa del Pañol de Taller.",
    });
  };

  // KPIs
  const totalTools = tools.length;
  const totalValue = tools.reduce((acc, t) => acc + (Number(t.cost) || 0), 0);
  const toolsInUse = tools.filter((t) => t.status === "En Uso").length;
  const validCerts = tools.filter((t) => t.certStatus === "Vigente").length;
  const alertCerts = tools.filter(
    (t) => t.certStatus === "Próximo a Vencer" || t.certStatus === "Vencido"
  ).length;
  const pendingReplacements = replacements.filter(
    (r) => r.status !== "Repuesta en Pañol"
  ).length;

  const filteredTools = tools.filter((t) => {
    const matchesSearch =
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.assignedToName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-57px)]">
      <DashboardHeader title="Pañol de Taller — Control de Herramientas">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            onClick={handleExportExcel}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            onClick={() => setIsReplacementOpen(true)}
          >
            <RefreshCw className="h-4 w-4" />
            Solicitar Reposición
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setIsNewToolOpen(true)}>
            <PlusCircle className="h-4 w-4" />
            Nueva Herramienta
          </Button>
        </div>
      </DashboardHeader>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {/* KPIs DEL PAÑOL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Dotación en Pañol</CardTitle>
              <Wrench className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTools} Herramientas</div>
              <p className="text-xs text-muted-foreground mt-1">
                Valorizado en ${totalValue.toLocaleString("es-CL")} CLP
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Salidas Activas (En Piso)</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-sky-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-400">{toolsInUse} Prestadas</div>
              <p className="text-xs text-muted-foreground mt-1">
                {tools.filter((t) => t.status === "Disponible").length} disponibles para entrega inmediata
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Certificación ISO 9001</CardTitle>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{validCerts} Vigentes</div>
              <p className="text-xs text-muted-foreground mt-1">
                {alertCerts > 0
                  ? `${alertCerts} equipo(s) requieren recalibración`
                  : "100% de instrumentos al día"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cola de Reposición</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">
                {pendingReplacements} Pendientes
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Control de bajas, roturas y recambios
              </p>
            </CardContent>
          </Card>
        </div>

        {/* PESTAÑAS OPERATIVAS DEL PAÑOL */}
        <Tabs defaultValue="catalog" className="space-y-4">
          <TabsList className="bg-card/70 border border-border/60 p-1 rounded-xl flex-wrap h-auto">
            <TabsTrigger value="catalog" className="gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Inventario, Salidas y Recepción ({tools.length})
            </TabsTrigger>
            <TabsTrigger value="movements" className="gap-2">
              <Clock className="h-4 w-4 text-sky-400" />
              Bitácora de Salidas y Entradas ({movements.length})
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2">
              <Award className="h-4 w-4 text-emerald-400" />
              Certificados y Calibración ISO
            </TabsTrigger>
            <TabsTrigger value="replacements" className="gap-2">
              <RefreshCw className="h-4 w-4 text-amber-400" />
              Reposición de Herramientas ({replacements.length})
            </TabsTrigger>
          </TabsList>

          {/* PESTAÑA 1: CATÁLOGO, SALIDAS Y RECEPCIÓN */}
          <TabsContent value="catalog">
            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Control de Pañol: Entregas (Salidas) y Recepción (Entradas)</CardTitle>
                    <CardDescription>
                      Registra a qué mecánico se entrega cada herramienta y verifica su estado al recibirla de vuelta en pañol
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar código, nombre o mecánico..."
                        className="pl-8 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[170px] text-sm">
                        <SelectValue placeholder="Filtrar Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos los estados</SelectItem>
                        <SelectItem value="Disponible">Disponible en Pañol</SelectItem>
                        <SelectItem value="En Uso">En Uso (Salida)</SelectItem>
                        <SelectItem value="Para Reposición">Para Reposición</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    Cargando inventario del Pañol de Taller...
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Herramienta / Equipo</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Estado en Pañol</TableHead>
                        <TableHead>Asignación Actual</TableHead>
                        <TableHead>Certificado ISO</TableHead>
                        <TableHead className="text-right">Acciones de Pañol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTools.map((tool) => (
                        <TableRow key={tool.id}>
                          <TableCell className="font-mono font-bold text-primary text-xs">
                            {tool.code}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-sm">{tool.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {tool.brand} • {tool.category}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {tool.location}
                          </TableCell>
                          <TableCell>
                            {tool.status === "Disponible" && (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Disponible
                              </Badge>
                            )}
                            {tool.status === "En Uso" && (
                              <Badge className="bg-sky-500/15 text-sky-400 border border-sky-500/30">
                                En Salida (En Uso)
                              </Badge>
                            )}
                            {tool.status === "Para Reposición" && (
                              <Badge variant="destructive">Dañada / Reposición</Badge>
                            )}
                            {tool.status === "En Certificación" && (
                              <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                En Laboratorio
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {tool.status === "En Uso" ? (
                              <div>
                                <div className="font-semibold text-foreground">
                                  👨‍🔧 {tool.assignedToName}
                                </div>
                                {tool.workOrderFolio && (
                                  <div className="text-muted-foreground font-mono">
                                    OT: {tool.workOrderFolio}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">En custodia de Pañol</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {tool.certStatus === "Vigente" && (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/40 text-emerald-400 text-xs cursor-pointer"
                                onClick={() => setPreviewCertTool(tool)}
                              >
                                ✓ {tool.certNumber || "Vigente"}
                              </Badge>
                            )}
                            {tool.certStatus === "Próximo a Vencer" && (
                              <Badge
                                variant="outline"
                                className="border-amber-500/40 text-amber-400 text-xs cursor-pointer"
                                onClick={() => handleOpenCertModal(tool)}
                              >
                                ⚠ Por Vencer ({tool.certExpiresAt})
                              </Badge>
                            )}
                            {tool.certStatus === "Vencido" && (
                              <Badge
                                variant="destructive"
                                className="text-xs cursor-pointer"
                                onClick={() => handleOpenCertModal(tool)}
                              >
                                ✕ Vencido
                              </Badge>
                            )}
                            {tool.certStatus === "No Requiere" && (
                              <span className="text-xs text-muted-foreground">Uso General</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {tool.status === "Disponible" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-8 text-xs gap-1"
                                  onClick={() => handleOpenCheckout(tool)}
                                >
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                  Salida (Entregar)
                                </Button>
                              )}
                              {tool.status === "En Uso" && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 text-xs gap-1 bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30"
                                  onClick={() => handleOpenCheckin(tool)}
                                >
                                  <ArrowDownLeft className="h-3.5 w-3.5" />
                                  Recepcionar (Entrada)
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-xs"
                                title="Certificación ISO"
                                onClick={() => handleOpenCertModal(tool)}
                              >
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                                title="Eliminar herramienta"
                                onClick={() => handleDeleteTool(tool)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PESTAÑA 2: BITÁCORA DE SALIDAS, ENTRADAS Y RECEPCIÓN */}
          <TabsContent value="movements">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-sky-400" />
                  Historial de Salidas, Entradas y Recepción de Herramientas
                </CardTitle>
                <CardDescription>
                  Trazabilidad completa de préstamos a mecánicos, devoluciones al pañol, calibraciones y reposiciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha / Hora</TableHead>
                      <TableHead>Movimiento</TableHead>
                      <TableHead>Herramienta</TableHead>
                      <TableHead>Mecánico / Responsable</TableHead>
                      <TableHead>OT / Referencia</TableHead>
                      <TableHead>Estado de Recepción & Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(mov.timestamp).toLocaleString("es-CL", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          {mov.type === "SALIDA" && (
                            <Badge className="bg-sky-500/15 text-sky-400 border border-sky-500/30 gap-1">
                              <ArrowUpRight className="h-3 w-3" /> SALIDA A PISO
                            </Badge>
                          )}
                          {mov.type === "ENTRADA_RECEPCION" && (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 gap-1">
                              <ArrowDownLeft className="h-3 w-3" /> ENTRADA / RECEPCIÓN
                            </Badge>
                          )}
                          {mov.type === "CERTIFICACION" && (
                            <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/30 gap-1">
                              <ShieldCheck className="h-3 w-3" /> CERTIFICADO ISO
                            </Badge>
                          )}
                          {mov.type === "REPOSICION" && (
                            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 gap-1">
                              <PackagePlus className="h-3 w-3" /> REPOSICIÓN
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs font-bold text-primary">
                            {mov.toolCode}
                          </div>
                          <div className="text-xs">{mov.toolName}</div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{mov.mechanicName}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {mov.workOrderFolio || "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {mov.conditionOnReturn && (
                            <span className="font-semibold text-foreground mr-2">
                              [{mov.conditionOnReturn}]
                            </span>
                          )}
                          <span className="text-muted-foreground">{mov.notes}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PESTAÑA 3: CERTIFICADOS Y CALIBRACIÓN (ISO 9001) */}
          <TabsContent value="certificates">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-400" />
                  Control de Certificados y Calibración Metrológica (ISO 9001 Cláusula 7.1.5)
                </CardTitle>
                <CardDescription>
                  Verifica la vigencia de llaves dinamométricas, manómetros, scanners y equipos sometidos a certificación periódica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Instrumento / Herramienta</TableHead>
                      <TableHead>N° Certificado</TableHead>
                      <TableHead>Laboratorio Emisor</TableHead>
                      <TableHead>Emisión</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Vigencia</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tools
                      .filter((t) => t.requiresCert || t.certStatus !== "No Requiere")
                      .map((tool) => (
                        <TableRow key={tool.id}>
                          <TableCell className="font-mono font-bold text-primary text-xs">
                            {tool.code}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{tool.name}</div>
                            <div className="text-xs text-muted-foreground">{tool.brand}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold">
                            {tool.certNumber || "Sin Folio"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {tool.certLab || "LabMet Metrología Chile"}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {tool.certIssuedAt || "—"}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {tool.certExpiresAt || "—"}
                          </TableCell>
                          <TableCell>
                            {tool.certStatus === "Vigente" && (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Vigente
                              </Badge>
                            )}
                            {tool.certStatus === "Próximo a Vencer" && (
                              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Próximo a Vencer
                              </Badge>
                            )}
                            {tool.certStatus === "Vencido" && (
                              <Badge variant="destructive">Vencido</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5"
                                onClick={() => setPreviewCertTool(tool)}
                              >
                                <Printer className="h-3.5 w-3.5 text-primary" />
                                Ver Certificado
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 text-xs gap-1.5"
                                onClick={() => handleOpenCertModal(tool)}
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Renovar / Certificar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PESTAÑA 4: REPOSICIÓN DE HERRAMIENTAS Y BAJAS */}
          <TabsContent value="replacements">
            <Card className="border-border/60">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-amber-400" />
                    Control de Reposición de Herramientas, Daños y Bajas
                  </CardTitle>
                  <CardDescription>
                    Gestiona el reemplazo de herramientas dañadas en servicio, desgastadas o rechazadas en calibración
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setIsReplacementOpen(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  Nueva Solicitud de Reposición
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha Solicitud</TableHead>
                      <TableHead>Herramienta a Reponer</TableHead>
                      <TableHead>Motivo de Baja</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Proveedor / Costo Est.</TableHead>
                      <TableHead>Estado de Reposición</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {replacements.map((rep) => (
                      <TableRow key={rep.id}>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {new Date(rep.requestedAt).toLocaleDateString("es-CL")}
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs font-bold text-primary">
                            {rep.toolCode}
                          </div>
                          <div className="font-medium text-sm">{rep.toolName}</div>
                          {rep.notes && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {rep.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{rep.reason}</TableCell>
                        <TableCell>
                          <Badge
                            variant={rep.priority === "Urgente" ? "destructive" : "secondary"}
                          >
                            {rep.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium">{rep.supplier}</div>
                          <div className="font-mono text-muted-foreground">
                            ${Number(rep.estimatedCost || 0).toLocaleString("es-CL")} CLP
                          </div>
                        </TableCell>
                        <TableCell>
                          {rep.status === "Repuesta en Pañol" ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              ✓ Repuesta en Pañol
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              {rep.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {rep.status !== "Repuesta en Pañol" ? (
                            <Button
                              size="sm"
                              className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                              disabled={submitting}
                              onClick={() => handleCompleteReplacement(rep.id, rep.toolCode)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Recepcionar Reposición
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground font-mono">
                              Reingresada{" "}
                              {rep.resolvedAt
                                ? new Date(rep.resolvedAt).toLocaleDateString("es-CL")
                                : ""}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* MODAL 1: NUEVA HERRAMIENTA EN PAÑOL */}
      <Dialog open={isNewToolOpen} onOpenChange={setIsNewToolOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Herramienta o Equipo en Pañol</DialogTitle>
            <DialogDescription>
              Ingresa los datos técnicos, ubicación y certificación ISO de la herramienta.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Código de Pañol</Label>
                <Input
                  placeholder="Ej: HER-TORQ-02"
                  value={newToolForm.code}
                  onChange={(e) => setNewToolForm({ ...newToolForm, code: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Marca / Fabricante</Label>
                <Input
                  placeholder="Ej: Snap-on / Bosch / Gedore"
                  value={newToolForm.brand}
                  onChange={(e) => setNewToolForm({ ...newToolForm, brand: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre de la Herramienta o Instrumento</Label>
              <Input
                placeholder="Ej: Torquímetro Digital 1/2 40-200 Nm"
                value={newToolForm.name}
                onChange={(e) => setNewToolForm({ ...newToolForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select
                  value={newToolForm.category}
                  onValueChange={(v) => setNewToolForm({ ...newToolForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Precisión y Torque">Precisión y Torque</SelectItem>
                    <SelectItem value="Diagnóstico Electrónico">Diagnóstico Electrónico</SelectItem>
                    <SelectItem value="Herramienta Especial Motor">Herramienta Especial Motor</SelectItem>
                    <SelectItem value="Hidráulica y Elevación">Hidráulica y Elevación</SelectItem>
                    <SelectItem value="Neumática y Eléctrica">Neumática y Eléctrica</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ubicación en Pañol</Label>
                <Input
                  placeholder="Ej: Gabinete Calibrado A-1"
                  value={newToolForm.location}
                  onChange={(e) => setNewToolForm({ ...newToolForm, location: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor de Reposición ($ CLP)</Label>
                <Input
                  type="number"
                  value={newToolForm.cost}
                  onChange={(e) =>
                    setNewToolForm({ ...newToolForm, cost: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Proveedor Habitual</Label>
                <Input
                  placeholder="Ej: Würth Chile"
                  value={newToolForm.supplier}
                  onChange={(e) => setNewToolForm({ ...newToolForm, supplier: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-border/50 pt-3">
              <div className="space-y-1.5">
                <Label>N° Certificado ISO (Opcional)</Label>
                <Input
                  placeholder="Ej: CERT-ISO-2026-105"
                  value={newToolForm.certNumber}
                  onChange={(e) =>
                    setNewToolForm({ ...newToolForm, certNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Vencimiento Calibración</Label>
                <Input
                  type="date"
                  value={newToolForm.certExpiresAt}
                  onChange={(e) =>
                    setNewToolForm({ ...newToolForm, certExpiresAt: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewToolOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTool} disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar en Pañol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: REGISTRAR SALIDA DE PAÑOL (ENTREGA A MECÁNICO) */}
      <Dialog open={Boolean(checkoutTool)} onOpenChange={() => setCheckoutTool(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-sky-400" />
              Registrar Salida de Herramienta
            </DialogTitle>
            <DialogDescription>
              Entrega de <strong>{checkoutTool?.code}</strong> — {checkoutTool?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Mecánico que retira la herramienta</Label>
              <Select
                value={checkoutForm.mechanicName}
                onValueChange={(v) => setCheckoutForm({ ...checkoutForm, mechanicName: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un mecánico" />
                </SelectTrigger>
                <SelectContent>
                  {mechanics.map((m) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name} ({m.email})
                    </SelectItem>
                  ))}
                  {mechanics.length === 0 && (
                    <SelectItem value="Carlos Muñoz">Carlos Muñoz (Jefe de Taller)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Orden de Trabajo Asociada (Opcional)</Label>
              <Select
                value={checkoutForm.workOrderFolio}
                onValueChange={(v) => setCheckoutForm({ ...checkoutForm, workOrderFolio: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIN_OT">Uso general en taller (Sin OT específica)</SelectItem>
                  {workOrders.map((wo) => (
                    <SelectItem key={wo.id} value={wo.folio || wo.id.substring(0, 8)}>
                      {wo.folio || wo.id.substring(0, 8)} ({wo.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observaciones de Salida</Label>
              <Textarea
                rows={3}
                value={checkoutForm.notes}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutTool(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmCheckout} disabled={submitting}>
              {submitting ? "Registrando..." : "Confirmar Salida de Pañol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: REGISTRAR ENTRADA / RECEPCIÓN EN PAÑOL */}
      <Dialog open={Boolean(checkinTool)} onOpenChange={() => setCheckinTool(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
              Recepción de Herramienta en Pañol (Entrada)
            </DialogTitle>
            <DialogDescription>
              Reingreso de <strong>{checkinTool?.code}</strong> devuelta por{" "}
              <strong>{checkinTool?.assignedToName || "Mecánico"}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Estado Físico de Recepción</Label>
              <Select
                value={checkinForm.conditionOnReturn}
                onValueChange={(v) =>
                  setCheckinForm({ ...checkinForm, conditionOnReturn: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Óptima">✓ Óptima — Limpia, completa y operativa</SelectItem>
                  <SelectItem value="Desgaste Leve">
                    ⚠ Desgaste Leve — Operativa con observación
                  </SelectItem>
                  <SelectItem value="Dañada">
                    ✕ Dañada / Averiada — Enviar automáticamente a Reposición
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observaciones del Pañolero al Recepcionar</Label>
              <Textarea
                rows={3}
                value={checkinForm.notes}
                onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckinTool(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmCheckin} disabled={submitting}>
              {submitting ? "Procesando..." : "Confirmar Recepción en Pañol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: RENOVAR / EMITIR CERTIFICADO ISO 9001 */}
      <Dialog open={Boolean(certTool)} onOpenChange={() => setCertTool(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Certificación y Calibración ISO 9001
            </DialogTitle>
            <DialogDescription>
              Equipo: <strong>{certTool?.code}</strong> — {certTool?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>N° de Certificado Oficial</Label>
                <Input
                  value={certForm.certNumber}
                  onChange={(e) => setCertForm({ ...certForm, certNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Estado de Certificación</Label>
                <Select
                  value={certForm.certStatus}
                  onValueChange={(v) => setCertForm({ ...certForm, certStatus: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vigente">Vigente (Aprobado)</SelectItem>
                    <SelectItem value="Próximo a Vencer">Próximo a Vencer</SelectItem>
                    <SelectItem value="Vencido">Vencido / Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Laboratorio / Entidad Certificadora</Label>
              <Input
                value={certForm.certLab}
                onChange={(e) => setCertForm({ ...certForm, certLab: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha de Calibración</Label>
                <Input
                  type="date"
                  value={certForm.certIssuedAt}
                  onChange={(e) => setCertForm({ ...certForm, certIssuedAt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fecha de Vencimiento</Label>
                <Input
                  type="date"
                  value={certForm.certExpiresAt}
                  onChange={(e) =>
                    setCertForm({ ...certForm, certExpiresAt: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Dictamen Técnico / Observaciones</Label>
              <Textarea
                rows={2}
                value={certForm.notes}
                onChange={(e) => setCertForm({ ...certForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertTool(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmCert} disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar Certificado ISO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: VISTA PREVIA E IMPRESIÓN DEL CERTIFICADO OFICIAL */}
      <Dialog open={Boolean(previewCertTool)} onOpenChange={() => setPreviewCertTool(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Certificado de Calibración y Conformidad Metrológica
            </DialogTitle>
            <DialogDescription>
              Documento de respaldo interno conforme a ISO 9001:2015 — Cláusula 7.1.5
            </DialogDescription>
          </DialogHeader>
          {previewCertTool && (
            <div className="p-6 rounded-xl border border-primary/40 bg-card/80 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <div className="text-xs uppercase tracking-widest text-primary font-bold">
                    LIONFIX SERVICE ERP • CONTROL METROLÓGICO DE PAÑOL
                  </div>
                  <div className="text-lg font-bold mt-0.5">
                    FOLIO: {previewCertTool.certNumber || "CERT-ISO-VIGENTE"}
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {previewCertTool.certStatus}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Código de Pañol:</span>
                  <span className="font-mono font-bold text-sm">{previewCertTool.code}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Marca / Modelo:</span>
                  <span className="font-semibold text-sm">{previewCertTool.brand}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block">Instrumento / Equipo:</span>
                  <span className="font-semibold text-sm">{previewCertTool.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Entidad Certificadora:</span>
                  <span className="font-medium">
                    {previewCertTool.certLab || "LabMet Metrología Chile"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Ubicación en Pañol:</span>
                  <span className="font-medium">{previewCertTool.location}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Fecha de Emisión:</span>
                  <span className="font-mono">{previewCertTool.certIssuedAt || "2026-01-15"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Próxima Calibración:</span>
                  <span className="font-mono font-bold text-primary">
                    {previewCertTool.certExpiresAt || "2027-01-15"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground">
                Se certifica que el instrumento identificado ha sido sometido a pruebas de
                repetibilidad y exactitud dentro de las tolerancias exigidas por el fabricante
                para operaciones críticas en taller mecánico.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewCertTool(null)}>
              Cerrar
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => {
                window.print();
              }}
            >
              <Printer className="h-4 w-4" /> Imprimir / Guardar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 6: SOLICITAR REPOSICIÓN DE HERRAMIENTA */}
      <Dialog open={isReplacementOpen} onOpenChange={setIsReplacementOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-amber-400" />
              Solicitar Reposición de Herramienta
            </DialogTitle>
            <DialogDescription>
              Registra una herramienta dañada, desgastada o extraviada para gestionar su compra y reposición en pañol.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Seleccionar Herramienta del Pañol</Label>
              <Select
                value={replacementForm.toolId}
                onValueChange={(v) => setReplacementForm({ ...replacementForm, toolId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOM">+ Otra herramienta / Ingreso manual</SelectItem>
                  {tools.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.code} — {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {replacementForm.toolId === "CUSTOM" && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Código</Label>
                  <Input
                    placeholder="HER-NUEVA"
                    value={replacementForm.toolCode}
                    onChange={(e) =>
                      setReplacementForm({ ...replacementForm, toolCode: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Nombre de Herramienta</Label>
                  <Input
                    placeholder="Ej: Juego Dados Impacto Milimétricos"
                    value={replacementForm.toolName}
                    onChange={(e) =>
                      setReplacementForm({ ...replacementForm, toolName: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Motivo de Reposición / Baja</Label>
                <Select
                  value={replacementForm.reason}
                  onValueChange={(v) => setReplacementForm({ ...replacementForm, reason: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ruptura en Servicio">Ruptura en Servicio</SelectItem>
                    <SelectItem value="Desgaste Natural">Desgaste Natural por Uso</SelectItem>
                    <SelectItem value="Extravío">Extravío en Taller</SelectItem>
                    <SelectItem value="Rechazo en Certificación">
                      Rechazo en Certificación ISO
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prioridad</Label>
                <Select
                  value={replacementForm.priority}
                  onValueChange={(v) =>
                    setReplacementForm({ ...replacementForm, priority: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgente">Urgente (Crítica para operación)</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Proveedor Sugerido</Label>
                <Input
                  value={replacementForm.supplier}
                  onChange={(e) =>
                    setReplacementForm({ ...replacementForm, supplier: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Costo Estimado ($ CLP)</Label>
                <Input
                  type="number"
                  value={replacementForm.estimatedCost}
                  onChange={(e) =>
                    setReplacementForm({
                      ...replacementForm,
                      estimatedCost: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Detalle del Daño o Justificación</Label>
              <Textarea
                rows={2}
                placeholder="Describe por qué requiere reposición..."
                value={replacementForm.notes}
                onChange={(e) =>
                  setReplacementForm({ ...replacementForm, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplacementOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateReplacement} disabled={submitting}>
              {submitting ? "Registrando..." : "Registrar Solicitud de Reposición"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
