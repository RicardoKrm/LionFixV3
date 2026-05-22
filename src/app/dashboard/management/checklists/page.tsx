"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  PlusCircle, FileText, CheckSquare, Truck, ClipboardCheck,
  ClipboardX, Car, X, Camera, Upload, Trash2, Plus, ImageIcon,
  ChevronRight, ChevronLeft, ClipboardList,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// ── Base items (editable / removable) ──────────────────────────────────────
const BASE_RECEPTION_ITEMS = [
  "Nivel de Combustible (registrar %)",
  "Carrocería (Rayones / Abolladuras)",
  "Luces Delanteras y Traseras",
  "Vidrios y Parabrisas (sin grietas)",
  "Neumáticos (estado y presión)",
  "Estado de Espejos",
  "Documentos del Vehículo (revisión técnica, seguro)",
  "Objetos de Valor dentro del vehículo",
  "Nivel de Aceite Motor",
  "Nivel de Líquido Refrigerante",
];

const BASE_DELIVERY_ITEMS = [
  "Reparación solicitada completada correctamente",
  "Limpieza del vehículo (interior y exterior)",
  "Documentación del servicio entregada al cliente",
  "Sin rayones nuevos en carrocería",
  "Luces funcionando correctamente",
  "Niveles de fluidos revisados y completados",
  "Objetos del cliente devueltos",
  "Boleta / Factura emitida",
];

type EvidenceCategory = "ingreso" | "trabajo" | "salida";
interface EvidencePhoto { url: string; name: string; category: EvidenceCategory; }

const CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  ingreso: "Ingreso al Taller",
  trabajo: "Trabajo Realizado",
  salida: "Salida del Taller",
};
const CATEGORY_COLORS: Record<EvidenceCategory, string> = {
  ingreso: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  trabajo: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  salida: "text-green-400 border-green-500/40 bg-green-500/10",
};

