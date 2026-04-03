'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import type { EventClickArg, EventContentArg, EventInput } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { clientConfig } from '@/lib/config'
import type { CitaConPaciente } from '@/types/cita'

interface PacienteOpcion {
  id: string
  nombre: string
}

interface NuevaCitaForm {
  pacienteId: string
  fecha: string
  hora: string
  duracion: number
}

const ESTADO_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  confirmada: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmada' },
  cancelada: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' },
  reagendada: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Reagendada' },
  completada: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Completada' },
}

function toDateKey(date: Date | string): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

function formatFechaTitulo(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const str = date.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return `rgba(99, 102, 241, ${alpha})`
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
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
    extendedProps: { citaId: cita.id },
  }
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
  const primaryLight = hexToRgba(primary, 0.08)

  const [citas, setCitas] = useState<CitaConPaciente[]>(citasIniciales)
  const [eventos, setEventos] = useState<EventInput[]>(
    citasIniciales.map((c) => citaToEvent(c, primary))
  )

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedCita, setSelectedCita] = useState<CitaConPaciente | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [nuevaCita, setNuevaCita] = useState<NuevaCitaForm>({
    pacienteId: '',
    fecha: '',
    hora: '',
    duracion: 30,
  })
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState('')

  const [modalEliminar, setModalEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const calendarAreaRef = useRef<HTMLDivElement>(null)

  // Agrupación de citas por día (clave YYYY-MM-DD local)
  const citasMap = useMemo(() => {
    const map = new Map<string, CitaConPaciente[]>()
    for (const cita of citas) {
      const key = toDateKey(cita.fecha_inicio)
      const arr = map.get(key) ?? []
      arr.push(cita)
      map.set(key, arr)
    }
    return map
  }, [citas])

  // Suscripción Realtime — igual que antes para recibir citas de Cal.com
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
            const cita = data as CitaConPaciente
            setCitas((prev) => [...prev, cita])
            setEventos((prev) => [...prev, citaToEvent(cita, primary)])
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
            const cita = data as CitaConPaciente
            setCitas((prev) => prev.map((c) => (c.id === cita.id ? cita : c)))
            setEventos((prev) =>
              prev.map((e) => (e.id === cita.id ? citaToEvent(cita, primary) : e))
            )
            setSelectedCita((prev) => (prev?.id === cita.id ? cita : prev))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [primary])

  // Cierra el panel al hacer click fuera del calendario y del panel lateral
  useEffect(() => {
    if (!panelOpen) return

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        panelRef.current?.contains(target) ||
        calendarAreaRef.current?.contains(target)
      ) return
      closePanel()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [panelOpen])

  function openDayPanel(dateKey: string) {
    setSelectedDate(dateKey)
    setSelectedCita(null)
    setPanelOpen(true)
  }

  function closePanel() {
    setPanelOpen(false)
    // Limpiar estado después de la animación de salida
    setTimeout(() => {
      setSelectedDate(null)
      setSelectedCita(null)
    }, 300)
  }

  function handleDateClick(info: DateClickArg) {
    openDayPanel(toDateKey(info.date))
  }

  function handleEventClick(info: EventClickArg) {
    info.jsEvent.preventDefault()
    openDayPanel(toDateKey(info.event.start!))
  }

  function openNuevaCitaModal() {
    const today = new Date()
    setNuevaCita({
      pacienteId: pacientes[0]?.id ?? '',
      fecha: selectedDate ?? toDateKey(today),
      hora: `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`,
      duracion: 30,
    })
    setErrorModal('')
    setModalAbierto(true)
  }

  async function handleEliminarCita() {
    if (!selectedCita) return
    setEliminando(true)

    const res = await fetch('/api/cancel-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citaId: selectedCita.id }),
    })

    setEliminando(false)

    if (!res.ok) {
      setModalEliminar(false)
      return
    }

    setCitas((prev) => prev.filter((c) => c.id !== selectedCita.id))
    setEventos((prev) => prev.filter((e) => e.id !== selectedCita.id))
    setModalEliminar(false)
    closePanel()
    router.refresh()
  }

  async function handleGuardarCita() {
    if (!nuevaCita.pacienteId) { setErrorModal('Selecciona un paciente.'); return }
    if (!nuevaCita.fecha) { setErrorModal('Ingresa una fecha.'); return }
    if (!nuevaCita.hora) { setErrorModal('Ingresa una hora.'); return }

    setGuardando(true)
    setErrorModal('')

    const inicio = new Date(`${nuevaCita.fecha}T${nuevaCita.hora}:00`)
    const fin = new Date(inicio.getTime() + nuevaCita.duracion * 60000)
    const supabase = createClient()

    const { data: citaInsertada, error } = await supabase
      .from('citas')
      .insert({
        paciente_id: nuevaCita.pacienteId,
        fecha_inicio: inicio.toISOString(),
        fecha_fin: fin.toISOString(),
        estado: 'confirmada',
      })
      .select('*, pacientes(nombre)')
      .single()

    setGuardando(false)
    if (error || !citaInsertada) {
      setErrorModal('No se pudo guardar la cita. Intenta nuevamente.')
      return
    }

    const nuevaCitaInsertada = citaInsertada as CitaConPaciente
    setCitas((prev) => [...prev, nuevaCitaInsertada])
    setEventos((prev) => [...prev, citaToEvent(nuevaCitaInsertada, primary)])
    setModalAbierto(false)
    router.refresh()
  }

  function renderEventContent(arg: EventContentArg) {
    return (
      <div
        className="w-full px-1.5 py-0.5 rounded text-xs font-medium text-white truncate cursor-pointer select-none"
        style={{ backgroundColor: primary }}
      >
        {arg.event.title}
      </div>
    )
  }

  const sortedCitasDelDia = useMemo(() => {
    if (!selectedDate) return []
    const arr = citasMap.get(selectedDate) ?? []
    return [...arr].sort(
      (a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
    )
  }, [citasMap, selectedDate])

  return (
    <div className="relative flex">
      {/* ─── Área del calendario ─── */}
      <div
        ref={calendarAreaRef}
        className="flex-1 min-w-0 transition-all duration-300"
        style={{ marginRight: panelOpen ? 320 : 0 }}
      >
        {/* Botón "+ Nueva cita" */}
        <div className="flex justify-end mb-3">
          <button
            onClick={openNuevaCitaModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva cita
          </button>
        </div>

        {/* Estilos personalizados de FullCalendar */}
        <style>{`
          .fc-day-today {
            background-color: ${primaryLight} !important;
          }
          .fc-day-today .fc-daygrid-day-number {
            background-color: ${primary};
            color: #fff !important;
            border-radius: 50%;
            width: 26px;
            height: 26px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            padding: 0 !important;
            margin: 4px;
          }
          .fc-daygrid-day-number {
            font-size: 0.8125rem !important;
            color: #374151 !important;
            text-decoration: none !important;
            padding: 6px 8px !important;
          }
          .fc-daygrid-day { cursor: pointer; }
          .fc-event { border: none !important; background: transparent !important; padding: 1px 2px; }
          .fc-event-main { padding: 0 !important; }
          .fc-daygrid-event-harness { margin-bottom: 1px !important; }
          .fc-daygrid-more-link {
            font-size: 0.7rem !important;
            color: #6b7280 !important;
            background: #f3f4f6;
            border-radius: 4px;
            padding: 1px 5px;
            margin: 1px 2px;
          }
          .fc-daygrid-more-link:hover { background: #e5e7eb; }
          .fc-toolbar-title {
            font-size: 1rem !important;
            font-weight: 700 !important;
            color: #111827 !important;
          }
          .fc-button {
            background-color: #fff !important;
            border: 1px solid #e5e7eb !important;
            color: #374151 !important;
            border-radius: 8px !important;
            font-size: 0.8rem !important;
            padding: 0.3rem 0.7rem !important;
            box-shadow: none !important;
            font-weight: 500 !important;
          }
          .fc-button:hover { background-color: #f9fafb !important; }
          .fc-button:focus { box-shadow: none !important; }
          .fc-button-active, .fc-button:active { background-color: #f3f4f6 !important; }
          .fc-col-header-cell { padding: 8px 0 !important; }
          .fc-col-header-cell-cushion {
            font-size: 0.7rem !important;
            font-weight: 600 !important;
            color: #9ca3af !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-decoration: none !important;
          }
          .fc-scrollgrid { border: none !important; }
          .fc-scrollgrid-section > td { border: none !important; }
          .fc-scrollgrid td, .fc-scrollgrid th { border-color: #f3f4f6 !important; }
          .fc-popover { display: none !important; }
        `}</style>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          buttonText={{ today: 'Hoy' }}
          height="calc(100vh - 220px)"
          events={eventos}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          dayMaxEvents={3}
          eventContent={renderEventContent}
          moreLinkContent={(arg) => `+${arg.num} más`}
          moreLinkClick={(arg) => {
            openDayPanel(toDateKey((arg as { date: Date }).date))
          }}
        />
      </div>

      {/* ─── Panel lateral ─── */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full bg-white z-30 flex flex-col
          transition-transform duration-300 ease-out border-l border-gray-100
          w-full md:w-80 ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {panelOpen && selectedDate && (
          <>
            {/* Cabecera del panel */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 shrink-0">
              {selectedCita && (
                <button
                  onClick={() => setSelectedCita(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors shrink-0"
                  aria-label="Volver"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h2 className="flex-1 min-w-0 text-sm font-semibold text-gray-900 truncate">
                {selectedCita ? 'Detalle de cita' : formatFechaTitulo(selectedDate)}
              </h2>
              <button
                onClick={closePanel}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors shrink-0"
                aria-label="Cerrar panel"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cuerpo del panel */}
            <div className="flex-1 overflow-y-auto">
              {selectedCita ? (
                /* Vista de detalle */
                <div className="px-5 py-5 space-y-5">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Paciente
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedCita.pacientes?.nombre ?? 'Sin nombre'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Horario
                    </p>
                    <p className="text-sm text-gray-700">
                      {formatHora(selectedCita.fecha_inicio)} – {formatHora(selectedCita.fecha_fin)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Estado
                    </p>
                    {(() => {
                      const badge =
                        ESTADO_BADGE[selectedCita.estado] ?? {
                          bg: 'bg-gray-100',
                          text: 'text-gray-600',
                          label: selectedCita.estado,
                        }
                      return (
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      )
                    })()}
                  </div>

                  {selectedCita.tipo_cita && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                        Tipo
                      </p>
                      <p className="text-sm text-gray-700">{selectedCita.tipo_cita}</p>
                    </div>
                  )}

                  {selectedCita.meet_link && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                        Google Meet
                      </p>
                      <a
                        href={selectedCita.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Unirse a la reunión
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}

                  {selectedCita.paciente_id && (
                    <div className="pt-2">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/pacientes/${selectedCita.paciente_id}`)
                        }
                        className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: primary }}
                      >
                        Ver ficha del paciente
                      </button>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={() => setModalEliminar(true)}
                      className="w-full py-2.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                    >
                      Eliminar cita
                    </button>
                  </div>
                </div>
              ) : (
                /* Vista de lista */
                <div className="py-2">
                  {sortedCitasDelDia.length === 0 ? (
                    <div className="px-5 py-12 flex flex-col items-center gap-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">Sin citas para este día</p>
                      <button
                        onClick={openNuevaCitaModal}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: primary }}
                      >
                        + Agendar cita
                      </button>
                    </div>
                  ) : (
                    sortedCitasDelDia.map((cita) => {
                      const badge =
                        ESTADO_BADGE[cita.estado] ?? {
                          bg: 'bg-gray-100',
                          text: 'text-gray-600',
                          label: cita.estado,
                        }
                      return (
                        <button
                          key={cita.id}
                          onClick={() => setSelectedCita(cita)}
                          className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                        >
                          <div
                            className="w-0.5 self-stretch rounded-full shrink-0"
                            style={{ backgroundColor: primary }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {cita.pacientes?.nombre ?? 'Sin nombre'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatHora(cita.fecha_inicio)}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Backdrop móvil para cerrar el panel */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden bg-black/20"
          onClick={closePanel}
        />
      )}

      {/* ─── Modal: Nueva cita ─── */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
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
                  Fecha
                </label>
                <input
                  type="date"
                  value={nuevaCita.fecha}
                  onChange={(e) =>
                    setNuevaCita((p) => ({ ...p, fecha: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={nuevaCita.hora}
                  onChange={(e) =>
                    setNuevaCita((p) => ({ ...p, hora: e.target.value }))
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

      {/* ─── Modal: Confirmar eliminación de cita ─── */}
      {modalEliminar && selectedCita && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-6 pb-2 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-900">¿Eliminar esta cita?</h2>
              <p className="text-sm text-gray-500">
                Se eliminará la cita de{' '}
                <span className="font-medium text-gray-700">
                  {selectedCita.pacientes?.nombre ?? 'este paciente'}
                </span>{' '}
                del{' '}
                {new Date(selectedCita.fecha_inicio).toLocaleDateString('es-CL', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}{' '}
                a las {formatHora(selectedCita.fecha_inicio)}.
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="px-6 py-4 flex gap-3">
              <button
                onClick={() => setModalEliminar(false)}
                disabled={eliminando}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarCita}
                disabled={eliminando}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
