import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// API para recibir marcajes (punches) desde el taller (ZK TX626)
// Soporta tanto formato JSON estándar como datos planos básicos
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    let device_user_id: string;
    let timestamp: string;
    let punch_type: string = 'UNKNOWN';

    // 1. Manejar petición JSON (Ideal para scripts en Python/Node)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      device_user_id = body.device_user_id?.toString();
      timestamp = body.timestamp; // Debe estar en formato ISO o SQL (ej: 2024-05-26T08:00:00)
      punch_type = body.punch_type || 'UNKNOWN';
    } 
    // 2. Manejar formato URL-encoded o texto plano (Posible formato de ZKTeco ADMS)
    else {
      const text = await req.text();
      // Un parseo básico si manda "user=1&time=2024..."
      const params = new URLSearchParams(text);
      device_user_id = params.get('user') || params.get('PIN') || '';
      timestamp = params.get('time') || '';
      punch_type = params.get('type') || 'UNKNOWN';
      
      // Si el equipo manda líneas planas tipo "1\t2024-05-26 08:00:00\t0" (Formato iclock)
      if (!device_user_id && text.includes('\t')) {
         const lines = text.split('\n');
         const firstLine = lines[0].split('\t');
         if (firstLine.length >= 2) {
             device_user_id = firstLine[0].trim();
             // Reemplazar espacio por T para formato ISO
             timestamp = firstLine[1].trim().replace(' ', 'T') + 'Z'; 
             punch_type = firstLine[2]?.trim() === '0' ? 'IN' : firstLine[2]?.trim() === '1' ? 'OUT' : 'UNKNOWN';
         }
      }
    }

    if (!device_user_id || !timestamp) {
      return NextResponse.json({ error: 'Faltan datos obligatorios (device_user_id, timestamp)' }, { status: 400 });
    }

    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert({
        device_user_id,
        timestamp,
        punch_type
      })
      .select()
      .single();

    if (error) {
      // Ignorar error de duplicado (ya se recibió esta marca)
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Marcaje ya existía (ignorado)' });
      }
      // Error de llave foránea (usuario no mapeado)
      if (error.code === '23503') {
         // Auto-crear el usuario en el mapa para no perder el log
         await supabase.from('employee_device_map').insert({
             device_user_id,
             name_override: `Empleado ZK #${device_user_id}`
         });
         // Reintentar inserción
         await supabase.from('attendance_logs').insert({ device_user_id, timestamp, punch_type });
         return NextResponse.json({ success: true, message: 'Usuario auto-creado y marcaje registrado' });
      }

      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
