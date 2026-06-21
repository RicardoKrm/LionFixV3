"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, XCircle, FileText, Download, ThumbsUp, ThumbsDown } from "lucide-react";
import Image from "next/image";

export default function PublicQuotePage() {
  const { id } = useParams();
  const [quote, setQuote] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchQuote() {
      if (!id) return;
      const { data } = await supabase
        .from("quotes")
        .select(`*, clients(name, email, phone), vehicles(make, model, license_plate, year)`)
        .eq("id", id)
        .single();

      if (data) {
        setQuote(data);
        // Load items from quote_items table
        const { data: itemData } = await supabase
          .from("quote_items")
          .select("*")
          .eq("quote_id", id);
        // Also check items stored in JSONB field as fallback
        const quoteItems = (itemData && itemData.length > 0)
          ? itemData
          : (Array.isArray(data.items) ? data.items : []);
        setItems(quoteItems);
      }
      setLoading(false);
    }
    fetchQuote();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    const { error } = await supabase
      .from("quotes")
      .update({ status: "Aprobada" })
      .eq("id", id);
    if (!error) setQuote({ ...quote, status: "Aprobada" });
    setActionLoading(false);
  };

  const handleReject = async () => {
    setActionLoading(true);
    const { error } = await supabase
      .from("quotes")
      .update({ status: "Rechazada" })
      .eq("id", id);
    if (!error) setQuote({ ...quote, status: "Rechazada" });
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando cotización...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Cotización no encontrada</h2>
          <p className="text-muted-foreground mt-2">El enlace puede haber expirado o ser inválido.</p>
        </div>
      </div>
    );
  }

  const isPending = quote.status === "Enviada" || quote.status === "Pendiente";
  const isApproved = quote.status === "Aprobada";
  const isRejected = quote.status === "Rechazada";

  return (
    <div className="min-h-screen bg-background/50 text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo2.png" alt="LionFix Service" width={110} height={55} className="object-contain" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-primary">
              {quote.quote_number || `COT-${quote.id.slice(0, 8).toUpperCase()}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              Emitida el {new Date(quote.created_at).toLocaleDateString("es-CL")}
            </p>
          </div>
        </div>

        {/* Status banner */}
        {isApproved && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-base">¡Cotización Aprobada! ✅</p>
              <p className="text-sm opacity-90">Gracias por tu confianza. Nos contactaremos para coordinar el ingreso de tu vehículo.</p>
            </div>
          </div>
        )}
        {isRejected && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <XCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-base">Cotización Rechazada</p>
              <p className="text-sm opacity-90">Entendemos. Si cambias de opinión, contáctanos directamente.</p>
            </div>
          </div>
        )}

        {/* Main card */}
        <Card className="shadow-lg border-border/50">
          {/* Client & vehicle info */}
          <CardHeader className="border-b border-border/30 bg-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Cliente</h3>
                <p className="font-semibold">{quote.clients?.name}</p>
                <p className="text-sm text-muted-foreground">{quote.clients?.email}</p>
                <p className="text-sm text-muted-foreground">{quote.clients?.phone}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Vehículo</h3>
                <p className="font-semibold">{quote.vehicles?.make} {quote.vehicles?.model} ({quote.vehicles?.year || "N/A"})</p>
                <p className="text-sm font-mono text-muted-foreground uppercase">Patente: {quote.vehicles?.license_plate}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Items */}
            <div className="p-6">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Detalle del Presupuesto
              </h3>

              {items.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-semibold">Descripción</th>
                        <th className="text-center p-3 font-semibold w-20">Cant.</th>
                        <th className="text-right p-3 font-semibold w-32">P. Unit.</th>
                        <th className="text-right p-3 font-semibold w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any, idx: number) => {
                        const unitPrice = item.unit_price ?? item.unitPrice ?? 0;
                        const qty = item.quantity ?? 1;
                        const rowTotal = item.total ?? (qty * unitPrice);
                        return (
                          <tr key={idx} className="border-t border-border/40">
                            <td className="p-3">{item.description}</td>
                            <td className="p-3 text-center">{qty}</td>
                            <td className="p-3 text-right">${unitPrice.toLocaleString("es-CL")}</td>
                            <td className="p-3 text-right font-semibold">${rowTotal.toLocaleString("es-CL")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-6 border border-dashed rounded-lg">
                  Sin ítems detallados en esta cotización.
                </p>
              )}

              {quote.notes && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground border border-border/50">
                  <strong>Notas del Taller:</strong><br />
                  {quote.notes}
                </div>
              )}
            </div>

            {/* Total + Action buttons */}
            <div className="bg-muted/10 p-6 border-t border-border/30">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Presupuestado (CLP)</p>
                  <p className="text-4xl font-bold text-primary">${(quote.total || 0).toLocaleString("es-CL")}</p>
                </div>

                {isPending && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-base px-6 py-3"
                    >
                      <ThumbsUp className="w-5 h-5" />
                      {actionLoading ? "Procesando..." : "Aprobar Presupuesto"}
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={actionLoading}
                      variant="destructive"
                      className="gap-2 text-base px-6 py-3"
                    >
                      <ThumbsDown className="w-5 h-5" />
                      {actionLoading ? "Procesando..." : "Rechazar"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download PDF */}
        <div className="flex justify-center pb-8">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Download className="w-4 h-4" />
            Guardar como PDF
          </Button>
        </div>

      </div>
    </div>
  );
}
