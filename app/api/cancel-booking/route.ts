import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  let body: { citaId: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { citaId } = body
  if (!citaId) {
    return NextResponse.json({ error: 'citaId requerido' }, { status: 400 })
  }

  // Obtener la cita para saber si tiene UID de Cal.com
  const { data: cita, error: fetchError } = await supabase
    .from('citas')
    .select('id, cal_booking_uid')
    .eq('id', citaId)
    .single()

  if (fetchError || !cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  // Si la cita vino de Cal.com, cancelarla allá primero
  if (cita.cal_booking_uid) {
    const calApiKey = process.env.CAL_API_KEY!
    const calRes = await fetch(
      `https://api.cal.com/v1/bookings/${cita.cal_booking_uid}/cancel?apiKey=${calApiKey}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelado desde el CRM' }),
      }
    )

    if (!calRes.ok) {
      const detail = await calRes.text()
      return NextResponse.json(
        { error: 'Error al cancelar en Cal.com', detail },
        { status: 500 }
      )
    }
  }

  // Eliminar la cita de Supabase
  const { error: deleteError } = await supabase
    .from('citas')
    .delete()
    .eq('id', citaId)

  if (deleteError) {
    return NextResponse.json(
      { error: 'Error al eliminar en Supabase', detail: deleteError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
