'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { clientConfig } from '@/lib/config'
import type { CitaConPaciente } from '@/types/cita'

type Vista = 'semana' | 'mes'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const FIRST_HOUR = 7
const LAST_HOUR = 21
const HOUR_HEIGHT = 64
const MIN_EVENT_HEIGHT = 24
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i)

const ESTADO_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  confirmada: { bg: '#F0FDF4', border: '#16A34A', text: '#15803D' },
  cancelada:  { bg: '#FEF2F2', border: '#DC2626', text: '#DC2626' },
  reagendada: { bg: '#FEFCE8', border: '#CA8A04', text: '#A16207' },
  completada: { bg: '#EEF2FF', border: '#4338CA', text: '#3730A3' },
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatHora(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-CL', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

function minutesFromFirstHour(date: Date): number {
  return (date.getHours() - FIRST_HOUR) * 60 + date.getMinutes()
}

// ─── Vista semana (grilla tipo Google Calendar) ───────────────────────────────

function VistaSemana({
  diasSemana,
  citas,
  today,
  primary,
  secondary,
}: {
  diasSemana: Date[]
  citas: CitaConPaciente[]
  today: Date
  primary: string
  secondary: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [nowMinutes, setNowMinutes] = useState<number | null>(null)

  // Línea de "hora actual"
  useEffect(() => {
    function updateNow() {
      const now = new Date()
      setNowMinutes(minutesFromFirstHour(now))
    }
    updateNow()
    const id = setInterval(updateNow, 60_000)
    return () => clearInterval(id)
  }, [])

  // Scroll automático a hora actual al montar
  useEffect(() => {
    if (scrollRef.current && nowMinutes !== null) {
      const scrollTo = Math.max(0, (nowMinutes - 60) * (HOUR_HEIGHT / 60))
      scrollRef.current.scrollTop = scrollTo
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function citasDelDia(day: Date): CitaConPaciente[] {
    return citas.filter((c) => isSameDay(new Date(c.fecha_inicio), day))
  }

  const totalHeight = HOURS.length * HOUR_HEIGHT

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Cabecera días */}
      <div
        className="grid border-b border-gray-100 sticky top-0 bg-white z-20"
        style={{ gridTemplateColumns: '52px repeat(7, minmax(0, 1fr))' }}
      >
        <div className="border-r border-gray-100" />
        {diasSemana.map((dia) => {
          const esHoy = isSameDay(dia, today)
          const diaSemanaIdx = dia.getDay() === 0 ? 6 : dia.getDay() - 1
          return (
            <div
              key={dia.toISOString()}
              className="py-2 text-center border-r border-gray-100 last:border-r-0"
            >
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                {DIAS_CORTOS[diaSemanaIdx]}
              </div>
              <div
                className="text-sm font-bold mx-auto w-8 h-8 flex items-center justify-center rounded-full"
                style={esHoy ? { backgroundColor: primary, color: 'white' } : { color: '#374151' }}
              >
                {dia.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Cuerpo scrolleable */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)', minHeight: 400 }}>
        <div
          className="grid relative"
          style={{ gridTemplateColumns: '52px repeat(7, minmax(0, 1fr))', height: totalHeight }}
        >
          {/* Columna de horas */}
          <div className="relative border-r border-gray-100">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: (h - FIRST_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              >
                <span className="text-xs text-gray-300 -mt-2 tabular-nums">
                  {h.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {diasSemana.map((dia) => {
            const esHoy = isSameDay(dia, today)
            const citasDia = citasDelDia(dia)

            return (
              <div
                key={dia.toISOString()}
                className="relative border-r border-gray-100 last:border-r-0"
                style={{ height: totalHeight }}
              >
                {/* Líneas de hora */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute w-full border-b border-gray-50"
                    style={{ top: (h - FIRST_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  />
                ))}

                {/* Fondo suave para "hoy" */}
                {esHoy && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundColor: secondary, opacity: 0.18 }}
                  />
                )}

                {/* Línea de hora actual */}
                {esHoy && nowMinutes !== null && nowMinutes >= 0 && nowMinutes <= HOURS.length * 60 && (
                  <div
                    className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                    style={{ top: nowMinutes * (HOUR_HEIGHT / 60) }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 -ml-1.5"
                      style={{ backgroundColor: primary }}
                    />
                    <div className="flex-1 h-px" style={{ backgroundColor: primary }} />
                  </div>
                )}

                {/* Eventos */}
                {citasDia.map((c) => {
                  const start = new Date(c.fecha_inicio)
                  const end = new Date(c.fecha_fin)
                  const topMin = Math.max(0, minutesFromFirstHour(start))
                  const durMin = Math.max(
                    MIN_EVENT_HEIGHT / (HOUR_HEIGHT / 60),
                    (end.getTime() - start.getTime()) / 60000
                  )
                  const top = topMin * (HOUR_HEIGHT / 60)
                  const height = Math.max(MIN_EVENT_HEIGHT, durMin * (HOUR_HEIGHT / 60))
                  const style = ESTADO_STYLE[c.estado] ?? { bg: secondary, border: primary, text: primary }

                  return (
                    <div
                      key={c.id}
                      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 overflow-hidden z-10"
                      style={{
                        top,
                        height,
                        backgroundColor: style.bg,
                        borderLeft: `3px solid ${style.border}`,
                      }}
                      title={`${c.pacientes?.nombre ?? ''} · ${formatHora(c.fecha_inicio)} – ${formatHora(c.fecha_fin)}`}
                    >
                      <p
                        className="text-xs font-semibold leading-tight truncate"
                        style={{ color: style.text }}
                      >
                        {c.pacientes?.nombre ?? 'Sin nombre'}
                      </p>
                      {height >= 40 && (
                        <p
                          className="text-xs leading-tight truncate mt-0.5"
                          style={{ color: style.text, opacity: 0.75 }}
                        >
                          {formatHora(c.fecha_inicio)} – {formatHora(c.fecha_fin)}
                        </p>
                      )}
                      {height >= 60 && c.meet_link && (
                        <a
                          href={c.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline mt-0.5 block truncate"
                          style={{ color: style.text, opacity: 0.75 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Meet
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Vista mes ────────────────────────────────────────────────────────────────

function VistaMes({
  referencia,
  citas,
  today,
  primary,
  secondary,
}: {
  referencia: Date
  citas: CitaConPaciente[]
  today: Date
  primary: string
  secondary: string
}) {
  const ESTADO_CHIP: Record<string, { bg: string; text: string }> = {
    confirmada: { bg: '#DCFCE7', text: '#16A34A' },
    cancelada:  { bg: '#FEE2E2', text: '#DC2626' },
    reagendada: { bg: '#FEF9C3', text: '#CA8A04' },
    completada: { bg: '#E0E7FF', text: '#4338CA' },
  }

  const diasMes = useMemo(() => {
    const inicio = new Date(referencia.getFullYear(), referencia.getMonth(), 1)
    const primerDia = inicio.getDay() === 0 ? 6 : inicio.getDay() - 1
    const totalDias = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0).getDate()
    const dias: (Date | null)[] = Array(primerDia).fill(null)
    for (let i = 1; i <= totalDias; i++) {
      dias.push(new Date(referencia.getFullYear(), referencia.getMonth(), i))
    }
    while (dias.length % 7 !== 0) dias.push(null)
    return dias
  }, [referencia])

  function citasDelDia(day: Date) {
    return citas.filter((c) => isSameDay(new Date(c.fecha_inicio), day))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DIAS_CORTOS.map((d) => (
          <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {diasMes.map((dia, i) => {
          if (!dia) {
            return <div key={`vacio-${i}`} className="border-b border-r border-gray-50 min-h-[90px] bg-gray-50/40" />
          }

          const citasDia = citasDelDia(dia)
          const esHoy = isSameDay(dia, today)
          const esEsteMes = dia.getMonth() === referencia.getMonth()

          return (
            <div
              key={dia.toISOString()}
              className={`border-b border-r border-gray-50 min-h-[90px] p-1.5 ${!esEsteMes ? 'bg-gray-50/40' : ''}`}
            >
              <div
                className="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1"
                style={
                  esHoy
                    ? { backgroundColor: primary, color: 'white' }
                    : { color: esEsteMes ? '#374151' : '#D1D5DB' }
                }
              >
                {dia.getDate()}
              </div>

              <div className="space-y-0.5">
                {citasDia.slice(0, 3).map((c) => {
                  const chip = ESTADO_CHIP[c.estado] ?? { bg: secondary, text: primary }
                  return (
                    <div
                      key={c.id}
                      className="text-xs px-1 py-0.5 rounded truncate leading-tight"
                      style={{ backgroundColor: chip.bg, color: chip.text }}
                      title={`${formatHora(c.fecha_inicio)} ${c.pacientes?.nombre ?? ''}`}
                    >
                      {formatHora(c.fecha_inicio)} {c.pacientes?.nombre.split(' ')[0] ?? '—'}
                    </div>
                  )
                })}
                {citasDia.length > 3 && (
                  <div className="text-xs text-gray-400 px-1">+{citasDia.length - 3} más</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CalendarioView({ citas }: { citas: CitaConPaciente[] }) {
  const [vista, setVista] = useState<Vista>('semana')
  const [referencia, setReferencia] = useState(new Date())
  const primary = clientConfig.colorPrimary
  const secondary = clientConfig.colorSecondary
  const today = new Date()

  const diasSemana = useMemo(() => {
    const inicio = startOfWeek(referencia)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio)
      d.setDate(inicio.getDate() + i)
      return d
    })
  }, [referencia])

  function navegar(dir: 1 | -1) {
    const nueva = new Date(referencia)
    vista === 'semana' ? nueva.setDate(nueva.getDate() + dir * 7) : nueva.setMonth(nueva.getMonth() + dir)
    setReferencia(nueva)
  }

  const titulo =
    vista === 'semana'
      ? `${diasSemana[0].getDate()} – ${diasSemana[6].getDate()} de ${MESES[diasSemana[6].getMonth()]} ${diasSemana[6].getFullYear()}`
      : `${MESES[referencia.getMonth()]} ${referencia.getFullYear()}`

  return (
    <div>
      {/* Barra de controles */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1">
          <button onClick={() => navegar(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Anterior">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setReferencia(new Date())}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium transition-colors"
          >
            Hoy
          </button>
          <button onClick={() => navegar(1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Siguiente">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <span className="text-base font-semibold text-gray-800 flex-1">{titulo}</span>

        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => setVista('semana')}
            className="px-4 py-1.5 font-medium transition-colors"
            style={vista === 'semana' ? { backgroundColor: primary, color: 'white' } : { backgroundColor: 'white', color: '#6B7280' }}
          >
            Semana
          </button>
          <button
            onClick={() => setVista('mes')}
            className="px-4 py-1.5 font-medium transition-colors"
            style={vista === 'mes' ? { backgroundColor: primary, color: 'white' } : { backgroundColor: 'white', color: '#6B7280' }}
          >
            Mes
          </button>
        </div>
      </div>

      {vista === 'semana' && (
        <VistaSemana
          diasSemana={diasSemana}
          citas={citas}
          today={today}
          primary={primary}
          secondary={secondary}
        />
      )}

      {vista === 'mes' && (
        <VistaMes
          referencia={referencia}
          citas={citas}
          today={today}
          primary={primary}
          secondary={secondary}
        />
      )}
    </div>
  )
}
