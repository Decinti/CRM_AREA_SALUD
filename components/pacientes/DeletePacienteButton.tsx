'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DeletePacienteButton({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleEliminar() {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.from('pacientes').delete().eq('id', id)

    if (error) {
      setError('No se pudo eliminar el paciente. Intenta nuevamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard/pacientes')
    router.refresh()
  }

  if (!confirmando) {
    return (
      <button
        onClick={() => setConfirmando(true)}
        className="flex items-center gap-2 text-sm text-red-400 hover:text-red-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Eliminar paciente
      </button>
    )
  }

  return (
    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
      <p className="text-sm font-medium text-red-800 mb-1">
        ¿Eliminar a {nombre}?
      </p>
      <p className="text-xs text-red-600 mb-4">
        Esta acción es permanente y no se puede deshacer. Se eliminarán todos los datos del paciente.
      </p>

      {error && <p className="text-xs text-red-700 bg-red-100 px-3 py-2 rounded-lg mb-3">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={handleEliminar}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
        >
          {loading ? 'Eliminando...' : 'Sí, eliminar'}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
