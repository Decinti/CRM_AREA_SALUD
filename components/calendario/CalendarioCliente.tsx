'use client'

import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { clientConfig } from '@/lib/config'
import type { CitaConPaciente } from '@/types/cita'

interface PacienteOpcion {
  id: string
  nombre: string
}

interface EventoDetalle {
  id: string
  nombrePaciente: string
  pacienteId: string | null
  fechaInicio: string
  fechaFin: string
  estado: string
  tipoCita: string | null
  meetLink: string | null
}

interface NuevaCitaForm {
  pacienteId: string
  fechaInicio: string
  duracion: number
}

function citaToEvent(cita: CitaConPaciente, color: string): EventInput {
  return {
    id: cita.id,
    title: cita.pacientes?.nombre ?? 'Paciente',
    start: cita.fecha_inicio,
    end: cita.fecha_fin,
    backgroundColor: color,
    borderColor: color,
    textColor: '#ffffff',
    extendedProps: {
      pacienteId: cita.paciente_id,
      estado: cita.estado,
      tipoCita: cita.tipo_cita,
      meetLink: cita.meet_link,
      nombrePaciente: cita.pacientes?.nombre ?? 'Sin nombre',
    },
  }
}

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function calcularDuracion(inicio: string, fin: string): string {
  const diff = Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000)
  if (diff < 60) return `${diff} minutos`
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return m > 0 ? `${h}h ${m}min` : `${h} hora${h > 1 ? 's' : ''}`
}

const ESTADO_BADGE: Record<string, string> = {
  confirmada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
  reagendada: 'bg-yellow-100 text-yellow-700',
  completada: 'bg-indigo-100 text-indigo-700',
}

export default function CalendarioCliente({
  citasIniciales,
  pacientes,
}: {
  citasIniciales: CitaConPaciente[]
  pacientes: PacienteOpcion[]
}) {
  const router = useRouter()
  const primary = clientConfig.colorPrimary

  const [eventos, setEventos] = useState<EventInput[]>(
    citasIniciales.map((c) => citaToEvent(c, primary))
  )
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoDetalle | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nuevaCita, setNuevaCita] = useState<NuevaCitaForm>({
    pacienteId: '',
    fechaInicio: '',
    duracion: 60,
  })
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState('')

  // Suscripción Realtime a la tabla citas
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('citas-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'citas' },
        async (payload) => {
          const { data } = await supabase
            .from('citas')
            .select('*, pacientes(nombre)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setEventos((prev) => [...prev, citaToEvent(data as CitaConPaciente, primary)])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'citas' },
        async (payload) => {
          const { data } = await supabase
            .from('citas')
            .select('*, pacientes(nombre)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setEventos((prev) =>
              prev.map((e) =>
                e.id === payload.new.id ? citaToEvent(data as CitaConPaciente, primary) : e
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [primary])

  function handleEventClick(info: EventClickArg) {
    const p = info.event.extendedProps
    setEventoSeleccionado({
      id: info.event.id,
      nombrePaciente: p.nombrePaciente as string,
      pacienteId: p.pacienteId as string | null,
      fechaInicio: info.event.startStr,
      fechaFin: info.event.endStr,
      estado: p.estado as string,
      tipoCita: p.tipoCita as string | null,
      meetLink: p.meetLink as string | null,
    })
  }

  function handleDateClick(info: DateClickArg) {
    const d = info.date
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setNuevaCita({
      pacienteId: pacientes[0]?.id ?? '',
      fechaInicio: local,
      duracion: 60,
    })
    setErrorModal('')
    setModalAbierto(true)
  }

  async function handleGuardarCita() {
    if (!nuevaCita.pacienteId) {
      setErrorModal('Selecciona un paciente.')
      return
    }
    if (!nuevaCita.fechaInicio) {
      setErrorModal('Ingresa una fecha y hora.')
      return
    }
    setGuardando(true)
    setErrorModal('')

    const inicio = new Date(nuevaCita.fechaInicio)
    const fin = new Date(inicio.getTime() + nuevaCita.duracion * 60000)
    const supabase = createClient()

    const { error } = await supabase.from('citas').insert({
      paciente_id: nuevaCita.pacienteId,
      fecha_inicio: inicio.toISOString(),
      fecha_fin: fin.toISOString(),
      estado: 'confirmada',
    })

    setGuardando(false)
    if (error) {
      setErrorModal('No se pudo guardar la cita. Intenta nuevamente.')
      return
    }
    setModalAbierto(false)
  }

  return (
    <div className="relative">
      {/* Contenedor del calendario — se estrecha cuando el panel lateral está abierto */}
      <div
        className="transition-all duration-300"
        style={{ marginRight: eventoSeleccionado ? 320 : 0 }}
      >
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={esLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          buttonText={{ today: 'Hoy' }}
          height="calc(100vh - 210px)"
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          nowIndicator
          events={eventos}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        />
      </div>

      {/* Panel lateral de detalle de cita */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-30 flex flex-col transition-transform duration-300 ${
          eventoSeleccionado ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {eventoSeleccionado && (
          <>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="text-base font-semibold text-gray-900">Detalle de cita</h2>
              <button
                onClick={() => setEventoSeleccionado(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Paciente</p>
                <p className="text-base font-semibold text-gray-900">{eventoSeleccionado.nombrePaciente}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Fecha y hora</p>
                <p className="text-sm text-gray-700 capitalize">
                  {formatFechaHora(eventoSeleccionado.fechaInicio)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Duración</p>
                <p className="text-sm text-gray-700">
                  {calcularDuracion(eventoSeleccionado.fechaInicio, eventoSeleccionado.fechaFin)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Estado</p>
                <span
                  className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                    ESTADO_BADGE[eventoSeleccionado.estado] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {eventoSeleccionado.estado}
                </span>
              </div>

              {eventoSeleccionado.tipoCita && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Tipo</p>
                  <p className="text-sm text-gray-700">{eventoSeleccionado.tipoCita}</p>
                </div>
              )}

              {eventoSeleccionado.meetLink && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Reunión</p>
                  <a
                    href={eventoSeleccionado.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Unirse a la reunión →
                  </a>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 shrink-0">
              {eventoSeleccionado.pacienteId && (
                <button
                  onClick={() =>
                    router.push(`/dashboard/pacientes/${eventoSeleccionado.pacienteId}`)
                  }
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primary }}
                >
                  Ver ficha del paciente
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Backdrop en móvil para cerrar panel */}
      {eventoSeleccionado && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          onClick={() => setEventoSeleccionado(null)}
        />
      )}

      {/* Modal para crear nueva cita */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Nueva cita</h2>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Paciente
                </label>
                <select
                  value={nuevaCita.pacienteId}
                  onChange={(e) =>
                    setNuevaCita((p) => ({ ...p, pacienteId: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                >
                  <option value="">Seleccionar paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fecha y hora
                </label>
                <input
                  type="datetime-local"
                  value={nuevaCita.fechaInicio}
                  onChange={(e) =>
                    setNuevaCita((p) => ({ ...p, fechaInicio: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Duración
                </label>
                <select
                  value={nuevaCita.duracion}
                  onChange={(e) =>
                    setNuevaCita((p) => ({ ...p, duracion: Number(e.target.value) }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white"
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1 hora 30 minutos</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>

              {errorModal && <p className="text-sm text-red-600">{errorModal}</p>}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setModalAbierto(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarCita}
                disabled={guardando}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: primary }}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
