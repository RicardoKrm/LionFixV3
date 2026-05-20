
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircuitBoard, Zap, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ObdScannerToolProps = {
  onScan: (code: string) => void;
};

// Mock data for OBD-II codes
const mockObdCodes = [
    { code: "P0301", description: "Cylinder 1 Misfire Detected" },
    { code: "P0171", description: "System Too Lean (Bank 1)" },
    { code: "P0420", description: "Catalyst System Efficiency Below Threshold (Bank 1)" },
    { code: "P0135", description: "O2 Sensor Heater Circuit Malfunction (Bank 1 Sensor 1)" },
];

export function ObdScannerTool({ onScan }: ObdScannerToolProps) {
  const [scanResult, setScanResult] = useState<typeof mockObdCodes[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleScan = () => {
    setIsLoading(true);
    setScanResult(null);
    
    toast({
        title: "Conectando al scanner...",
        description: "Simulando lectura de códigos OBD-II.",
    });

    // Simulate network delay and random code selection
    setTimeout(() => {
      const randomCode = mockObdCodes[Math.floor(Math.random() * mockObdCodes.length)];
      setScanResult(randomCode);
      setIsLoading(false);
      toast({
        title: "¡Código Leído!",
        description: `Se encontró el código: ${randomCode.code}`,
      });
      // Pass the code to the parent to update the service log
      onScan(`${randomCode.code} - ${randomCode.description}`);
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CircuitBoard/> Diagnóstico OBD-II</CardTitle>
        <CardDescription>
          Simule la conexión a un scanner para obtener códigos de falla.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={handleScan} disabled={isLoading} variant="outline">
          {isLoading ? (
            <>
                <Activity className="mr-2 animate-pulse" />
                Leyendo...
            </>
            
          ) : (
             <>
                <Zap className="mr-2" />
                Leer Códigos de Falla
             </>
          )}
        </Button>
        {scanResult && (
          <div className="mt-4 rounded-lg border bg-background/50 p-4 text-sm">
            <h4 className="font-semibold">Última Lectura:</h4>
            <p className="font-mono text-lg text-destructive">{scanResult.code}</p>
            <p className="text-muted-foreground">{scanResult.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
    
    