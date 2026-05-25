"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUp, FileText, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type DiagnosticUploadDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

type ParsedData = {
  vin: string;
  vehicle: string;
  mileage: string;
  dtcs: Array<{ code: string; description: string; severity: "high" | "medium" | "low" }>;
} | null;

export function DiagnosticUploadDialog({ isOpen, onOpenChange }: DiagnosticUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    
    // Simulate AI parsing delay (e.g., sending PDF to GenAI and extracting JSON)
    setTimeout(() => {
      setParsedData({
        vin: "WDD2050401F00XXXX",
        vehicle: "Mercedes-Benz C200 (W205)",
        mileage: "56,432 km",
        dtcs: [
          { code: "P0011", description: "Posición del árbol de levas A - Avance excesivo o rendimiento del sistema (Banco 1)", severity: "high" },
          { code: "P0301", description: "Detectado fallo de encendido en el cilindro 1", severity: "high" },
          { code: "U0100", description: "Pérdida de comunicación con el módulo de control del motor (ECM/PCM A)", severity: "medium" }
        ]
      });
      setIsParsing(false);
      toast({
        title: "Análisis Completado",
        description: "Se han extraído los códigos de avería exitosamente con IA.",
      });
    }, 3500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleCreateWO = () => {
    // Aquí normalmente pasaríamos los datos por estado o URL a /dashboard/work-orders/new
    toast({
      title: "Redirigiendo...",
      description: "Llevando los datos al creador de Órdenes de Trabajo.",
    });
    // Reseteamos el estado para la proxima vez
    setTimeout(() => {
        setFile(null);
        setParsedData(null);
        onOpenChange(false);
        router.push("/dashboard/work-orders");
    }, 1000);
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if(!open) handleReset();
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Analizador de Diagnóstico con IA</DialogTitle>
          <DialogDescription>
            Sube el reporte en PDF de XENTRY o Launch. La inteligencia artificial extraerá los códigos de falla (DTC).
          </DialogDescription>
        </DialogHeader>

        {!file && !parsedData && (
          <div
            className={`mt-4 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging ? "border-accent bg-accent/5" : "border-muted-foreground/25 hover:bg-accent/5 hover:border-accent/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt,.csv"
            />
            <div className="bg-muted p-4 rounded-full mb-4">
                <FileUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">Arrastra tu reporte PDF aquí</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              o haz clic para explorar tus archivos
            </p>
            <Button variant="secondary">Seleccionar Archivo</Button>
          </div>
        )}

        {isParsing && (
          <div className="mt-4 flex flex-col items-center justify-center p-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 text-accent animate-spin" />
            <h3 className="font-medium text-lg">La IA está leyendo el reporte...</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Analizando {file?.name}. Extrayendo VIN, datos del vehículo y traduciendo los códigos de avería (DTC).
            </p>
          </div>
        )}

        {parsedData && !isParsing && (
          <div className="mt-4 space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between border">
                <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">{file?.name}</p>
                        <p className="text-xs text-green-600 font-medium flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Procesado con IA
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleReset}>Subir otro</Button>
            </div>

            <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                    Datos Extraídos
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm bg-card border rounded-md p-3">
                    <div>
                        <span className="text-muted-foreground block text-xs mb-1">Vehículo</span>
                        <span className="font-medium">{parsedData.vehicle}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs mb-1">VIN</span>
                        <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{parsedData.vin}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs mb-1">Kilometraje</span>
                        <span className="font-medium">{parsedData.mileage}</span>
                    </div>
                </div>

                <div className="space-y-2 mt-4">
                    <span className="text-muted-foreground block text-xs font-semibold uppercase tracking-wider">Códigos de Falla ({parsedData.dtcs.length})</span>
                    {parsedData.dtcs.map((dtc, idx) => (
                        <div key={idx} className="flex gap-3 text-sm border rounded-md p-3 items-start bg-card">
                            <Badge variant={dtc.severity === 'high' ? 'destructive' : 'secondary'} className="font-mono mt-0.5">
                                {dtc.code}
                            </Badge>
                            <p className="leading-tight">{dtc.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <Separator className="my-4" />
            
            <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cerrar
                </Button>
                <Button onClick={handleCreateWO}>
                    Crear O.T. con estos datos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
