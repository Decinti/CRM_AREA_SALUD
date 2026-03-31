import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()

  const [{ count: totalActivos }, { count: totalInactivos }] = await Promise.all([
    supabase
      .from('pacientes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo'),
    supabase
      .from('pacientes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'inactivo'),
  ])

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen general de tus pacientes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <MetricCard
          label="Pacientes activos"
          value={totalActivos ?? 0}
          color="#534AB7"
          bg="#EEEDFE"
        />
        <MetricCard
          label="Pacientes inactivos"
          value={totalInactivos ?? 0}
          color="#6B7280"
          bg="#F3F4F6"
        />
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  color,
  bg,
}: {
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: bg }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}
