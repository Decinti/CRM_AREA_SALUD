import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import FormPaciente from '@/components/pacientes/FormPaciente'
import type { Paciente } from '@/types/paciente'

export default async function EditarPacientePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: paciente } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!paciente) notFound()

  const p = paciente as Paciente

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
        <Link href="/dashboard/pacientes" className="hover:text-gray-600 transition-colors">
          Pacientes
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/pacientes/${p.id}`}
          className="hover:text-gray-600 transition-colors"
        >
          {p.nombre}
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Editar</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Editar paciente</h1>
        <p className="text-sm text-gray-500 mt-1">{p.nombre}</p>
      </div>

      <FormPaciente paciente={p} modo="editar" />
    </div>
  )
}
