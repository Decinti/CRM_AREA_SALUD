import dynamic from 'next/dynamic'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { CitaConPaciente } from '@/types/cita'

const CalendarioCliente = dynamic(
  () => import('@/components/calendario/CalendarioCliente'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 text-gray-400 text-sm">
        Cargando calendario...
      </div>
    ),
  }
)

export default async function CalendarioPage() {
  const supabase = createServerSupabaseClient()

  const desde = new Date()
  desde.setMonth(desde.getMonth() - 2)
  const hasta = new Date()
  hasta.setMonth(hasta.getMonth() + 6)

  const [{ data: citas }, { data: pacientes }] = await Promise.all([
    supabase
      .from('citas')
      .select('*, pacientes(nombre)')
      .gte('fecha_inicio', desde.toISOString())
      .lte('fecha_inicio', hasta.toISOString())
      .order('fecha_inicio', { ascending: true }),
    supabase
      .from('pacientes')
      .select('id, nombre')
      .eq('estado', 'activo')
      .order('nombre', { ascending: true }),
  ])

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Calendario</h1>
      <CalendarioCliente
        citasIniciales={(citas as CitaConPaciente[]) ?? []}
        pacientes={pacientes ?? []}
      />
    </div>
  )
}
