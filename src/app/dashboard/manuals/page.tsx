"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Wrench,
  FileText,
  Upload,
  ExternalLink,
  Save,
  Search,
  Droplet,
  Disc,
  Layers,
  StickyNote,
  ChevronRight,
  Maximize2,
  Car,
  CheckCircle2,
  PlusCircle,
  Trash2,
  RotateCw,
  Globe,
  Monitor,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Modelos y fichas técnicas de ejemplo precargadas
type TorqueSpec = {
  component: string;
  torque: string;
  notes?: string;
};

type FluidSpec = {
  system: string;
  capacity: string;
  specification: string;
};

type VehicleTechSheet = {
  id: string;
  name: string;
  engineCode: string;
  yearRange: string;
  pdfUrl?: string;
  pdfName?: string;
  notes: string;
  engineTorques: TorqueSpec[];
  chassisTorques: TorqueSpec[];
  fluids: FluidSpec[];
};

const DEFAULT_PRESETS: VehicleTechSheet[] = [
  {
    id: "sprinter-om651",
    name: "Mercedes-Benz Sprinter 315 / 515 CDI",
    engineCode: "OM651 (2.1L Bi-Turbo)",
    yearRange: "2013 - 2023",
    pdfName: "Manual_Taller_Sprinter_OM651.pdf",
    notes: "Atención: No reutilizar pernos de culata ni de bancada (son pernos elásticos de un solo uso). Respetar orden de apriete en espiral desde el centro.",
    engineTorques: [
      { component: "Pernos de Culata (Etapa 1)", torque: "60 Nm", notes: "Desde el centro hacia afuera en espiral" },
      { component: "Pernos de Culata (Etapa 2)", torque: "+90°", notes: "Apriete angular" },
      { component: "Pernos de Culata (Etapa 3)", torque: "+90°", notes: "Apriete angular final" },
      { component: "Bancada de Cigüeñal", torque: "65 Nm + 90°", notes: "Pernos nuevos requeridos" },
      { component: "Tapas de Biela", torque: "25 Nm + 90°", notes: "Pernos nuevos requeridos" },
      { component: "Tapa de Válvulas", torque: "9 Nm", notes: "Apriete parejo" },
      { component: "Tapón de Cárter", torque: "30 Nm", notes: "Cambiar golilla de cobre" },
      { component: "Tapa Filtro de Aceite", torque: "25 Nm", notes: "Lubricar orings" },
    ],
    chassisTorques: [
      { component: "Tuercas de Rueda (Llantas)", torque: "180 Nm", notes: "Apriete en cruz con llave dinamométrica" },
      { component: "Portacaliper Delantero (Soporte)", torque: "170 Nm", notes: "Fijador de roscas medio (azul)" },
      { component: "Pasadores / Guías Caliper", torque: "30 Nm", notes: "Engrasar pernos guía con grasa silicona" },
      { component: "Tuerca Maza / Cubo Delantero", torque: "450 Nm", notes: "Verificar juego libre axial" },
      { component: "Amortiguadores (Perno Superior)", torque: "65 Nm", notes: "" },
    ],
    fluids: [
      { system: "Aceite de Motor (con filtro)", capacity: "11.5 Litros", specification: "MB 229.52 / 5W-30 Low SAPS" },
      { system: "Líquido Refrigerante", capacity: "10.0 Litros", specification: "MB 325.5 / 326.5 (Azul/Verde)" },
      { system: "Caja de Cambios Manual (6 vel.)", capacity: "1.8 Litros", specification: "MB 235.10 (75W-80)" },
      { system: "Diferencial Trasero", capacity: "1.6 Litros", specification: "MB 235.0 (85W-90 / 75W-90)" },
      { system: "Líquido de Frenos", capacity: "1.2 Litros", specification: "DOT 4 Plus" },
    ],
  },
  {
    id: "hilux-1gd",
    name: "Toyota Hilux 2.8 D-4D",
    engineCode: "1GD-FTV (2.8L)",
    yearRange: "2016 - 2024",
    pdfName: "Ficha_Tecnica_Hilux_1GD.pdf",
    notes: "Limpiar y secar completamente las roscas del bloque antes de torquear la culata. Calibración de holgura de válvulas en frío.",
    engineTorques: [
      { component: "Pernos de Culata (Etapa 1)", torque: "49 Nm", notes: "Orden especificado de taller" },
      { component: "Pernos de Culata (Etapa 2)", torque: "+90°", notes: "Primer paso angular" },
      { component: "Pernos de Culata (Etapa 3)", torque: "+90°", notes: "Segundo paso angular" },
      { component: "Bancadas Cigüeñal", torque: "50 Nm + 90°", notes: "Aceitar roscas ligeramente" },
      { component: "Bielas", torque: "35 Nm + 90°", notes: "" },
      { component: "Tapón de Cárter", torque: "37 Nm", notes: "Cambiar arandela de deformación" },
      { component: "Polea de Cigüeñal (Damper)", torque: "260 Nm", notes: "Bloquear volante motor" },
    ],
    chassisTorques: [
      { component: "Tuercas de Rueda", torque: "110 Nm", notes: "Llantas de aleación OEM" },
      { component: "Portacaliper Delantero", torque: "123 Nm", notes: "" },
      { component: "Guías Mordaza Freno", torque: "34 Nm", notes: "" },
      { component: "Tuerca Maza Delantera", torque: "274 Nm", notes: "Remachar seguro en la muesca" },
    ],
    fluids: [
      { system: "Aceite de Motor (con filtro)", capacity: "7.5 Litros", specification: "API CJ-4 / ACEA C2 (5W-30 DPF)" },
      { system: "Refrigerante Motor", capacity: "8.6 Litros", specification: "Toyota Super Long Life (Rosa)" },
      { system: "Caja de Cambios Manual (6 vel.)", capacity: "2.2 Litros", specification: "Toyota Gear Oil LV 75W" },
      { system: "Diferencial Trasero (con LSD)", capacity: "3.2 Litros", specification: "GL-5 85W-90 / 75W-90 LSD" },
    ],
  },
];

