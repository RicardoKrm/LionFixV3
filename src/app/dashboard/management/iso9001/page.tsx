
"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, HardHat, BarChart, TrendingUp, Upload, Download, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Iso9001Page() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState([
    "Manual_de_Calidad_v3.1.pdf",
    "Procedimiento_Recepcion_Vehiculos_v2.pdf",
    "Informe_Auditoria_Interna_Q2_2024.pdf"
  ]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);


  const handleUpload = () => {
    toast({
      title: "Adjuntar Archivo (Simulación)",
      description: "En una aplicación real, aquí se abriría un diálogo para subir un archivo.",
    });
    const newDoc = `Documento_Subido_${(documents.length + 1)}.pdf`;
    setDocuments([...documents, newDoc]);
  };

  const handleDownload = (docName: string) => {
    toast({
      title: "Descarga Iniciada (Simulación)",
      description: `Descargando: ${docName}`,
    });
  };

  const handleDeleteClick = (docName: string) => {
    setSelectedDoc(docName);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDoc) {
        setDocuments(documents.filter(doc => doc !== selectedDoc));
        toast({
            title: "Documento Eliminado",
            description: `El documento ${selectedDoc} ha sido eliminado.`,
            variant: "destructive"
        });
    }
    setIsAlertOpen(false);
    setSelectedDoc(null);
  };


  return (
    <>
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Relación Software - Norma ISO 9001" />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Cómo LionFix ERP apoya la certificación ISO 9001</CardTitle>
            <CardDescription>
              Este software está diseñado para facilitar la gestión de calidad y el cumplimiento de los requisitos de la norma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
               <AccordionItem value="item-1">
                <AccordionTrigger>
                  <HardHat className="h-5 w-5 mr-3 text-accent" />
                  Gestión de procesos y trazabilidad (Cláusula 4 y 8)
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pl-8">
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Registro de órdenes de trabajo (OT).</p>
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Historial de reparaciones por cliente/vehículo.</p>
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Control de repuestos y consumos.</p>
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Evidencia de cumplimiento de procedimientos.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>
                  <FileText className="h-5 w-5 mr-3 text-accent" />
                  Gestión documental (Cláusula 7.5)
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pl-8">
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Control de documentos: informes técnicos, certificados, manuales.</p>
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Versionamiento y acceso controlado.</p>
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Digitalización de registros (evita pérdida de papeles).</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>
                  <Users className="h-5 w-5 mr-3 text-accent" />
                  Gestión de clientes y satisfacción (Cláusula 9.1.2)
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pl-8">
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Registro de reclamos y no conformidades.</p>
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Encuestas de satisfacción / seguimientos.</p>
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Historial de comunicaciones con clientes.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>
                  <BarChart className="h-5 w-5 mr-3 text-accent" />
                  Control de recursos (Cláusula 7)
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pl-8">
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Mantenimiento de equipos (ej. scanner, elevador, máquina A/C).</p>
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Registro de calibraciones y verificaciones.</p>
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Competencia del personal (capacitaciones registradas).</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>
                  <TrendingUp className="h-5 w-5 mr-3 text-accent" />
                  Mejora continua (Cláusula 10)
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pl-8">
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Reportes de indicadores (KPIs) de eficiencia y calidad.</p>
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Trazabilidad para el control de acciones correctivas y preventivas.</p>
                  <p className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Análisis de datos para identificar oportunidades de mejora.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Gestión Documental para Auditorías</CardTitle>
                <CardDescription>
                    Centralice los documentos clave para el cumplimiento de la norma ISO 9001, como certificados, informes y procedimientos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {documents.map((doc, index) => (
                         <li key={index} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground"/>
                                <span className="font-medium">{doc}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                                <Download className="mr-2 h-4 w-4" />
                                Descargar
                                </Button>
                                 <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClick(doc)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                <Button variant="outline" onClick={handleUpload}>
                    <Upload className="mr-2 h-4 w-4"/>
                    Adjuntar Documento
                </Button>
            </CardFooter>
        </Card>
      </main>
    </div>

     <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro que desea eliminar este documento?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción no se puede deshacer. El documento se eliminará permanentemente.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDoc(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
