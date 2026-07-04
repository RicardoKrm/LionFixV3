"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, ArrowLeft, Download, PenTool, Car, User, Wrench, Package, Briefcase, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SignatureCanvas from "react-signature-canvas";

export default function NewProQuotePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [workshop, setWorkshop] = useState<any>({ name: "", manager: "", phone: "", address: "" });

  const [clientId, setClientId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [diagnostics, setDiagnostics] = useState({
    mainFailure: "",
    failureStart: "",
    failureType: "",
    entryCondition: "",
    notes: ""
  });

  const [services, setServices] = useState<{ desc: string; price: number }[]>([]);
  const [parts, setParts] = useState<{ concept: string; qty: number; price: number }[]>([]);
  const [labor, setLabor] = useState<{ desc: string; price: number }[]>([]);

  const [terms, setTerms] = useState(
    "1. Este presupuesto es informativo y tiene vigencia de 15 días naturales.\n" +
    "2. Para iniciar trabajos se requiere un anticipo mínimo del 50%.\n" +
    "3. La mano de obra cuenta con garantía de 30 días.\n" +
    "4. Toda modificación al presupuesto será notificada y autorizada antes de continuar.\n" +
    "5. El taller no se hace responsable por objetos de valor olvidados."
  );

  const [advancePayment, setAdvancePayment] = useState(0);
  const signatureRef = useRef<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    const [{ data: cData }, { data: vData }, { data: wData }] = await Promise.all([
      supabase.from("clients").select("*").order("name"),
      supabase.from("vehicles").select("*"),
      supabase.from("workshop_settings").select("*").limit(1).single()
    ]);
    if (cData) setClients(cData);
    if (vData) setVehicles(vData);
    if (wData) setWorkshop(wData);
  }

  const selectedClient = clients.find(c => c.id === clientId);
  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  const clientVehicles = vehicles.filter(v => v.client_id === clientId);

  const totalServices = services.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const totalParts = parts.reduce((acc, curr) => acc + ((curr.qty || 0) * (curr.price || 0)), 0);
  const totalLabor = labor.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const grandTotal = totalServices + totalParts + totalLabor;
  const remaining = grandTotal - advancePayment;

  const handleSave = async () => {
    if (!clientId || !vehicleId) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Selecciona cliente y vehículo." });
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Generate Quote Number
      const year = new Date().getFullYear();
      const { count } = await supabase.from("quotes").select("*", { count: "exact", head: true });
      const quoteNumber = `PRO-${year}-${String((count || 0) + 1).padStart(3, "0")}`;

      const signatureData = signatureRef.current?.isEmpty() ? null : signatureRef.current?.toDataURL();

      // 2. Insert Quote
      const { data: newQuote, error: qError } = await supabase.from("quotes").insert({
        quote_number: quoteNumber,
        client_id: clientId,
        vehicle_id: vehicleId,
        status: "Borrador",
        total: grandTotal,
        advance_payment: advancePayment,
        terms_and_conditions: terms,
        diagnostics_main_failure: diagnostics.mainFailure,
        diagnostics_failure_start: diagnostics.failureStart,
        diagnostics_failure_type: diagnostics.failureType,
        diagnostics_entry_condition: diagnostics.entryCondition,
        diagnostics_notes: diagnostics.notes,
        signature_data_url: signatureData,
      }).select().single();

      if (qError) throw qError;

      // 3. Insert Items
      const allItems = [
        ...services.map(s => ({ quote_id: newQuote.id, category: 'servicio', description: s.desc, quantity: 1, unit_price: s.price, total: s.price })),
        ...parts.map(p => ({ quote_id: newQuote.id, category: 'refaccion', description: p.concept, quantity: p.qty, unit_price: p.price, total: p.qty * p.price })),
        ...labor.map(l => ({ quote_id: newQuote.id, category: 'mano_obra', description: l.desc, quantity: 1, unit_price: l.price, total: l.price }))
      ];

      if (allItems.length > 0) {
        const { error: iError } = await supabase.from("quote_items").insert(allItems);
        if (iError) throw iError;
      }

      toast({ title: "Presupuesto Guardado", description: `Se ha guardado ${quoteNumber}` });
      router.push(`/dashboard/finance/quotes/${newQuote.id}`);

    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Nuevo Presupuesto Pro">
        <Button variant="ghost" onClick={() => router.push("/dashboard/finance/quotes")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </DashboardHeader>

      <main className="flex-1 p-6 overflow-y-auto bg-muted/20">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* TALLER */}
          <Card>
            <CardHeader className="bg-slate-900 text-white rounded-t-lg py-3 flex flex-row items-center space-x-3">
              <Briefcase className="w-5 h-5 text-sky-400" />
              <CardTitle className="text-lg">PERFIL PROFESIONAL DEL TALLER</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Taller</Label>
                <Input value={workshop.name || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Encargado</Label>
                <Input value={workshop.manager || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={workshop.phone || ''} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input value={workshop.address || ''} readOnly className="bg-muted" />
              </div>
            </CardContent>
          </Card>

          {/* CLIENTE Y VEHICULO */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader className="bg-slate-900 text-white rounded-t-lg py-3 flex flex-row items-center space-x-3">
                <User className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-lg">DATOS DEL CLIENTE</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Seleccionar Cliente</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {selectedClient && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Teléfono</Label><Input value={selectedClient.phone || ''} readOnly className="bg-muted"/></div>
                      <div className="space-y-2"><Label>Email</Label><Input value={selectedClient.email || ''} readOnly className="bg-muted"/></div>
                    </div>
                    <div className="space-y-2"><Label>Domicilio</Label><Input value={selectedClient.address || ''} readOnly className="bg-muted"/></div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-slate-900 text-white rounded-t-lg py-3 flex flex-row items-center space-x-3">
                <Car className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-lg">DATOS DEL VEHÍCULO</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Seleccionar Vehículo</Label>
                  <Select value={vehicleId} onValueChange={setVehicleId} disabled={!clientId}>
                    <SelectTrigger><SelectValue placeholder="Seleccione Marca..." /></SelectTrigger>
                    <SelectContent>
                      {clientVehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {selectedVehicle && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Color</Label><Input value={selectedVehicle.color || ''} readOnly className="bg-muted"/></div>
                    <div className="space-y-2"><Label>Placas</Label><Input value={selectedVehicle.license_plate || ''} readOnly className="bg-muted"/></div>
                    <div className="space-y-2"><Label>Kilometraje</Label><Input value={selectedVehicle.mileage || ''} readOnly className="bg-muted"/></div>
                    <div className="space-y-2"><Label>Año</Label><Input value={selectedVehicle.year || ''} readOnly className="bg-muted"/></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* DIAGNOSTICO */}
          <Card>
            <CardHeader className="bg-slate-900 text-white rounded-t-lg py-3 flex flex-row items-center space-x-3">
              <FileText className="w-5 h-5 text-sky-400" />
              <CardTitle className="text-lg">DIAGNÓSTICO INICIAL / MOTIVO DE INGRESO</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Falla principal reportada por el cliente:</Label>
                <Textarea value={diagnostics.mainFailure} onChange={e => setDiagnostics({...diagnostics, mainFailure: e.target.value})} placeholder="Ej. Pérdida de potencia al acelerar..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>¿Desde cuándo inició?</Label><Input value={diagnostics.failureStart} onChange={e => setDiagnostics({...diagnostics, failureStart: e.target.value})} placeholder="Ej. Hace 2 semanas" /></div>
                <div className="space-y-2">
                  <Label>Tipo de falla</Label>
                  <Select value={diagnostics.failureType} onValueChange={v => setDiagnostics({...diagnostics, failureType: v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mecánica">Mecánica</SelectItem>
                      <SelectItem value="Eléctrica">Eléctrica</SelectItem>
                      <SelectItem value="Preventiva">Preventiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condición de ingreso</Label>
                  <Select value={diagnostics.entryCondition} onValueChange={v => setDiagnostics({...diagnostics, entryCondition: v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Llegó andando">Llegó andando</SelectItem>
                      <SelectItem value="Llegó en grúa">Llegó en grúa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observaciones / Diagnóstico previo del técnico:</Label>
                <Textarea value={diagnostics.notes} onChange={e => setDiagnostics({...diagnostics, notes: e.target.value})} placeholder="Notas internas, códigos OBD..." />
              </div>
            </CardContent>
          </Card>

          {/* SERVICIOS */}
          <Card>
            <CardHeader className="bg-slate-900 text-white rounded-t-lg py-3 flex flex-row justify-between items-center">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-lg">1. SERVICIOS - PAQUETES Y DIAGNÓSTICOS</CardTitle>
              </div>
              <div className="bg-white text-black px-4 py-1 rounded font-bold">${totalServices.toLocaleString('es-CL')}</div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {services.map((svc, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Input className="flex-1" placeholder="Descripción" value={svc.desc} onChange={e => {
                    const n = [...services]; n[i].desc = e.target.value; setServices(n);
                  }} />
                  <Input type="number" className="w-32" placeholder="$" value={svc.price || ''} onChange={e => {
                    const n = [...services]; n[i].price = Number(e.target.value); setServices(n);
                  }} />
                  <Button variant="destructive" size="icon" onClick={() => setServices(services.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4"/></Button>
                </div>
              ))}
              <Button onClick={() => setServices([...services, { desc: "", price: 0 }])} className="w-full" variant="outline"><PlusCircle className="mr-2 w-4 h-4"/> AGREGAR SERVICIO</Button>
            </CardContent>
          </Card>

          {/* REFACCIONES */}
          <Card>
            <CardHeader className="bg-slate-900 text-white rounded-t-lg py-3 flex flex-row justify-between items-center">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-lg">2. REFACCIONES Y MATERIALES</CardTitle>
              </div>
              <div className="bg-white text-black px-4 py-1 rounded font-bold">${totalParts.toLocaleString('es-CL')}</div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {parts.map((p, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Input className="flex-1" placeholder="Concepto" value={p.concept} onChange={e => {
                    const n = [...parts]; n[i].concept = e.target.value; setParts(n);
                  }} />
                  <Input type="number" className="w-24" placeholder="Cant." value={p.qty || ''} onChange={e => {
                    const n = [...parts]; n[i].qty = Number(e.target.value); setParts(n);
                  }} />
                  <Input type="number" className="w-32" placeholder="$ Costo U." value={p.price || ''} onChange={e => {
                    const n = [...parts]; n[i].price = Number(e.target.value); setParts(n);
                  }} />
                  <div className="w-32 font-bold px-3 py-2 bg-muted rounded border flex items-center justify-center">${(p.qty * p.price).toLocaleString('es-CL')}</div>
                  <Button variant="destructive" size="icon" onClick={() => setParts(parts.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4"/></Button>
                </div>
              ))}
              <Button onClick={() => setParts([...parts, { concept: "", qty: 1, price: 0 }])} className="w-full" variant="outline"><PlusCircle className="mr-2 w-4 h-4"/> AGREGAR REFACCIÓN</Button>
            </CardContent>
          </Card>

          {/* MANO DE OBRA */}
          <Card>
            <CardHeader className="bg-slate-900 text-white rounded-t-lg py-3 flex flex-row justify-between items-center">
              <div className="flex items-center space-x-3">
                <Wrench className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-lg">3. MANO DE OBRA - REPARACIONES</CardTitle>
              </div>
              <div className="bg-white text-black px-4 py-1 rounded font-bold">${totalLabor.toLocaleString('es-CL')}</div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {labor.map((l, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Input className="flex-1" placeholder="Descripción" value={l.desc} onChange={e => {
                    const n = [...labor]; n[i].desc = e.target.value; setLabor(n);
                  }} />
                  <Input type="number" className="w-32" placeholder="$" value={l.price || ''} onChange={e => {
                    const n = [...labor]; n[i].price = Number(e.target.value); setLabor(n);
                  }} />
                  <Button variant="destructive" size="icon" onClick={() => setLabor(labor.filter((_, idx) => idx !== i))}><Trash2 className="w-4 h-4"/></Button>
                </div>
              ))}
              <Button onClick={() => setLabor([...labor, { desc: "", price: 0 }])} className="w-full" variant="outline"><PlusCircle className="mr-2 w-4 h-4"/> AGREGAR MANO DE OBRA</Button>
            </CardContent>
          </Card>

          {/* TERMINOS Y CONDICIONES */}
          <Card>
            <CardHeader className="bg-slate-900 text-white rounded-t-lg py-3 flex flex-row items-center space-x-3">
              <FileText className="w-5 h-5 text-sky-400" />
              <CardTitle className="text-lg">4. TÉRMINOS Y CONDICIONES</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Textarea className="h-40" value={terms} onChange={e => setTerms(e.target.value)} />
            </CardContent>
          </Card>

          {/* FIRMA */}
          <Card>
            <CardHeader className="bg-slate-900 text-white rounded-t-lg py-3 flex flex-row justify-between items-center">
              <div className="flex items-center space-x-3">
                <PenTool className="w-5 h-5 text-sky-400" />
                <CardTitle className="text-lg">5. FIRMA DEL ENCARGADO</CardTitle>
              </div>
              <Button variant="secondary" size="sm" onClick={() => signatureRef.current?.clear()}>Limpiar</Button>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              <p className="text-sm text-muted-foreground mb-4">Firma de quien ofrece el presupuesto. Dibuja con el mouse o dedo.</p>
              <div className="border bg-white rounded-lg p-2">
                <SignatureCanvas ref={signatureRef} penColor="black" canvasProps={{ width: 500, height: 150, className: 'sigCanvas' }} />
              </div>
            </CardContent>
          </Card>

          {/* RESUMEN FINANCIERO */}
          <Card className="border-t-4 border-t-sky-500">
            <CardHeader className="bg-slate-50 text-slate-900 rounded-t-lg py-3">
              <CardTitle className="text-xl">RESUMEN FINANCIERO</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="border rounded p-4 text-center">
                  <p className="text-xs text-muted-foreground font-bold mb-1">SERVICIOS</p>
                  <p className="text-2xl font-bold">${totalServices.toLocaleString('es-CL')}</p>
                </div>
                <div className="border rounded p-4 text-center">
                  <p className="text-xs text-muted-foreground font-bold mb-1">REFACCIONES</p>
                  <p className="text-2xl font-bold">${totalParts.toLocaleString('es-CL')}</p>
                </div>
                <div className="border rounded p-4 text-center">
                  <p className="text-xs text-muted-foreground font-bold mb-1">MANO DE OBRA</p>
                  <p className="text-2xl font-bold">${totalLabor.toLocaleString('es-CL')}</p>
                </div>
              </div>
              <div className="bg-slate-900 text-white rounded-lg p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold opacity-70">TOTAL PRESUPUESTO</p>
                  <p className="text-4xl font-black">${grandTotal.toLocaleString('es-CL')}</p>
                </div>
                <div>
                  <p className="text-sm font-bold opacity-70">ANTICIPO / A CUENTA</p>
                  <Input type="number" className="bg-slate-800 border-none text-xl w-40 mt-1 h-12" value={advancePayment || ''} onChange={e => setAdvancePayment(Number(e.target.value))} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-sky-400">RESTANTE POR PAGAR</p>
                  <p className="text-3xl font-black text-sky-400">${remaining.toLocaleString('es-CL')}</p>
                </div>
              </div>

              <div className="mt-6">
                <Button className="w-full h-14 text-lg bg-sky-600 hover:bg-sky-700 text-white" disabled={isSubmitting} onClick={handleSave}>
                  {isSubmitting ? "Guardando..." : "GUARDAR Y CONTINUAR"}
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
