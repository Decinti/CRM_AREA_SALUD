import Link from 'next/link'
import FormPaciente from '@/components/pacientes/FormPaciente'

export default function NuevoPacientePage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
        <Link href="/dashboard/pacientes" className="hover:text-gray-600 transition-colors">
          Pacientes
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Nuevo paciente</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Nuevo paciente</h1>
        <p className="text-sm text-gray-500 mt-1">Completa los datos del paciente</p>
      </div>

      <FormPaciente modo="crear" />
    </div>
  )
}
