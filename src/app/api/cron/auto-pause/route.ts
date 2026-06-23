import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  // Configurado para ejecutarse a las 17:00.
  // Este endpoint buscará todas las OT 'En Reparación' o 'En Diagnóstico'
  // y las pasará a 'Pausado'.
  
  // Puedes proteger este endpoint en Vercel verificando el header de Cron
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  // Considerar zona horaria (Santiago de Chile por defecto es UTC-4 o UTC-3)
  // Aquí usaremos la hora del servidor, pero lo ideal es que el Cron se configure a las 17:01 CLT
  // Por precaución, siempre pausamos lo que encontremos (el cron es el que decide cuándo correr).

  try {
    const { data: ots, error: fetchError } = await supabase
      .from('work_orders')
      .select('id, ot_number')
      .in('status', ['En Reparación', 'En Diagnóstico']);

    if (fetchError) {
      console.error('Error fetching OTs to pause:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!ots || ots.length === 0) {
      return NextResponse.json({ message: 'No active work orders found to pause.' });
    }

    // Actualizar a Pausado
    const { error: updateError } = await supabase
      .from('work_orders')
      .update({ status: 'Pausado' })
      .in('id', ots.map(ot => ot.id));

    if (updateError) {
      console.error('Error pausing OTs:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Registrar en logs (opcional, para trazabilidad)
    const logs = ots.map(ot => ({
      work_order_id: ot.id,
      entry_text: 'OT pausada automáticamente por fin de jornada (17:00).'
    }));

    await supabase.from('service_logs').insert(logs);

    return NextResponse.json({ 
      message: `Successfully paused ${ots.length} work orders.`,
      pausedOrders: ots.map(ot => ot.ot_number)
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
