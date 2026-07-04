"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getStatusVariant } from "@/lib/utils";
import { QuoteFormDialog } from "@/components/quote-form-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuotes();
  }, []);

  async function fetchQuotes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("quotes")
      .select(`
        *,
        clients(name),
        vehicles(make, model, license_plate)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setQuotes(data);
    } else {
      console.error("Error fetching quotes:", error);
    }
    setLoading(false);
  }

  const handleFormSubmit = async (data: any) => {
    // 1. Generate a unique quote_number
    const year = new Date().getFullYear();
    const { count } = await supabase.from("quotes").select("*", { count: "exact", head: true });
    const nextNum = String((count || 0) + 1).padStart(3, "0");
    const quoteNumber = `COT-${year}-${nextNum}`;

    // 2. Insert the main quote record
    const { data: newQuote, error } = await supabase
      .from("quotes")
      .insert({
        quote_number: quoteNumber,
        client_id: data.clientId,
        vehicle_id: data.vehicleId,
        status: "Enviada",
        total: data.total,
        notes: data.notes || null,
      })
      .select(`*, clients(name, phone), vehicles(make, model, license_plate)`)
      .single();

    if (error || !newQuote) {
      toast({
        variant: "destructive",
        title: "Error al crear",
        description: "No se pudo guardar la cotización: " + (error?.message || ""),
      });
      setIsFormOpen(false);
      return;
    }

    // 3. Insert items into quote_items table
    if (data.items && data.items.length > 0) {
      const itemRows = data.items.map((item: any) => ({
        quote_id: newQuote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));
      await supabase.from("quote_items").insert(itemRows);
    }

    setQuotes([newQuote, ...quotes]);
    toast({
      title: `✅ Cotización ${quoteNumber} Creada`,
      description: `Cotización creada para ${newQuote.clients?.name || "el cliente"}.`,
    });

    // 4. Open WhatsApp if client has phone
    const clientPhone = newQuote.clients?.phone;
    if (clientPhone) {
      const quoteLink = `${window.location.origin}/quote/${newQuote.id}`;
      const message = encodeURIComponent(
        `Hola ${newQuote.clients?.name}, te enviamos la cotización ${quoteNumber} por un total de $${newQuote.total.toLocaleString("es-CL")}. Revísala y apruébala aquí: ${quoteLink}`
      );
      const waUrl = `https://wa.me/${clientPhone.replace(/\+/g, "")}?text=${message}`;
      window.open(waUrl, "_blank");
    }

    setIsFormOpen(false);
  };


  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <DashboardHeader title="Gestión de Cotizaciones" />
        <main className="flex-1 p-6">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <DashboardHeader title="Gestión de Cotizaciones">
        <Button onClick={() => router.push("/dashboard/finance/quotes/new")} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Presupuesto
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-6 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Listado de Cotizaciones</CardTitle>
            <CardDescription>
              Visualice y gestione todos los presupuestos emitidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Cotización</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.length > 0 ? (
                  quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium font-mono">
                        {quote.quote_number || quote.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>{quote.clients?.name || "—"}</TableCell>
                      <TableCell>
                        {quote.vehicles
                          ? `${quote.vehicles.make} ${quote.vehicles.model}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {new Date(quote.created_at).toLocaleDateString("es-CL")}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${(quote.total || 0).toLocaleString("es-CL")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(quote.status)}>
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/finance/quotes/${quote.id}`}>
                            Ver Detalle <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No hay cotizaciones registradas aún.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      <QuoteFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
