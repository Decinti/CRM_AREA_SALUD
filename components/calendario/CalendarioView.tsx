'use client'

import { useState, useMemo } from 'react'
import { clientConfig } from '@/lib/config'
import type { CitaConPaciente } from '@/types/cita'

type Vista = 'semana' | 'mes'

const DIAS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const ESTADO_COLORS: Record<string, { bg: string; text: string }> = {
  confirmada: { bg: '#DCFCE7', text: '#16A34A' },
  cancelada: { bg: '#FEE2E2', text: '#DC2626' },
  reagendada: { bg: '#FEF9C3', text: '#CA8A04' },
  completada: { bg: '#E0E7FF', text: '#4338CA' },
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatHora(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function CitaCard({
  cita,
  primary,
  secondary,
}: {
  cita: CitaConPaciente
  primary: string
  secondary: string
}) {
  const estadoColor = ESTADO_COLORS[cita.estado] ?? { bg: secondary, text: primary }

  return (
    <div className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
      <div className="text-sm text-gray-400 w-28 shrink-0 pt-0.5 tabular-nums">
        {formatHora(cita.fecha_inicio)} – {formatHora(cita.fecha_fin)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {cita.pacientes?.nombre ?? 'Paciente sin nombre'}
        </p>
        {cita.tipo_cita && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{cita.tipo_cita}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
          style={{ backgroundColor: estadoColor.bg, color: estadoColor.text }}
        >
          {cita.estado}
        </span>
        {cita.meet_link && (
          <a
            href={cita.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
          >
            Meet
          </a>
        )}
      </div>
    </div>
  )
}

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

  function citasDelDia(day: Date): CitaConPaciente[] {
    return citas.filter((c) => isSameDay(new Date(c.fecha_inicio), day))
  }

  function navegar(dir: 1 | -1) {
    const nueva = new Date(referencia)
    if (vista === 'semana') {
      nueva.setDate(nueva.getDate() + dir * 7)
    } else {
      nueva.setMonth(nueva.getMonth() + dir)
    }
    setReferencia(nueva)
  }

  const titulo =
    vista === 'semana'
      ? `${diasSemana[0].getDate()} – ${diasSemana[6].getDate()} de ${MESES[diasSemana[6].getMonth()]} ${diasSemana[6].getFullYear()}`
      : `${MESES[referencia.getMonth()]} ${referencia.getFullYear()}`

  const totalCitasPeriodo =
    vista === 'semana'
      ? diasSemana.reduce((acc, d) => acc + citasDelDia(d).length, 0)
      : diasMes.reduce((acc, d) => acc + (d ? citasDelDia(d).length : 0), 0)

  return (
    <div>
      {/* Barra de controles */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navegar(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Anterior"
          >
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
          <button
            onClick={() => navegar(1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Siguiente"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-base font-semibold text-gray-800">{titulo}</span>
          {totalCitasPeriodo > 0 && (
            <span
              className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: secondary, color: primary }}
            >
              {totalCitasPeriodo} {totalCitasPeriodo === 1 ? 'cita' : 'citas'}
            </span>
          )}
        </div>

        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => setVista('semana')}
            className="px-4 py-1.5 font-medium transition-colors"
            style={
              vista === 'semana'
                ? { backgroundColor: primary, color: 'white' }
                : { backgroundColor: 'white', color: '#6B7280' }
            }
          >
            Semana
          </button>
          <button
            onClick={() => setVista('mes')}
            className="px-4 py-1.5 font-medium transition-colors"
            style={
              vista === 'mes'
                ? { backgroundColor: primary, color: 'white' }
                : { backgroundColor: 'white', color: '#6B7280' }
            }
          >
            Mes
          </button>
        </div>
      </div>

      {/* VISTA SEMANA */}
      {vista === 'semana' && (
        <div className="space-y-2">
          {diasSemana.map((dia) => {
            const citasDia = citasDelDia(dia)
            const esHoy = isSameDay(dia, today)

            return (
              <div
                key={dia.toISOString()}
                className="rounded-xl border bg-white overflow-hidden"
                style={{ borderColor: esHoy ? primary : '#F3F4F6' }}
              >
                <div
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{ backgroundColor: esHoy ? secondary : '#F9FAFB' }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: esHoy ? primary : '#374151' }}
                  >
                    {DIAS_FULL[dia.getDay()]}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: esHoy ? primary : '#9CA3AF' }}
                  >
                    {dia.getDate()} de {MESES[dia.getMonth()]}
                  </span>
                  {esHoy && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: primary, color: 'white' }}
                    >
                      Hoy
                    </span>
                  )}
                  {citasDia.length > 0 && (
                    <span
                      className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: secondary, color: primary }}
                    >
                      {citasDia.length} {citasDia.length === 1 ? 'cita' : 'citas'}
                    </span>
                  )}
                </div>

                {citasDia.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-300">Sin citas</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {citasDia.map((c) => (
                      <CitaCard key={c.id} cita={c} primary={primary} secondary={secondary} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* VISTA MES */}
      {vista === 'mes' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Cabecera días */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DIAS_CORTOS.map((d) => (
              <div
                key={d}
                className="py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grilla días */}
          <div className="grid grid-cols-7">
            {diasMes.map((dia, i) => {
              if (!dia) {
                return (
                  <div
                    key={`vacio-${i}`}
                    className="border-b border-r border-gray-50 min-h-[90px] bg-gray-50/40"
                  />
                )
              }

              const citasDia = citasDelDia(dia)
              const esHoy = isSameDay(dia, today)
              const esEsteMes = dia.getMonth() === referencia.getMonth()

              return (
                <div
                  key={dia.toISOString()}
                  className={`border-b border-r border-gray-50 min-h-[90px] p-1.5 ${
                    !esEsteMes ? 'bg-gray-50/40' : ''
                  }`}
                >
                  <div
                    className="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 transition-colors"
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
                      const estadoColor = ESTADO_COLORS[c.estado] ?? {
                        bg: secondary,
                        text: primary,
                      }
                      return (
                        <div
                          key={c.id}
                          className="text-xs px-1 py-0.5 rounded truncate leading-tight"
                          style={{ backgroundColor: estadoColor.bg, color: estadoColor.text }}
                          title={`${formatHora(c.fecha_inicio)} ${c.pacientes?.nombre ?? ''}`}
                        >
                          {formatHora(c.fecha_inicio)}{' '}
                          {c.pacientes?.nombre.split(' ')[0] ?? '—'}
                        </div>
                      )
                    })}
                    {citasDia.length > 3 && (
                      <div className="text-xs text-gray-400 px-1">
                        +{citasDia.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
