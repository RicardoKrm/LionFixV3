
"use client";

import { notFound } from "next/navigation";
import { fleetContracts, vehicles } from "@/lib/data";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building, Car, Calendar, FileText, Download, Upload, Users, Edit } from "lucide-react";
import { getStatusVariant } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useState } from "react";

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const contract = fleetContracts.find((c) => c.id === params.id);
  const [attachedFiles, setAttachedFiles] = useState(["Contrato_Maestro_2024.pdf"]);

  if (!contract) {
    notFound();
  }

  const contractVehicles = vehicles.slice(0, contract.vehicleCount); // Simulación de vehículos de la flota

  const handleUpload = () => {
    toast({
      title: "Adjuntar Archivo (Simulación)",
      description: "En una aplicación real, aquí se abriría un diálogo para subir un archivo.",
    });
    // Simulacion de añadir un nuevo archivo
    const newFileName = `Anexo_${new Date().getFullYear()}_0${attachedFiles.length}.pdf`;
    setAttachedFiles([...attachedFiles, newFileName]);
  };

  const handleDownload = (fileName: string) => {
    toast({
      title: "Descarga Iniciada (Simulación)",
      description: `Se está descargando el archivo: ${fileName}.`,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title={`Contrato: ${contract.id}`}>
        <Button variant="secondary">
          <Edit className="mr-2 h-4 w-4" /> Editar Contrato
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 grid md:grid-cols-3 gap-6 overflow-y-auto">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flota de Vehículos Asignada</CardTitle>
              <CardDescription>
                Vehículos cubiertos por el plan de mantenimiento de este contrato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patente</TableHead>
                    <TableHead>Marca y Modelo</TableHead>
                    <TableHead>N° Motor</TableHead>
                    <TableHead>Última Mantención</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractVehicles.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono">{v.licensePlate}</TableCell>
                      <TableCell>{v.make} {v.model}</TableCell>
                      <TableCell className="font-mono">{v.motorNumber}</TableCell>
                      <TableCell>{new Date(new Date().setMonth(new Date().getMonth() - Math.floor(Math.random() * 6))).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                         <Link href={`/dashboard/work-orders`}>
                            <Button variant="outline" size="sm">Ver Historial</Button>
                         </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestión de Documentos del Contrato</CardTitle>
              <CardDescription>
                Adjunte, visualice y descargue los documentos contractuales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {attachedFiles.map((file, index) => (
                   <li key={index} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground"/>
                        <span className="font-medium">{file}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={handleUpload}>
                <Upload className="mr-2 h-4 w-4" />
                Adjuntar Nuevo Documento
              </Button>
            </CardFooter>
          </Card>

        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Estado del Contrato</CardTitle>
              <Badge variant={getStatusVariant(contract.status as any)} className="text-base">
                {contract.status}
              </Badge>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Plan de Mantenimiento: <strong>{contract.planType}</strong></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2" /> Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Razón Social:</strong> {contract.companyName}</p>
              <p><strong>Contacto:</strong> gerencia@example.com (simulado)</p>
              <p><strong>Teléfono:</strong> +56 2 2123 4567 (simulado)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2" /> Vigencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Inicio:</strong> {new Date(contract.startDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Término:</strong> {new Date(contract.endDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
