import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { clientConfig } from '@/lib/config'
import type { Paciente } from '@/types/paciente'

export default async function FichaPacientePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: paciente } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!paciente) notFound()

  const p = paciente as Paciente
  const primary = clientConfig.colorPrimary
  const secondary = clientConfig.colorSecondary

  const campos: { label: string; value: string | null }[] = [
    { label: 'Email', value: p.email },
    { label: 'Teléfono', value: p.telefono },
    {
      label: 'Fecha de nacimiento',
      value: p.fecha_nacimiento
        ? new Date(p.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : null,
    },
  ]

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
        <Link href="/dashboard/pacientes" className="hover:text-gray-600 transition-colors">
          Pacientes
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{p.nombre}</span>
      </div>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{ backgroundColor: secondary, color: primary }}
          >
            {p.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{p.nombre}</h1>
            <span
              className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={
                p.estado === 'activo'
                  ? { backgroundColor: secondary, color: primary }
                  : { backgroundColor: '#F3F4F6', color: '#6B7280' }
              }
            >
              {p.estado === 'activo' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <Link
          href={`/dashboard/pacientes/${p.id}/editar`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {campos.map(({ label, value }) => (
          <div key={label} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-1">
            <span className="text-sm text-gray-400 sm:w-44 shrink-0">{label}</span>
            <span className="text-sm text-gray-900">{value ?? '—'}</span>
          </div>
        ))}

        {p.notas && (
          <div className="px-6 py-4">
            <span className="text-sm text-gray-400 block mb-2">Notas</span>
            <p className="text-sm text-gray-900 whitespace-pre-line">{p.notas}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Registrado el{' '}
        {new Date(p.created_at).toLocaleDateString('es-CL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  )
}
