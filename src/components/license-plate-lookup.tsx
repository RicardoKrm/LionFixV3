
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { VehicleData } from "@/actions/vehicleActions";
import { lookupPlate } from "@/actions/vehicleActions";


export function LicensePlateLookup() {
  const [plate, setPlate] = useState("");
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLookup = async () => {
    if (!plate) return;
    setIsLoading(true);
    setVehicleData(null);
    const data = await lookupPlate(plate);
    setIsLoading(false);
    if (data) {
      setVehicleData(data);
    } else {
      toast({
        variant: "destructive",
        title: "No Encontrado",
        description: `No se encontraron datos para la patente: ${plate}`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Búsqueda por Patente</CardTitle>
        <CardDescription>
          Ingrese una patente para buscar datos del vehículo desde una fuente externa (simulado).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="text"
            placeholder="ej: ABCD-12"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            className="font-mono uppercase"
          />
          <Button type="submit" onClick={handleLookup} disabled={isLoading}>
            {isLoading ? "Buscando..." : <><Search className="mr-2 h-4 w-4" /> Buscar</>}
          </Button>
        </div>
        {vehicleData && (
          <div className="mt-4 rounded-lg border bg-background/50 p-4 text-sm space-y-1">
            <h4 className="font-semibold mb-2">Detalles del Vehículo:</h4>
            <p><strong>Marca / Modelo:</strong> {vehicleData.make} {vehicleData.model}</p>
            <p><strong>Año:</strong> {vehicleData.year}</p>
            <p><strong>VIN:</strong> <span className="font-code">{vehicleData.vin}</span></p>
            <p><strong>N° Motor:</strong> <span className="font-code">{vehicleData.motorNumber}</span></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
