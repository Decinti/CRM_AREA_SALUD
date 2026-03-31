'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { clientConfig } from '@/lib/config'
import type { Paciente, EstadoPaciente } from '@/types/paciente'

type FiltroEstado = 'todos' | 'activo' | 'inactivo'

export default function ListaPacientes({ pacientes }: { pacientes: Paciente[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstado>('todos')
  const [cambiandoId, setCambiandoId] = useState<string | null>(null)

  const primary = clientConfig.colorPrimary
  const secondary = clientConfig.colorSecondary

  const pacientesFiltrados = pacientes.filter((p) => {
    const texto = [p.nombre, p.alias].filter(Boolean).join(' ').toLowerCase()
    const coincideNombre = texto.includes(busqueda.toLowerCase())
    const coincideEstado = filtro === 'todos' || p.estado === filtro
    return coincideNombre && coincideEstado
  })

  async function cambiarEstado(paciente: Paciente) {
    const nuevoEstado: EstadoPaciente = paciente.estado === 'activo' ? 'inactivo' : 'activo'
    setCambiandoId(paciente.id)

    const supabase = createClient()
    await supabase
      .from('pacientes')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', paciente.id)

    setCambiandoId(null)
    startTransition(() => router.refresh())
  }

  const filtros: { label: string; value: FiltroEstado }[] = [
    { label: 'Todos', value: 'todos' },
    { label: 'Activos', value: 'activo' },
    { label: 'Inactivos', value: 'inactivo' },
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white"
          />
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {filtros.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-all"
              style={
                filtro === f.value
                  ? { backgroundColor: 'white', color: primary, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                  : { color: '#6B7280' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {pacientesFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">No se encontraron pacientes</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Paciente</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden sm:table-cell">Contacto</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pacientesFiltrados.map((paciente) => (
                <tr key={paciente.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/pacientes/${paciente.id}`} className="hover:underline">
                      <p className="text-sm font-medium text-gray-900">{paciente.nombre}</p>
                      {paciente.alias && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">&quot;{paciente.alias}&quot;</p>
                      )}
                      {paciente.fecha_nacimiento && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(paciente.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-CL', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <p className="text-sm text-gray-600">{paciente.email ?? '—'}</p>
                    <p className="text-xs text-gray-400">{paciente.telefono ?? ''}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={
                        paciente.estado === 'activo'
                          ? { backgroundColor: secondary, color: primary }
                          : { backgroundColor: '#F3F4F6', color: '#6B7280' }
                      }
                    >
                      {paciente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/pacientes/${paciente.id}/editar`}
                        className="text-xs text-gray-500 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => cambiarEstado(paciente)}
                        disabled={cambiandoId === paciente.id}
                        className="text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
                        style={{ color: primary, backgroundColor: secondary }}
                      >
                        {cambiandoId === paciente.id
                          ? '...'
                          : paciente.estado === 'activo'
                          ? 'Archivar'
                          : 'Reactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