export default function ManualsPage() {
  const { toast } = useToast();
  const [sheets, setSheets] = useState<VehicleTechSheet[]>(DEFAULT_PRESETS);
  const [selectedSheetId, setSelectedSheetId] = useState<string>(DEFAULT_PRESETS[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [haynesProUrl, setHaynesProUrl] = useState("https://workshopdata.com");
  const [iframeKey, setIframeKey] = useState(0);

  // Obtener la ficha seleccionada actualmente
  const activeSheet = sheets.find((s) => s.id === selectedSheetId) || sheets[0];

  // Cargar datos guardados en localStorage si existen
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lionfix_tech_sheets");
      if (saved) {
        setSheets(JSON.parse(saved));
      }
      const savedHaynesUrl = localStorage.getItem("lionfix_haynes_url");
      if (savedHaynesUrl) {
        setHaynesProUrl(savedHaynesUrl);
      }
    } catch (e) {
      console.warn("Could not load tech sheets from storage", e);
    }
  }, []);

  const saveSheets = (newSheets: VehicleTechSheet[]) => {
    setSheets(newSheets);
    try {
      localStorage.setItem("lionfix_tech_sheets", JSON.stringify(newSheets));
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const handleUpdateNotes = (newNotes: string) => {
    const updated = sheets.map((s) => (s.id === activeSheet.id ? { ...s, notes: newNotes } : s));
    saveSheets(updated);
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Archivo inválido",
        description: "Por favor selecciona un archivo PDF de manual o diagrama.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `manuals/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const { data, error } = await supabase.storage.from("evidence").upload(fileName, file);

      let publicUrl = "";
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("evidence").getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      } else {
        // Fallback para visualización local inmediata con ObjectURL
        publicUrl = URL.createObjectURL(file);
      }

      const updated = sheets.map((s) =>
        s.id === activeSheet.id
          ? { ...s, pdfUrl: publicUrl, pdfName: file.name }
          : s
      );
      saveSheets(updated);

      toast({
        title: "Manual PDF Vinculado",
        description: `El manual "${file.name}" quedó asignado a este vehículo.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar PDF",
        description: err.message || "No se pudo subir el archivo.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveHaynesUrl = () => {
    localStorage.setItem("lionfix_haynes_url", haynesProUrl);
    toast({
      title: "Enlace Guardado",
      description: "URL de acceso directo a HaynesPro actualizada.",
    });
  };

  const filteredSheets = sheets.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.engineCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-57px)]">
      <DashboardHeader title="Manuales Técnicos & Ficha de Torques">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-primary/40 hover:bg-primary/10 gap-2"
            onClick={() => window.open(haynesProUrl, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Abrir</span> HaynesPro Cloud
          </Button>
        </div>
      </DashboardHeader>

      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
        {/* BARRA SUPERIOR DE BÚSQUEDA Y SELECCIÓN DE VEHÍCULO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1 border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" /> Modelos Registrados
                </span>
                <Badge variant="outline" className="text-xs">
                  {sheets.length} Modelos
                </Badge>
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar modelo o motor..."
                  className="pl-8 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 space-y-1 max-h-[420px] overflow-y-auto">
              {filteredSheets.map((sheet) => {
                const isSelected = sheet.id === activeSheet.id;
                return (
                  <button
                    key={sheet.id}
                    onClick={() => setSelectedSheetId(sheet.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground shadow-sm"
                        : "bg-card/40 border-border/40 hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm line-clamp-1">{sheet.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>Motor: {sheet.engineCode}</span>
                        <span>•</span>
                        <span>{sheet.yearRange}</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        isSelected ? "text-primary translate-x-0.5" : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* DETALLES DEL VEHÍCULO ACTIVO */}
          <Card className="lg:col-span-2 border-border/60 shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <Badge variant="secondary" className="mb-2 text-primary font-mono tracking-wide">
                    MOTOR: {activeSheet.engineCode}
                  </Badge>
                  <CardTitle className="text-2xl font-bold">{activeSheet.name}</CardTitle>
                  <CardDescription className="mt-1">
                    Rango de Años: {activeSheet.yearRange} • Base de datos técnica para mecánicos de taller
                  </CardDescription>
                </div>
                
                {/* SUBIR / VER PDF */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="manual-pdf-upload"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleUploadPdf}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={isUploading}
                    onClick={() => document.getElementById("manual-pdf-upload")?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {activeSheet.pdfName ? "Cambiar Manual PDF" : "Subir Manual PDF"}
                  </Button>

                  {activeSheet.pdfUrl && (
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(activeSheet.pdfUrl, "_blank")}
                    >
                      <Maximize2 className="h-4 w-4" />
                      Ver a Pantalla Completa
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 text-xs bg-muted/40 p-3 rounded-lg border border-border/50">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Manual Actual:</span>
                </div>
                <span className="text-muted-foreground truncate">
                  {activeSheet.pdfName || "Sin manual PDF adjunto (sube el diagrama o manual de taller aquí)"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PESTAÑAS: TORQUES, FLUIDOS, VISOR PDF Y NOTAS */}
        <Tabs defaultValue="torques" className="space-y-4">
          <TabsList className="bg-card/70 border border-border/60 p-1 rounded-xl">
            <TabsTrigger value="torques" className="gap-2">
              <Wrench className="h-4 w-4 text-primary" /> Ficha de Torques (Aprietes)
            </TabsTrigger>
            <TabsTrigger value="fluids" className="gap-2">
              <Droplet className="h-4 w-4 text-blue-400" /> Fluidos & Capacidades
            </TabsTrigger>
            <TabsTrigger value="pdf" className="gap-2">
              <FileText className="h-4 w-4 text-orange-400" /> Visor PDF de Taller
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <StickyNote className="h-4 w-4 text-yellow-400" /> Bloc de Notas & HaynesPro Directo
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: TORQUES Y PARES DE APRIETE */}
          <TabsContent value="torques" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* MOTOR */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <Layers className="h-4 w-4 text-primary" /> Pares de Apriete de Motor
                  </CardTitle>
                  <CardDescription>Culata, bancadas, bielas y componentes internos</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    {activeSheet.engineTorques.map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div>
                          <div className="font-medium text-sm text-foreground">{item.component}</div>
                          {item.notes && <div className="text-xs text-muted-foreground mt-0.5">{item.notes}</div>}
                        </div>
                        <Badge variant="outline" className="font-mono text-sm px-2.5 py-1 font-bold bg-primary/10 text-primary border-primary/30 shrink-0">
                          {item.torque}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CHASIS Y FRENOS */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <Disc className="h-4 w-4 text-primary" /> Chasis, Frenos y Ruedas
                  </CardTitle>
                  <CardDescription>Seguridad crítica: ruedas, calipers y suspensión</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/40">
                    {activeSheet.chassisTorques.map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div>
                          <div className="font-medium text-sm text-foreground">{item.component}</div>
                          {item.notes && <div className="text-xs text-muted-foreground mt-0.5">{item.notes}</div>}
                        </div>
                        <Badge variant="outline" className="font-mono text-sm px-2.5 py-1 font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shrink-0">
                          {item.torque}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: FLUIDOS Y CAPACIDADES */}
          <TabsContent value="fluids">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-blue-400" /> Capacidades y Especificaciones de Fluidos
                </CardTitle>
                <CardDescription>Viscosidades recomendadas, normas de fabricante y volúmenes</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {activeSheet.fluids.map((fluid, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 transition-colors">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-sm text-foreground">{fluid.system}</div>
                        <div className="text-xs text-muted-foreground font-mono">Norma / Tipo: {fluid.specification}</div>
                      </div>
                      <Badge variant="secondary" className="font-mono text-sm px-3 py-1 font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 self-start sm:self-auto">
                        {fluid.capacity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: VISOR PDF DE TALLER */}
          <TabsContent value="pdf">
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-400" />
                    Visor de Manual Técnico: {activeSheet.pdfName || "Sin archivo cargado"}
                  </CardTitle>
                  <CardDescription>Consulta esquemas eléctricos y pasos de despiece directamente</CardDescription>
                </div>
                {activeSheet.pdfUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open(activeSheet.pdfUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" /> Abrir en ventana externa
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {activeSheet.pdfUrl ? (
                  <div className="w-full h-[750px] bg-neutral-900 border-none">
                    <iframe
                      src={`${activeSheet.pdfUrl}#toolbar=1&navpanes=1`}
                      className="w-full h-full border-none"
                      title="Visor de Manual PDF"
                    />
                  </div>
                ) : (
                  <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-muted/50 rounded-full border border-border">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">No hay manual PDF asignado para este vehículo</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-md">
                        Sube el manual de taller en PDF, esquema de fusibles o diagrama para tenerlo siempre a mano al reparar este modelo.
                      </p>
                    </div>
                    <Button
                      variant="default"
                      className="gap-2"
                      onClick={() => document.getElementById("manual-pdf-upload")?.click()}
                    >
                      <Upload className="h-4 w-4" /> Subir Manual PDF Ahora
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: BLOC DE NOTAS & VENTANA DIRECTA HAYNESPRO (LADO A LADO) */}
          <TabsContent value="notes">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              
              {/* LADO IZQUIERDO: BLOC DE NOTAS TÉCNICAS */}
              <div className="space-y-6">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <StickyNote className="h-4 w-4 text-yellow-400" />
                        Bloc de Notas Técnicas del Taller
                      </span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {activeSheet.engineCode}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Anota procedimientos especiales, calibraciones o tips de armado para este modelo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mechanic-notes" className="text-xs uppercase font-semibold text-muted-foreground">
                        Observaciones de Montaje & Procedimientos
                      </Label>
                      <Textarea
                        id="mechanic-notes"
                        rows={12}
                        className="font-mono text-sm leading-relaxed"
                        placeholder="Ejemplo: Al montar la culata en OM651, revisar golillas de inyectores (sustituir siempre). Torque tapón cárter 30 Nm..."
                        value={activeSheet.notes}
                        onChange={(e) => handleUpdateNotes(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Los cambios se guardan localmente
                      </p>
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          saveSheets(sheets);
                          toast({ title: "Notas Guardadas", description: "Se actualizaron las notas técnicas del vehículo." });
                        }}
                      >
                        <Save className="h-4 w-4" /> Guardar Notas
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* RESUMEN RÁPIDO DE TORQUES AL LADO DE LAS NOTAS */}
                <Card className="border-border/60 bg-muted/20">
                  <CardHeader className="py-3 px-4 border-b border-border/40">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-primary" /> Torques Clave Rápidos ({activeSheet.name})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-xs space-y-2">
                    {activeSheet.engineTorques.slice(0, 4).map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                        <span className="text-muted-foreground">{t.component}:</span>
                        <span className="font-mono font-bold text-primary">{t.torque}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* LADO DERECHO: VENTANA DIRECTA HAYNESPRO */}
              <div className="space-y-3">
                <Card className="border-border/60 shadow-sm overflow-hidden flex flex-col">
                  {/* BARRA SUPERIOR ESTILO NAVEGADOR / CONSOLA TALLER */}
                  <CardHeader className="py-2.5 px-4 bg-muted/40 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                      <span className="font-semibold text-xs text-foreground uppercase tracking-wider shrink-0 flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-primary" /> HaynesPro Directo
                      </span>
                      <Input
                        value={haynesProUrl}
                        onChange={(e) => setHaynesProUrl(e.target.value)}
                        className="h-7 text-xs font-mono bg-background/80 border-border/60 max-w-[280px]"
                        placeholder="https://workshopdata.com"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        title="Recargar visor"
                        onClick={() => {
                          setIframeKey((k) => k + 1);
                          toast({ title: "Recargando", description: "Actualizando ventana de HaynesPro..." });
                        }}
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Recargar</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        title="Abrir en ventana externa o 2do monitor"
                        onClick={() => window.open(haynesProUrl, "_blank", "noopener,noreferrer")}
                      >
                        <Monitor className="h-3.5 w-3.5 text-primary" />
                        <span className="hidden sm:inline">2do Monitor</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => window.open(haynesProUrl, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir Web
                      </Button>
                    </div>
                  </CardHeader>

                  {/* VISOR EMBEBIDO INTERACTIVO */}
                  <CardContent className="p-0 relative bg-neutral-950">
                    <div className="w-full h-[620px] bg-neutral-900 border-none relative">
                      <iframe
                        key={iframeKey}
                        src={haynesProUrl}
                        className="w-full h-full border-none"
                        title="HaynesPro WorkshopData Cloud"
                        allow="clipboard-read; clipboard-write; fullscreen"
                      />
                    </div>
                  </CardContent>

                  {/* PIE DE LA VENTANA DIRECTA */}
                  <div className="py-2 px-4 bg-muted/30 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] text-muted-foreground">
                    <span>
                      💡 Tip: Puedes consultar diagramas y manuales a la derecha mientras escribes notas a la izquierda.
                    </span>
                    <button
                      onClick={handleSaveHaynesUrl}
                      className="text-primary hover:underline font-medium shrink-0"
                    >
                      Guardar URL actual
                    </button>
                  </div>
                </Card>
              </div>

            </div>
          </TabsContent>
        </Tabs>

        {/* TARJETA CONFIGURACIÓN HAYNESPRO EXTERNO */}
        <Card className="border-border/60 bg-card/40 mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-primary" />
              Configuración de Enlace HaynesPro / WorkshopData Cloud
            </CardTitle>
            <CardDescription>
              Si tu taller cuenta con cuenta oficial de HaynesPro, puedes configurar el enlace para abrirlo con 1 clic
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-3">
            <Input
              value={haynesProUrl}
              onChange={(e) => setHaynesProUrl(e.target.value)}
              placeholder="https://workshopdata.com o tu enlace de distribuidor"
              className="text-sm font-mono"
            />
            <Button variant="secondary" className="shrink-0 gap-2" onClick={handleSaveHaynesUrl}>
              <Save className="h-4 w-4" /> Guardar Enlace
            </Button>
            <Button
              variant="outline"
              className="shrink-0 gap-2 border-primary/30"
              onClick={() => window.open(haynesProUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 text-primary" /> Probar Enlace
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
