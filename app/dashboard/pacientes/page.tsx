import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { clientConfig } from '@/lib/config'
import ListaPacientes from '@/components/pacientes/ListaPacientes'
import type { Paciente } from '@/types/paciente'

export default async function PacientesPage() {
  const supabase = createServerSupabaseClient()
  const { data: pacientes } = await supabase
    .from('pacientes')
    .select('*')
    .order('nombre', { ascending: true })

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pacientes?.length ?? 0} paciente{pacientes?.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Link
          href="/dashboard/pacientes/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: clientConfig.colorPrimary }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo paciente
        </Link>
      </div>

      <ListaPacientes pacientes={(pacientes as Paciente[]) ?? []} />
    </div>
  )
}
