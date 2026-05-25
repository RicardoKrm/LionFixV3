"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, FileText, Download } from "lucide-react";
import Image from "next/image";

export default function PublicQuotePage() {
  const { id } = useParams();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuote() {
      if (!id) return;
      const { data, error } = await supabase
        .from("quotes")
        .select(`
          *,
          clients(name, email, phone, rut),
          vehicles(make, model, license_plate, year)
        `)
        .eq("id", id)
        .single();
        
      if (data) {
        setQuote(data);
      }
      setLoading(false);
    }
    fetchQuote();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Cargando cotización...</div>;
  }

  if (!quote) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Cotización no encontrada o enlace inválido.</div>;
  }

  const isPending = quote.status === "Enviada" || quote.status === "Pendiente";

  return (
    <div className="min-h-screen bg-background/50 text-foreground py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo2.png" alt="LionFix Service" width={100} height={50} className="object-contain" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold">Cotización #{quote.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-sm text-muted-foreground">{new Date(quote.created_at).toLocaleDateString('es-CL')}</p>
          </div>
        </div>

        {/* Status Alert */}
        {quote.status === "Aprobada" && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-bold">Cotización Aprobada</p>
              <p className="text-sm opacity-90">Gracias por tu confianza. Nos contactaremos pronto para agendar el ingreso.</p>
            </div>
          </div>
        )}
        
        {quote.status === "Rechazada" && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3">
            <XCircle className="w-5 h-5" />
            <div>
              <p className="font-bold">Cotización Rechazada</p>
              <p className="text-sm opacity-90">Entendemos. Si cambias de opinión, no dudes en contactarnos.</p>
            </div>
          </div>
        )}

        {/* Content */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="border-b border-border/30 bg-card/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Datos del Cliente</h3>
                <p className="font-medium">{quote.clients?.name}</p>
                <p className="text-sm text-muted-foreground">{quote.clients?.email}</p>
                <p className="text-sm text-muted-foreground">{quote.clients?.phone}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Vehículo</h3>
                <p className="font-medium">{quote.vehicles?.make} {quote.vehicles?.model} ({quote.vehicles?.year || 'N/A'})</p>
                <p className="text-sm font-mono text-muted-foreground">Patente: {quote.vehicles?.license_plate}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Detalle de Servicios y Repuestos
              </h3>
              
              <div className="space-y-4">
                {quote.items && quote.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{item.description}</p>
                      <p className="text-xs text-muted-foreground">Cant: {item.quantity} x ${item.unit_price?.toLocaleString('es-CL')}</p>
                    </div>
                    <p className="font-semibold text-sm">${(item.quantity * item.unit_price).toLocaleString('es-CL')}</p>
                  </div>
                ))}
              </div>

              {quote.notes && (
                <div className="mt-6 p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground border border-border/50">
                  <strong>Notas del Taller:</strong><br/>
                  {quote.notes}
                </div>
              )}
            </div>

            <div className="bg-muted/10 p-6 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
               <div>
                  <p className="text-sm text-muted-foreground">Total Presupuestado (CLP)</p>
                  <p className="text-4xl font-bold text-primary">${(quote.total || 0).toLocaleString('es-CL')}</p>
               </div>
               
               {isPending && (
                  <div className="flex flex-col gap-2 items-center text-center">
                     <p className="text-xs text-muted-foreground max-w-xs">Para aprobar, responde <strong>1</strong> en el mensaje de WhatsApp que te enviamos.</p>
                     <p className="text-xs text-muted-foreground max-w-xs">Para rechazar, responde <strong>2</strong>.</p>
                  </div>
               )}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-center mt-8">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
               <Download className="w-4 h-4" />
               Descargar PDF
            </Button>
        </div>

      </div>
    </div>
  );
}
