"use client";

import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PdfQuoteGeneratorProps {
  quote: any;
  items: any[];
  workshop: any;
}

export function PdfQuoteGenerator({ quote, items, workshop }: PdfQuoteGeneratorProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const client = quote.clients || {};
  const vehicle = quote.vehicles || {};

  const services = items.filter(i => i.category === 'servicio');
  const parts = items.filter(i => i.category === 'refaccion');
  const labor = items.filter(i => i.category === 'mano_obra');

  const totalServices = services.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalParts = parts.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalLabor = labor.reduce((acc, curr) => acc + (curr.total || 0), 0);

  const remaining = (quote.total || 0) - (quote.advance_payment || 0);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    toast({ title: "Generando PDF", description: "Preparando documento..." });

    try {
      const element = printRef.current;
      // Temporarily show the element to capture it
      element.style.display = "block";
      
      const canvas = await html2canvas(element, { 
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: "#f8fafc" // slate-50
      });

      element.style.display = "none";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "letter");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // If the content is longer than one page, jsPDF can't auto-split well without addPage loop.
      // For simplicity, we just put it on one continuous page (or let it bleed if it's too long).
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Cotizacion_${quote.quote_number || quote.id.slice(0,8)}.pdf`);
      
      toast({ title: "¡PDF Descargado!", description: "El presupuesto ha sido descargado exitosamente." });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Error al generar PDF", description: e.message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button onClick={handleDownloadPdf} disabled={isGenerating} className="bg-amber-500 hover:bg-amber-700 text-white w-full sm:w-auto">
        <Download className="w-4 h-4 mr-2" /> 
        {isGenerating ? "Generando..." : "Descargar Cotizaci�n"}
      </Button>

      {/* HIDDEN PRINTABLE TEMPLATE (Aims to mimic the white/blue Pro Quote style) */}
      <div className="absolute top-[-10000px] left-[-10000px] w-[800px] bg-slate-50 overflow-hidden" ref={printRef} style={{ display: 'none' }}>
        <div className="p-8 font-sans text-slate-800">
          
          {/* HEADER */}
          <div className="bg-slate-900 text-white p-6 rounded-t-lg flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">🚘</div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">{workshop?.name?.toUpperCase() || 'TALLER MECÁNICO'}</h1>
                <p className="text-amber-400 text-sm tracking-widest font-semibold uppercase">COTIZACI�N</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-amber-500/20 px-3 py-1 rounded text-amber-400 font-bold mb-2 inline-block">FOLIO: {quote.quote_number || quote.id.slice(0,8)}</div>
              <p className="text-xs text-slate-400">FECHA: {new Date(quote.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center"><span className="bg-amber-100 text-amber-700 p-1 rounded mr-2">👤</span> CLIENTE</h2>
              <p className="font-bold text-lg">{client.name}</p>
              <p className="text-sm text-slate-500 mt-1">Tel: {client.phone}</p>
              <p className="text-sm text-slate-500">Email: {client.email}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center"><span className="bg-amber-100 text-amber-700 p-1 rounded mr-2">🚗</span> VEHÍCULO</h2>
              <p className="font-bold text-lg">{vehicle.make} {vehicle.model} - {vehicle.year}</p>
              <p className="text-sm text-slate-500 mt-1">Placas: {vehicle.license_plate}</p>
            </div>
          </div>

          {/* DIAGNOSTICS */}
          {quote.diagnostics_main_failure && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 mb-6">
               <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center"><span className="bg-red-100 text-red-700 p-1 rounded mr-2">🩺</span> DIAGNÓSTICO INICIAL</h2>
               <div className="bg-red-50 text-red-900 p-3 rounded text-sm mb-3 font-medium">Falla Reportada: {quote.diagnostics_main_failure}</div>
               <div className="grid grid-cols-2 text-xs text-slate-600">
                  <p><b>Desde:</b> {quote.diagnostics_failure_start}</p>
                  <p><b>Tipo:</b> {quote.diagnostics_failure_type}</p>
               </div>
               {quote.diagnostics_notes && (
                 <p className="text-xs text-slate-600 mt-3 pt-3 border-t"><b>Notas del Técnico:</b> {quote.diagnostics_notes}</p>
               )}
            </div>
          )}

          {/* ITEMS */}
          <div className="space-y-4 mb-6">
            {services.length > 0 && (
              <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
                <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
                  <span className="font-bold text-sm">1. SERVICIOS Y DIAGNÓSTICOS</span>
                  <span className="bg-white text-slate-900 px-2 py-0.5 rounded text-xs font-bold">${totalServices.toLocaleString('es-CL')}</span>
                </div>
                <div className="p-3">
                  {services.map((s, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0"><span className="text-slate-700">{s.description}</span><span className="font-bold">${s.total?.toLocaleString('es-CL')}</span></div>
                  ))}
                </div>
              </div>
            )}
            
            {parts.length > 0 && (
              <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
                <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
                  <span className="font-bold text-sm">2. REFACCIONES Y MATERIALES</span>
                  <span className="bg-white text-slate-900 px-2 py-0.5 rounded text-xs font-bold">${totalParts.toLocaleString('es-CL')}</span>
                </div>
                <div className="p-3">
                  {parts.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span className="text-slate-700">{p.description} <span className="text-xs text-slate-400 ml-2">x{p.quantity}</span></span>
                      <span className="font-bold">${p.total?.toLocaleString('es-CL')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {labor.length > 0 && (
              <div className="bg-white rounded-lg overflow-hidden border border-slate-200">
                <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
                  <span className="font-bold text-sm">3. MANO DE OBRA</span>
                  <span className="bg-white text-slate-900 px-2 py-0.5 rounded text-xs font-bold">${totalLabor.toLocaleString('es-CL')}</span>
                </div>
                <div className="p-3">
                  {labor.map((l, i) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0"><span className="text-slate-700">{l.description}</span><span className="font-bold">${l.total?.toLocaleString('es-CL')}</span></div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FINANCIAL SUMMARY */}
          <div className="bg-white rounded-lg p-6 shadow-sm border-t-4 border-t-amber-500 mb-6">
            <div className="grid grid-cols-3 text-center mb-6 border-b pb-4">
              <div><p className="text-xs text-slate-500 font-bold">SERVICIOS</p><p className="font-bold">${totalServices.toLocaleString('es-CL')}</p></div>
              <div><p className="text-xs text-slate-500 font-bold">REFACCIONES</p><p className="font-bold">${totalParts.toLocaleString('es-CL')}</p></div>
              <div><p className="text-xs text-slate-500 font-bold">MANO DE OBRA</p><p className="font-bold">${totalLabor.toLocaleString('es-CL')}</p></div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1">TOTAL PRESUPUESTO</p>
                <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-2xl font-black">${(quote.total || 0).toLocaleString('es-CL')}</div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold mb-1 text-center">ANTICIPO</p>
                <div className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-lg font-bold">${(quote.advance_payment || 0).toLocaleString('es-CL')}</div>
              </div>
              <div className="text-right">
                <p className="text-xs text-amber-500 font-bold mb-1">RESTANTE POR PAGAR</p>
                <div className="text-3xl font-black text-amber-500">${remaining.toLocaleString('es-CL')}</div>
              </div>
            </div>
          </div>

          {/* TERMS & SIGNATURE */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 text-xs text-slate-600">
               <h2 className="text-sm font-bold text-slate-900 mb-2">Términos y Condiciones</h2>
               <div className="whitespace-pre-line leading-relaxed">{quote.terms_and_conditions}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 flex flex-col items-center justify-center">
              <h2 className="text-sm font-bold text-slate-900 mb-4 self-start">Firma de Aprobación</h2>
              {quote.signature_data_url ? (
                <img src={quote.signature_data_url} alt="Firma" className="max-h-24 object-contain" />
              ) : (
                <div className="h-24 w-full border-b-2 border-dashed flex items-end justify-center pb-2 text-slate-300">Sin firma</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
