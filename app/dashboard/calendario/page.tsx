import { createServerSupabaseClient } from '@/lib/supabase-server'
import CalendarioView from '@/components/calendario/CalendarioView'
import type { CitaConPaciente } from '@/types/cita'

export default async function CalendarioPage() {
  const supabase = createServerSupabaseClient()

  const desde = new Date()
  desde.setMonth(desde.getMonth() - 2)

  const hasta = new Date()
  hasta.setMonth(hasta.getMonth() + 6)

  const { data: citas } = await supabase
    .from('citas')
    .select('*, pacientes(nombre)')
    .gte('fecha_inicio', desde.toISOString())
    .lte('fecha_inicio', hasta.toISOString())
    .order('fecha_inicio', { ascending: true })

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendario</h1>
      <CalendarioView citas={(citas as CitaConPaciente[]) ?? []} />
    </div>
  )
}
