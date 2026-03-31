import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const hex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  // Cal.com envía solo el hash hex, sin prefijo "sha256="
  return hex === signature || `sha256=${hex}` === signature
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const body = await req.text()
  const signature = req.headers.get('X-Cal-Signature-256') ?? ''
  const secret = Deno.env.get('CAL_WEBHOOK_SECRET') ?? ''

  if (secret && !(await verifySignature(body, signature, secret))) {
    return new Response('Unauthorized', { status: 401 })
  }

  let data: { triggerEvent: string; payload: Record<string, unknown> }
  try {
    data = JSON.parse(body)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { triggerEvent, payload } = data

  switch (triggerEvent) {
    case 'BOOKING_CREATED': {
      const responses = payload.responses as Record<string, { value: string }> | undefined
      const attendees = payload.attendees as Array<{ name: string; email: string }> | undefined

      const name = responses?.name?.value ?? attendees?.[0]?.name ?? ''
      const email = responses?.email?.value ?? attendees?.[0]?.email ?? ''
      const phone = responses?.phone?.value ?? ''
      const uid = payload.uid as string
      const startTime = payload.startTime as string
      const endTime = payload.endTime as string
      const videoCallData = payload.videoCallData as { url?: string } | undefined
      const meetLink = videoCallData?.url ?? null
      const eventTitle = (payload.eventTitle ?? payload.title ?? null) as string | null

      // Buscar o crear paciente de forma segura contra condiciones de carrera
      let pacienteId: string

      if (email) {
        // Upsert por email: si ya existe, retorna el existente; si no, lo crea
        const { data: upserted, error: upsertError } = await supabase
          .from('pacientes')
          .upsert(
            { nombre: name, email, telefono: phone || null, estado: 'activo' },
            { onConflict: 'email', ignoreDuplicates: false }
          )
          .select('id')
          .single()

        if (upsertError || !upserted) {
          return new Response(
            JSON.stringify({ error: 'Error al crear paciente', detail: upsertError?.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
        pacienteId = upserted.id
      } else {
        // Sin email, crear paciente sin protección contra duplicados (no hay clave única)
        const { data: nuevo, error: insertError } = await supabase
          .from('pacientes')
          .insert({ nombre: name, telefono: phone || null, estado: 'activo' })
          .select('id')
          .single()

        if (insertError || !nuevo) {
          return new Response(
            JSON.stringify({ error: 'Error al crear paciente', detail: insertError?.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }
        pacienteId = nuevo.id
      }

      // Insertar cita ignorando duplicados (por cal_booking_uid unique)
      const { error: citaError } = await supabase.from('citas').upsert(
        {
          paciente_id: pacienteId,
          cal_booking_uid: uid,
          fecha_inicio: startTime,
          fecha_fin: endTime,
          estado: 'confirmada',
          tipo_cita: eventTitle,
          meet_link: meetLink,
        },
        { onConflict: 'cal_booking_uid', ignoreDuplicates: true }
      )

      if (citaError) {
        return new Response(
          JSON.stringify({ error: 'Error al crear cita', detail: citaError.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      break
    }

    case 'BOOKING_CANCELLED': {
      const uid = payload.uid as string

      const { error } = await supabase
        .from('citas')
        .update({ estado: 'cancelada', updated_at: new Date().toISOString() })
        .eq('cal_booking_uid', uid)

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Error al cancelar cita', detail: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      break
    }

    case 'BOOKING_RESCHEDULED': {
      const uid = payload.uid as string

      const { error } = await supabase
        .from('citas')
        .update({
          fecha_inicio: payload.startTime as string,
          fecha_fin: payload.endTime as string,
          estado: 'confirmada',
          updated_at: new Date().toISOString(),
        })
        .eq('cal_booking_uid', uid)

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Error al reagendar cita', detail: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }

      break
    }

    default:
      // Evento no manejado, se responde OK igualmente
      break
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
