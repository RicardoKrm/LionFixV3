"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, User, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function NewClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado del Cliente
  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Estado del Vehículo Principal
  const [vehicleData, setVehicleData] = useState({
    license_plate: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    vin: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Crear el Cliente
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
        })
        .select()
        .single();

      if (clientError) throw new Error("Error al crear el cliente: " + clientError.message);

      // 2. Crear el Vehículo asociado
      const { error: vehicleError } = await supabase
        .from("vehicles")
        .insert({
          client_id: newClient.id,
          license_plate: vehicleData.license_plate.toUpperCase(),
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          vin: vehicleData.vin,
        });

      if (vehicleError) throw new Error("Error al registrar el vehículo: " + vehicleError.message);

      // 3. Registrar en ISO 9001
      await supabase.from("iso_logs").insert({
        event_type: "Ingreso de Nuevo Cliente y Vehículo",
        description: `Se registró al cliente ${clientData.name} junto con su vehículo patente ${vehicleData.license_plate}.`,
        reference_id: newClient.id,
        reference_table: "clients",
        clausula_iso: "8.2.1",
      });

      toast({
        title: "Registro Exitoso",
        description: "El cliente y su vehículo han sido guardados correctamente.",
      });

      router.push("/dashboard/clients");

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de Registro",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Nuevo Ingreso de Cliente">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </DashboardHeader>
      
      <main className="flex-1 p-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="text-primary" /> Datos del Cliente
              </CardTitle>
              <CardDescription>Información de contacto obligatoria para seguimiento.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input 
                  id="name" 
                  required 
                  value={clientData.name} 
                  onChange={(e) => setClientData({...clientData, name: e.target.value})} 
                  placeholder="Ej: Juan Pérez" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={clientData.email} 
                  onChange={(e) => setClientData({...clientData, email: e.target.value})} 
                  placeholder="ejemplo@correo.com" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input 
                  id="phone" 
                  value={clientData.phone} 
                  onChange={(e) => setClientData({...clientData, phone: e.target.value})} 
                  placeholder="+56 9 1234 5678" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección Física</Label>
                <Input 
                  id="address" 
                  value={clientData.address} 
                  onChange={(e) => setClientData({...clientData, address: e.target.value})} 
                  placeholder="Av. Providencia 1234" 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="text-primary" /> Datos del Vehículo
              </CardTitle>
              <CardDescription>Información del vehículo que ingresa al taller.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="license_plate">Patente</Label>
                <Input 
                  id="license_plate" 
                  required 
                  className="uppercase font-mono"
                  value={vehicleData.license_plate} 
                  onChange={(e) => setVehicleData({...vehicleData, license_plate: e.target.value})} 
                  placeholder="ABCD12" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vin">Número de Chasis (VIN)</Label>
                <Input 
                  id="vin" 
                  className="uppercase font-mono"
                  value={vehicleData.vin} 
                  onChange={(e) => setVehicleData({...vehicleData, vin: e.target.value})} 
                  placeholder="Opcional" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="make">Marca</Label>
                <Input 
                  id="make" 
                  required 
                  value={vehicleData.make} 
                  onChange={(e) => setVehicleData({...vehicleData, make: e.target.value})} 
                  placeholder="Ej: Toyota" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input 
                  id="model" 
                  required 
                  value={vehicleData.model} 
                  onChange={(e) => setVehicleData({...vehicleData, model: e.target.value})} 
                  placeholder="Ej: Corolla" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Input 
                  id="year" 
                  type="number" 
                  required 
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  value={vehicleData.year} 
                  onChange={(e) => setVehicleData({...vehicleData, year: parseInt(e.target.value)})} 
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : (
                <>
                  <Save className="mr-2 h-5 w-5" /> Registrar Cliente y Vehículo
                </>
              )}
            </Button>
          </div>

        </form>
      </main>
    </div>
  );
}
