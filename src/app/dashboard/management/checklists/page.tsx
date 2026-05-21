"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  PlusCircle, FileText, CheckSquare, Truck, ClipboardCheck,
  ClipboardX, Car, X, Camera, Upload, Trash2, Plus, ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// Items base SUGERIDOS (editables/eliminables por el usuario)
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

interface EvidencePhoto {
  url: string;
  name: string;
  category: EvidenceCategory;
}

export default function ChecklistsPage() {
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<any[]>([]);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formType, setFormType] = useState<"Recepción" | "Entrega">("Recepción");
  const [formWorkOrderId, setFormWorkOrderId] = useState("");
  const [formCheckedItems, setFormCheckedItems] = useState<Record<string, boolean>>({});
  const [formNotes, setFormNotes] = useState("");

  // Dynamic items state
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState("");

  // Evidence photos state
  const [evidencePhotos, setEvidencePhotos] = useState<EvidencePhoto[]>([]);
  const [uploadingCategory, setUploadingCategory] = useState<EvidenceCategory | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadCategory, setActiveUploadCategory] = useState<EvidenceCategory>("ingreso");

  useEffect(() => {
    fetchChecklists();
    fetchWorkOrders();
  }, []);

  async function fetchChecklists() {
    setLoading(true);
    const { data, error } = await supabase
      .from("checklists")
      .select(`*, work_orders(ot_number, service_description), vehicles(make, model, license_plate)`)
      .order("created_at", { ascending: false });
    if (data && !error) setChecklists(data);
    setLoading(false);
  }

  async function fetchWorkOrders() {
    const { data } = await supabase
      .from("work_orders")
      .select("id, ot_number, service_description, vehicle_id, vehicles(make, model, license_plate)")
      .not("status", "in", '("Entregado","Cancelado")')
      .order("entry_date", { ascending: false });
    if (data) setWorkOrders(data);
  }

  function openNew() {
    setSelectedChecklist(null);
    setFormType("Recepción");
    setFormWorkOrderId("");
    const baseItems = BASE_RECEPTION_ITEMS;
    setCustomItems([...baseItems]);
    setFormCheckedItems({});
    setFormNotes("");
    setEvidencePhotos([]);
    setIsDialogOpen(true);
  }

  function openEdit(checklist: any) {
    setSelectedChecklist(checklist);
    setFormType(checklist.type);
    setFormWorkOrderId(checklist.work_order_id || "");
    // Load saved custom items or fall back to base
    const saved = checklist.custom_items as string[] | null;
    const base = checklist.type === "Recepción" ? BASE_RECEPTION_ITEMS : BASE_DELIVERY_ITEMS;
    setCustomItems(saved && saved.length > 0 ? saved : [...base]);
    setFormCheckedItems(checklist.checked_items || {});
    setFormNotes(checklist.notes || "");
    // Load saved evidence photos
    setEvidencePhotos(checklist.evidence_photos || []);
    setIsDialogOpen(true);
  }

  // Update base items when type changes
  function handleTypeChange(val: "Recepción" | "Entrega") {
    setFormType(val);
    setCustomItems(val === "Recepción" ? [...BASE_RECEPTION_ITEMS] : [...BASE_DELIVERY_ITEMS]);
    setFormCheckedItems({});
  }

  function toggleItem(item: string) {
    setFormCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  }

  function addCustomItem() {
    if (!newItemText.trim()) return;
    setCustomItems((prev) => [...prev, newItemText.trim()]);
    setNewItemText("");
  }

  function removeItem(item: string) {
    setCustomItems((prev) => prev.filter((i) => i !== item));
    setFormCheckedItems((prev) => {
      const copy = { ...prev };
      delete copy[item];
      return copy;
    });
  }

  // --- Evidence upload ---
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingCategory(activeUploadCategory);

    const uploadedPhotos: EvidencePhoto[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `checklists/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("evidence").upload(path, file, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("evidence").getPublicUrl(path);
        uploadedPhotos.push({ url: urlData.publicUrl, name: file.name, category: activeUploadCategory });
      }
    }

    setEvidencePhotos((prev) => [...prev, ...uploadedPhotos]);
    setUploadingCategory(null);

    toast({
      title: "Fotos subidas",
      description: `${uploadedPhotos.length} foto(s) añadidas a "${CATEGORY_LABELS[activeUploadCategory]}".`,
    });

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(photoUrl: string) {
    setEvidencePhotos((prev) => prev.filter((p) => p.url !== photoUrl));
  }

  const CATEGORY_LABELS: Record<EvidenceCategory, string> = {
    ingreso: "Ingreso al Taller",
    trabajo: "Trabajo Realizado",
    salida: "Salida del Taller",
  };

  const CATEGORY_COLORS: Record<EvidenceCategory, string> = {
    ingreso: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    trabajo: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    salida: "text-green-400 border-green-500/30 bg-green-500/10",
  };

  async function handleSave() {
    if (!formWorkOrderId) {
      toast({ variant: "destructive", title: "Error", description: "Debes seleccionar una Orden de Trabajo." });
      return;
    }
    setIsSubmitting(true);

    const wo = workOrders.find((w) => w.id === formWorkOrderId);
    const vehicleId = wo?.vehicle_id || null;
    const vehiclePlate = wo?.vehicles?.license_plate || null;

    const allChecked = Object.values(formCheckedItems).filter(Boolean).length;
    const isCompleted = allChecked === customItems.length && customItems.length > 0;

    const payload = {
      type: formType,
      work_order_id: formWorkOrderId,
      vehicle_id: vehicleId,
      vehicle_plate: vehiclePlate,
      checked_items: formCheckedItems,
      custom_items: customItems,        // Save the dynamic items list
      evidence_photos: evidencePhotos,  // Save evidence photos
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
      toast({
        title: selectedChecklist ? "Checklist actualizado" : "Checklist creado",
        description: `Checklist de ${formType} guardado correctamente.`,
      });
      setIsDialogOpen(false);
      fetchChecklists();
    }
    setIsSubmitting(false);
  }

  const completedCount = checklists.filter((c) => c.completed).length;
  const pendingCount = checklists.filter((c) => !c.completed).length;

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Checklists de Recepción y Entrega">
        <Button onClick={openNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Checklist
        </Button>
      </DashboardHeader>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Checklists</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : checklists.length}</div>
              <p className="text-xs text-muted-foreground">Registros totales</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <CheckSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{loading ? "..." : completedCount}</div>
              <p className="text-xs text-muted-foreground">Todos los ítems verificados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <ClipboardX className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{loading ? "..." : pendingCount}</div>
              <p className="text-xs text-muted-foreground">Con ítems sin verificar</p>
            </CardContent>
          </Card>
        </div>

        {/* Checklist Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-56" />)}
          </div>
        ) : checklists.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold">No hay checklists registrados</p>
              <p className="text-sm mt-1">Crea uno nuevo para registrar la recepción o entrega de un vehículo.</p>
              <Button className="mt-4" onClick={openNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Checklist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {checklists.map((checklist) => {
              const items = (checklist.custom_items as string[]) ||
                (checklist.type === "Recepción" ? BASE_RECEPTION_ITEMS : BASE_DELIVERY_ITEMS);
              const checkedCount = Object.values(checklist.checked_items || {}).filter(Boolean).length;
              const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;
              const isReception = checklist.type === "Recepción";
              const photos = (checklist.evidence_photos || []) as EvidencePhoto[];

              return (
                <Card key={checklist.id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      <Badge variant={isReception ? "default" : "secondary"} className="flex items-center gap-1">
                        {isReception ? <Truck className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                        {checklist.type}
                      </Badge>
                      <Badge
                        variant={checklist.completed ? "outline" : "destructive"}
                        className={checklist.completed ? "border-green-500 text-green-600" : ""}
                      >
                        {checklist.completed ? "✓ Completo" : "Pendiente"}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-mono mt-2">
                      {checklist.vehicle_plate || checklist.vehicles?.license_plate || "Sin patente"}
                    </CardTitle>
                    <CardDescription>
                      {checklist.vehicles
                        ? `${checklist.vehicles.make} ${checklist.vehicles.model}`
                        : "Vehículo no vinculado"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3">
                    <div className="text-xs text-muted-foreground">
                      OT: <span className="font-medium">{checklist.work_orders?.ot_number || "N/A"}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-semibold">{checkedCount}/{items.length} ítems</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${progress === 100 ? "bg-green-500" : "bg-primary"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    {photos.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Camera className="h-3 w-3" />
                        <span>{photos.length} foto(s) adjunta(s)</span>
                      </div>
                    )}
                    {checklist.notes && (
                      <p className="text-xs text-muted-foreground italic line-clamp-2">"{checklist.notes}"</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(checklist.created_at).toLocaleString("es-CL")}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => openEdit(checklist)}>
                      Ver / Editar
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* ================================================================
          DIALOG: New / Edit Checklist
      ================================================================ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedChecklist ? "Editar Checklist" : "Nuevo Checklist"}
            </DialogTitle>
            <DialogDescription>
              Configura los ítems según el modelo del vehículo, marca el estado y sube evidencias fotográficas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-2 pr-1">

            {/* ── Tipo + OT ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo de Checklist</Label>
                <Select value={formType} onValueChange={handleTypeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Recepción">
                      <div className="flex items-center gap-2"><Truck className="h-4 w-4" /> Recepción (Ingreso)</div>
                    </SelectItem>
                    <SelectItem value="Entrega">
                      <div className="flex items-center gap-2"><Car className="h-4 w-4" /> Entrega (Salida)</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Orden de Trabajo (OT)</Label>
                <Select value={formWorkOrderId} onValueChange={setFormWorkOrderId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar OT activa..." /></SelectTrigger>
                  <SelectContent>
                    {workOrders.map((wo) => (
                      <SelectItem key={wo.id} value={wo.id}>
                        {wo.ot_number || wo.id.slice(0, 8)} — {wo.vehicles?.license_plate} ({wo.vehicles?.make} {wo.vehicles?.model})
                      </SelectItem>
                    ))}
                    {workOrders.length === 0 && (
                      <SelectItem value="__none__" disabled>No hay OTs activas</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* ── Ítems dinámicos ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Ítems de Verificación — {formType}
                  <span className="ml-2 text-muted-foreground font-normal text-xs">
                    ({Object.values(formCheckedItems).filter(Boolean).length}/{customItems.length} completados)
                  </span>
                </Label>
                <span className="text-xs text-muted-foreground">Personalizable según modelo</span>
              </div>

              <div className="rounded-md border divide-y max-h-64 overflow-y-auto">
                {customItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 group"
                  >
                    <Checkbox
                      id={item}
                      checked={!!formCheckedItems[item]}
                      onCheckedChange={() => toggleItem(item)}
                    />
                    <Label
                      htmlFor={item}
                      className="cursor-pointer flex-1 text-sm"
                      onClick={() => toggleItem(item)}
                    >
                      {item}
                    </Label>
                    <button
                      onClick={() => removeItem(item)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                      title="Eliminar ítem"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {customItems.length === 0 && (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No hay ítems. Agrega uno abajo.
                  </div>
                )}
              </div>

              {/* Add custom item */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Revisión de correa de distribución, Sistema de frenos ABS..."
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomItem(); } }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addCustomItem} disabled={!newItemText.trim()}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>
            </div>

            <Separator />

            {/* ── Evidencia Fotográfica ── */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                Evidencia Fotográfica
              </Label>

              {/* Category selector + upload */}
              <div className="flex gap-2 flex-wrap">
                {(["ingreso", "trabajo", "salida"] as EvidenceCategory[]).map((cat) => (
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
                  </button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCategory !== null}
                  className="ml-auto"
                >
                  {uploadingCategory ? (
                    <span className="animate-pulse">Subiendo...</span>
                  ) : (
                    <><Upload className="h-3.5 w-3.5 mr-1.5" /> Subir fotos ({CATEGORY_LABELS[activeUploadCategory]})</>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Photo galleries per category */}
              {(["ingreso", "trabajo", "salida"] as EvidenceCategory[]).map((cat) => {
                const catPhotos = evidencePhotos.filter((p) => p.category === cat);
                if (catPhotos.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className={`text-xs font-semibold mb-2 ${CATEGORY_COLORS[cat]} inline-block px-2 py-0.5 rounded-full border`}>
                      {CATEGORY_LABELS[cat]} ({catPhotos.length})
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {catPhotos.map((photo) => (
                        <div key={photo.url} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-secondary">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.url)}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-destructive rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all"
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
                <div className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Selecciona una categoría y sube las fotos de evidencia.</p>
                  <p className="text-xs mt-0.5 opacity-70">Ingreso · Trabajo realizado · Salida del vehículo</p>
                </div>
              )}
            </div>

            <Separator />

            {/* ── Observaciones ── */}
            <div className="space-y-1.5">
              <Label>Observaciones adicionales</Label>
              <Textarea
                placeholder="Ej: Cliente dejó objetos de valor, hay rayón en puerta trasera derecha, etc."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : selectedChecklist ? "Guardar Cambios" : "Crear Checklist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