// ── Wizard step indicator ───────────────────────────────────────────────────
function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {labels.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  isDone
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                    ? "border-primary text-primary bg-primary/10"
                    : "border-muted text-muted-foreground bg-background"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </div>
              <span className={`text-xs mt-1 text-center font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 transition-all ${isDone ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function ChecklistsPage() {
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<any[]>([]);

  // Sheet + wizard state
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedChecklist, setSelectedChecklist] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Config
  const [formType, setFormType] = useState<"Recepción" | "Entrega">("Recepción");
  const [formWorkOrderId, setFormWorkOrderId] = useState("");

  // Step 2: Items
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [formCheckedItems, setFormCheckedItems] = useState<Record<string, boolean>>({});

  // Step 3: Evidence + Notes
  const [evidencePhotos, setEvidencePhotos] = useState<EvidencePhoto[]>([]);
  const [uploadingCategory, setUploadingCategory] = useState<EvidenceCategory | null>(null);
  const [activeUploadCategory, setActiveUploadCategory] = useState<EvidenceCategory>("ingreso");
  const [formNotes, setFormNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TOTAL_STEPS = 3;
  const STEP_LABELS = ["Configuración", "Verificación", "Evidencias"];

  useEffect(() => { fetchChecklists(); fetchWorkOrders(); }, []);

  async function fetchChecklists() {
    setLoading(true);
    const { data } = await supabase
      .from("checklists")
      .select(`*, work_orders(ot_number), vehicles(make, model, license_plate)`)
      .order("created_at", { ascending: false });
    if (data) setChecklists(data);
    setLoading(false);
  }

  async function fetchWorkOrders() {
    const { data } = await supabase
      .from("work_orders")
      .select("id, ot_number, vehicle_id, vehicles(make, model, license_plate)")
      .not("status", "in", '("Entregado","Cancelado")')
      .order("entry_date", { ascending: false });
    if (data) setWorkOrders(data);
  }

  function openNew() {
    setSelectedChecklist(null);
    setStep(1);
    setFormType("Recepción");
    setFormWorkOrderId("");
    setCustomItems([...BASE_RECEPTION_ITEMS]);
    setFormCheckedItems({});
    setEvidencePhotos([]);
    setFormNotes("");
    setIsOpen(true);
  }

  function openEdit(checklist: any) {
    setSelectedChecklist(checklist);
    setStep(1);
    setFormType(checklist.type);
    setFormWorkOrderId(checklist.work_order_id || "");
    const saved = checklist.custom_items as string[] | null;
    const base = checklist.type === "Recepción" ? BASE_RECEPTION_ITEMS : BASE_DELIVERY_ITEMS;
    setCustomItems(saved?.length ? saved : [...base]);
    setFormCheckedItems(checklist.checked_items || {});
    setEvidencePhotos(checklist.evidence_photos || []);
    setFormNotes(checklist.notes || "");
    setIsOpen(true);
  }

  function handleTypeChange(val: "Recepción" | "Entrega") {
    setFormType(val);
    setCustomItems(val === "Recepción" ? [...BASE_RECEPTION_ITEMS] : [...BASE_DELIVERY_ITEMS]);
    setFormCheckedItems({});
  }

  function canGoNext() {
    if (step === 1) return !!formWorkOrderId;
    if (step === 2) return customItems.length > 0;
    return true;
  }

  function goNext() { if (step < TOTAL_STEPS && canGoNext()) setStep(s => s + 1); }
  function goBack() { if (step > 1) setStep(s => s - 1); }

  function toggleItem(item: string) {
    setFormCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  }

  function addCustomItem() {
    if (!newItemText.trim()) return;
    setCustomItems(prev => [...prev, newItemText.trim()]);
    setNewItemText("");
  }

  function removeItem(item: string) {
    setCustomItems(prev => prev.filter(i => i !== item));
    setFormCheckedItems(prev => { const c = { ...prev }; delete c[item]; return c; });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingCategory(activeUploadCategory);
    const uploaded: EvidencePhoto[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `checklists/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("evidence").upload(path, file, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("evidence").getPublicUrl(path);
        uploaded.push({ url: urlData.publicUrl, name: file.name, category: activeUploadCategory });
      }
    }
    setEvidencePhotos(prev => [...prev, ...uploaded]);
    setUploadingCategory(null);
    toast({ title: `${uploaded.length} foto(s) subidas`, description: CATEGORY_LABELS[activeUploadCategory] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    setIsSubmitting(true);
    const wo = workOrders.find(w => w.id === formWorkOrderId);
    const allChecked = Object.values(formCheckedItems).filter(Boolean).length;
    const isCompleted = allChecked === customItems.length && customItems.length > 0;

    const payload = {
      type: formType,
      work_order_id: formWorkOrderId,
      vehicle_id: wo?.vehicle_id || null,
      vehicle_plate: wo?.vehicles?.license_plate || null,
      checked_items: formCheckedItems,
      custom_items: customItems,
      evidence_photos: evidencePhotos,
      notes: formNotes,
      completed: isCompleted,
    };

    let error;
    if (selectedChecklist) {
      ({ error } = await supabase.from("checklists").update(payload).eq("id", selectedChecklist.id));
    } else {
      ({ error } = await supabase.from("checklists").insert(payload));
    }

    if (error) {
      toast({ variant: "destructive", title: "Error al guardar", description: error.message });
    } else {
      toast({ title: selectedChecklist ? "Checklist actualizado" : "Checklist creado ✓" });
      setIsOpen(false);
      fetchChecklists();
    }
    setIsSubmitting(false);
  }

  const completedCount = checklists.filter(c => c.completed).length;
  const pendingCount = checklists.filter(c => !c.completed).length;
  const checkedItemsCount = Object.values(formCheckedItems).filter(Boolean).length;
  const progressPct = customItems.length > 0 ? Math.round((checkedItemsCount / customItems.length) * 100) : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Checklists de Recepción y Entrega">
        <Button onClick={openNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Checklist
        </Button>
      </DashboardHeader>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Checklists", value: checklists.length, icon: FileText, color: "" },
            { label: "Completados", value: completedCount, icon: CheckSquare, color: "text-green-500" },
            { label: "Pendientes", value: pendingCount, icon: ClipboardX, color: "text-amber-500" },
          ].map(k => (
            <Card key={k.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{k.label}</CardTitle>
                <k.icon className={`h-4 w-4 ${k.color || "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${k.color}`}>{loading ? "..." : k.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-56" />)}
          </div>
        ) : checklists.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold">No hay checklists registrados</p>
              <p className="text-sm mt-1">Crea uno nuevo para registrar la recepción o entrega de un vehículo.</p>
              <Button className="mt-4" onClick={openNew}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Checklist</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {checklists.map(cl => {
              const items = (cl.custom_items as string[]) || (cl.type === "Recepción" ? BASE_RECEPTION_ITEMS : BASE_DELIVERY_ITEMS);
              const checked = Object.values(cl.checked_items || {}).filter(Boolean).length;
              const prog = items.length > 0 ? Math.round((checked / items.length) * 100) : 0;
              const photos = (cl.evidence_photos || []) as EvidencePhoto[];
              return (
                <Card key={cl.id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <Badge variant={cl.type === "Recepción" ? "default" : "secondary"} className="flex items-center gap-1">
                        {cl.type === "Recepción" ? <Truck className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                        {cl.type}
                      </Badge>
                      <Badge variant={cl.completed ? "outline" : "destructive"} className={cl.completed ? "border-green-500 text-green-500" : ""}>
                        {cl.completed ? "✓ Completo" : "Pendiente"}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-mono mt-2">
                      {cl.vehicle_plate || cl.vehicles?.license_plate || "Sin patente"}
                    </CardTitle>
                    <CardDescription>
                      {cl.vehicles ? `${cl.vehicles.make} ${cl.vehicles.model}` : "Vehículo no vinculado"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3">
                    <div className="text-xs text-muted-foreground">OT: <span className="font-medium">{cl.work_orders?.ot_number || "N/A"}</span></div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-semibold">{checked}/{items.length}</span>
                      </div>
                      <Progress value={prog} className="h-2" />
                    </div>
                    {photos.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Camera className="h-3 w-3" /><span>{photos.length} foto(s)</span>
                      </div>
                    )}
                    {cl.notes && <p className="text-xs text-muted-foreground italic line-clamp-2">"{cl.notes}"</p>}
                    <p className="text-xs text-muted-foreground">{new Date(cl.created_at).toLocaleString("es-CL")}</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => openEdit(cl)}>Ver / Editar</Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* ================================================================
          SHEET WIZARD — Panel lateral con pasos
      ================================================================ */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl flex flex-col p-0 gap-0"
        >
          {/* Header fijo */}
          <div className="px-6 pt-6 pb-4 border-b bg-background/95 backdrop-blur-sm">
            <SheetHeader className="mb-4">
              <SheetTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                {selectedChecklist ? "Editar Checklist" : "Nuevo Checklist"}
              </SheetTitle>
              <SheetDescription>
                Completa cada paso para registrar la verificación del vehículo.
              </SheetDescription>
            </SheetHeader>
            <StepIndicator current={step} total={TOTAL_STEPS} labels={STEP_LABELS} />
          </div>

          {/* Contenido scrolleable — 1 solo scroll, sin anidación */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-5 space-y-6">

              {/* ──────────────────── PASO 1: Configuración ──────────────────── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold mb-1">Tipo de Checklist</h3>
                    <p className="text-sm text-muted-foreground mb-3">¿El vehículo está ingresando o siendo entregado?</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(["Recepción", "Entrega"] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => handleTypeChange(type)}
                          className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                            formType === type
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/40 text-muted-foreground"
                          }`}
                        >
                          {type === "Recepción"
                            ? <Truck className="h-8 w-8" />
                            : <Car className="h-8 w-8" />
                          }
                          <span className="font-semibold">{type}</span>
                          <span className="text-xs opacity-70">{type === "Recepción" ? "Ingreso al taller" : "Salida del taller"}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-base font-semibold mb-1">Orden de Trabajo</h3>
                    <p className="text-sm text-muted-foreground mb-3">Vincula este checklist a una OT activa.</p>
                    <Select value={formWorkOrderId} onValueChange={setFormWorkOrderId}>
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder="Seleccionar OT activa..." />
                      </SelectTrigger>
                      <SelectContent>
                        {workOrders.map(wo => (
                          <SelectItem key={wo.id} value={wo.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{wo.ot_number || wo.id.slice(0, 8)}</span>
                              <span className="text-xs text-muted-foreground">
                                {wo.vehicles?.license_plate} — {wo.vehicles?.make} {wo.vehicles?.model}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {workOrders.length === 0 && (
                          <SelectItem value="__none__" disabled>No hay OTs activas</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {!formWorkOrderId && (
                      <p className="text-xs text-amber-400 mt-2">⚠ Debes seleccionar una OT para continuar.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ──────────────────── PASO 2: Ítems ──────────────────── */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">Ítems de Verificación — {formType}</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      Personaliza la lista según el modelo del vehículo. Marca cada ítem al revisarlo.
                    </p>
                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-secondary/50">
                      <div className="flex-1">
                        <Progress value={progressPct} className="h-2" />
                      </div>
                      <span className="text-sm font-bold text-primary whitespace-nowrap">
                        {checkedItemsCount}/{customItems.length}
                      </span>
                    </div>
                  </div>

                  {/* Items list — sin scroll extra, el Sheet ya scrollea */}
                  <div className="rounded-xl border divide-y overflow-hidden">
                    {customItems.map((item, idx) => (
                      <div
                        key={`${item}-${idx}`}
                        className={`flex items-center gap-3 px-4 py-3.5 group transition-colors cursor-pointer ${
                          formCheckedItems[item] ? "bg-primary/5" : "hover:bg-muted/40"
                        }`}
                        onClick={() => toggleItem(item)}
                      >
                        <Checkbox
                          checked={!!formCheckedItems[item]}
                          onCheckedChange={() => toggleItem(item)}
                          className="pointer-events-none"
                        />
                        <span className={`flex-1 text-sm ${formCheckedItems[item] ? "line-through text-muted-foreground" : ""}`}>
                          {item}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); removeItem(item); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {customItems.length === 0 && (
                      <div className="px-4 py-10 text-center text-muted-foreground text-sm">
                        Agrega ítems usando el campo de abajo.
                      </div>
                    )}
                  </div>

                  {/* Add item */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Agregar ítem personalizado..."
                      value={newItemText}
                      onChange={e => setNewItemText(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomItem(); } }}
                    />
                    <Button type="button" variant="outline" onClick={addCustomItem} disabled={!newItemText.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ──────────────────── PASO 3: Evidencias + Notas ──────────────────── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <Camera className="h-5 w-5 text-primary" /> Evidencia Fotográfica
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sube fotos del vehículo organizadas por etapa.
                    </p>

                    {/* Category tabs */}
                    <div className="flex gap-2 flex-wrap mb-4">
                      {(["ingreso", "trabajo", "salida"] as EvidenceCategory[]).map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveUploadCategory(cat)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                            activeUploadCategory === cat
                              ? CATEGORY_COLORS[cat]
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {CATEGORY_LABELS[cat]}
                          {evidencePhotos.filter(p => p.category === cat).length > 0 && (
                            <span className="ml-1.5 bg-primary/20 text-primary rounded-full px-1.5 py-0.5 text-[10px]">
                              {evidencePhotos.filter(p => p.category === cat).length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Upload button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 border-dashed"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingCategory !== null}
                    >
                      {uploadingCategory ? (
                        <span className="animate-pulse">Subiendo fotos...</span>
                      ) : (
                        <><Upload className="h-4 w-4 mr-2" /> Subir fotos de "{CATEGORY_LABELS[activeUploadCategory]}"</>
                      )}
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />

                    {/* Photo grids per category */}
                    <div className="mt-4 space-y-4">
                      {(["ingreso", "trabajo", "salida"] as EvidenceCategory[]).map(cat => {
                        const catPhotos = evidencePhotos.filter(p => p.category === cat);
                        if (catPhotos.length === 0) return null;
                        return (
                          <div key={cat}>
                            <p className={`text-xs font-semibold mb-2 px-2 py-0.5 rounded-full border inline-block ${CATEGORY_COLORS[cat]}`}>
                              {CATEGORY_LABELS[cat]} ({catPhotos.length})
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {catPhotos.map(photo => (
                                <div key={photo.url} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-secondary">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setEvidencePhotos(prev => prev.filter(p => p.url !== photo.url))}
                                    className="absolute top-1 right-1 bg-black/70 hover:bg-destructive rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <Trash2 className="h-3 w-3 text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {evidencePhotos.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Aún no hay fotos adjuntas.</p>
                          <p className="text-xs mt-1 opacity-60">Selecciona una categoría y haz clic en "Subir fotos".</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Notes */}
                  <div>
                    <Label className="text-base font-semibold">Observaciones adicionales</Label>
                    <p className="text-sm text-muted-foreground mb-3">Rayones, objetos de valor, estado especial del vehículo, etc.</p>
                    <Textarea
                      placeholder="Ej: Cliente dejó objetos de valor, hay rayón en puerta trasera derecha..."
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {/* Summary antes de guardar */}
                  <div className="rounded-xl bg-secondary/50 p-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground">Resumen del checklist</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>Tipo:</span><span className="font-medium text-foreground">{formType}</span>
                      <span>OT:</span><span className="font-medium text-foreground">
                        {workOrders.find(w => w.id === formWorkOrderId)?.ot_number || "—"}
                      </span>
                      <span>Ítems verificados:</span><span className="font-medium text-foreground">{checkedItemsCount}/{customItems.length}</span>
                      <span>Fotos adjuntas:</span><span className="font-medium text-foreground">{evidencePhotos.length}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </ScrollArea>

          {/* Footer fijo con navegación */}
          <div className="px-6 py-4 border-t bg-background flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={step === 1 ? () => setIsOpen(false) : goBack}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {step === 1 ? "Cancelar" : <><ChevronLeft className="h-4 w-4 mr-1" /> Atrás</>}
            </Button>

            <div className="flex-1 flex justify-center gap-1">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i + 1 === step ? "bg-primary w-6" : i + 1 < step ? "bg-primary/50 w-3" : "bg-border w-3"
                  }`}
                />
              ))}
            </div>

            {step < TOTAL_STEPS ? (
              <Button
                onClick={goNext}
                disabled={!canGoNext()}
                className="min-w-[120px]"
              >
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? "Guardando..." : selectedChecklist ? "Guardar cambios" : "Crear Checklist"}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
