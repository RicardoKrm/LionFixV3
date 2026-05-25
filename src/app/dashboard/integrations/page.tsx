"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cpu, Upload, Settings2, CheckCircle2, Wrench, AlertCircle } from "lucide-react";
import { DiagnosticUploadDialog } from "@/components/diagnostic-upload-dialog";
import Image from "next/image";

export default function IntegrationsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Integraciones de Taller">
        <Button variant="secondary" onClick={() => setIsUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Subir Reporte de Diagnóstico
        </Button>
      </DashboardHeader>
      
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Tarjeta de LAUNCH */}
          <Card className="flex flex-col border-red-500/20 shadow-md">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-red-500" />
                    LAUNCH X431 Pro
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Escáner multimarca avanzado
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Soportado
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>La integración con Launch permite extraer códigos de falla (DTC), VIN y datos del vehículo a partir de sus reportes PDF generados.</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Settings2 className="h-4 w-4" />
                  Instrucciones de Uso
                </h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Realice el test rápido (Health Report) en el vehículo.</li>
                  <li>Exporte el reporte como PDF o envíelo por correo.</li>
                  <li>Haga clic en "Subir Reporte" en este panel.</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t">
              <Button className="w-full" onClick={() => setIsUploadOpen(true)}>
                Subir Reporte PDF
              </Button>
            </CardFooter>
          </Card>

          {/* Tarjeta de XENTRY */}
          <Card className="flex flex-col border-blue-500/20 shadow-md">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-blue-500" />
                    XENTRY Diagnosis
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Diagnóstico oficial Mercedes-Benz
                  </CardDescription>
                </div>
                 <Badge variant="outline" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Soportado
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Lee el diagnóstico (Kurztest) de XENTRY VCI para detectar automáticamente las averías presentes en las unidades de control de Mercedes-Benz.</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Settings2 className="h-4 w-4" />
                  Instrucciones de Uso
                </h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Ejecute el Kurztest en XENTRY Diagnosis.</li>
                  <li>Imprima el resultado a PDF (Print to PDF).</li>
                  <li>Suba el archivo generado en esta plataforma.</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsUploadOpen(true)}>
                Subir Reporte PDF
              </Button>
            </CardFooter>
          </Card>

        </div>
        
        <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="bg-background p-3 rounded-full shadow-sm">
                    <AlertCircle className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                    <h3 className="font-medium text-lg">¿Por qué usamos reportes PDF?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Los fabricantes de escáneres mantienen sus sistemas cerrados por seguridad y licencias. Subir el reporte PDF es la manera más rápida, legal y profesional de integrar la información del taller sin requerir hardware adicional ni hackear las herramientas. Nuestra Inteligencia Artificial se encarga del resto.
                    </p>
                </div>
            </CardContent>
        </Card>
      </main>

      <DiagnosticUploadDialog 
        isOpen={isUploadOpen} 
        onOpenChange={setIsUploadOpen} 
      />
    </div>
  );
}
