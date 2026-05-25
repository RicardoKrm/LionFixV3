import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Usamos el Service Role Key para poder actualizar sin sesión de usuario activa
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Aquí iría el parseo específico dependiendo del proveedor (Twilio, Meta, Evolution API)
    // Para este ejemplo universal, asumimos un body simplificado
    // { "from": "+56912345678", "text": "1" }
    
    // Si viene de Twilio, por ejemplo, el formato es diferente (x-www-form-urlencoded),
    // pero manejaremos JSON para mantenerlo simple y adaptable.
    const senderPhone = body.from || body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
    const messageText = body.text || body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

    if (!senderPhone || !messageText) {
      return NextResponse.json({ error: "No phone or text found" }, { status: 400 });
    }

    const cleanPhone = senderPhone.replace(/\D/g, "");
    const response = messageText.trim();

    // Buscamos si hay un cliente con este teléfono
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("id")
      // Simplificación: en la vida real habría que estandarizar formatos de teléfono
      .ilike("phone", `%${cleanPhone.slice(-8)}%`)
      .single();

    if (clientError || !clientData) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Buscamos su última cotización pendiente
    const { data: quoteData, error: quoteError } = await supabase
      .from("quotes")
      .select("id, status")
      .eq("client_id", clientData.id)
      .in("status", ["Pendiente", "Enviada"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (quoteError || !quoteData) {
      return NextResponse.json({ message: "No pending quotes for this client" }, { status: 200 });
    }

    // Procesamos la respuesta
    let newStatus = "";
    if (response === "1") {
      newStatus = "Aprobada";
    } else if (response === "2") {
      newStatus = "Rechazada";
    } else {
      return NextResponse.json({ message: "Unrecognized command. Only 1 or 2." }, { status: 200 });
    }

    // Actualizamos el estado
    await supabase
      .from("quotes")
      .update({ status: newStatus })
      .eq("id", quoteData.id);

    // Opcional: Podrías insertar una notificación en una tabla "notifications" para que aparezca en el panel
    
    return NextResponse.json({ success: true, newStatus });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
