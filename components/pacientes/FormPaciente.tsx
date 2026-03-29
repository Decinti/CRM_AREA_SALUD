'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { clientConfig } from '@/lib/config'
import type { Paciente, PacienteFormData } from '@/types/paciente'

interface Props {
  paciente?: Paciente
  modo: 'crear' | 'editar'
}

const camposVacios: PacienteFormData = {
  nombre: '',
  email: '',
  telefono: '',
  fecha_nacimiento: '',
  estado: 'activo',
  notas: '',
}

export default function FormPaciente({ paciente, modo }: Props) {
  const router = useRouter()
  const primary = clientConfig.colorPrimary

  const [form, setForm] = useState<PacienteFormData>(
    paciente
      ? {
          nombre: paciente.nombre,
          email: paciente.email ?? '',
          telefono: paciente.telefono ?? '',
          fecha_nacimiento: paciente.fecha_nacimiento ?? '',
          estado: paciente.estado,
          notas: paciente.notas ?? '',
        }
      : camposVacios
  )
  const [errores, setErrores] = useState<Partial<Record<keyof PacienteFormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errores[name as keyof PacienteFormData]) {
      setErrores((prev) => ({ ...prev, [name]: '' }))
    }
  }

  function validar() {
    const nuevosErrores: typeof errores = {}
    if (!form.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio.'
    }
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return

    setLoading(true)
    setErrorGeneral('')

    const supabase = createClient()
    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim() || null,
      telefono: form.telefono.trim() || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      estado: form.estado,
      notas: form.notas.trim() || null,
      updated_at: new Date().toISOString(),
    }

    if (modo === 'crear') {
      const { data, error } = await supabase
        .from('pacientes')
        .insert(payload)
        .select('id')
        .single()

      if (error || !data) {
        setErrorGeneral('Ocurrió un error al guardar. Intenta nuevamente.')
        setLoading(false)
        return
      }
      router.push(`/dashboard/pacientes/${data.id}`)
    } else {
      const { error } = await supabase
        .from('pacientes')
        .update(payload)
        .eq('id', paciente!.id)

      if (error) {
        setErrorGeneral('Ocurrió un error al guardar. Intenta nuevamente.')
        setLoading(false)
        return
      }
      router.push(`/dashboard/pacientes/${paciente!.id}`)
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        <Campo label="Nombre *" error={errores.nombre}>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Nombre completo"
            className={inputClass(!!errores.nombre)}
          />
        </Campo>

        <Campo label="Email">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            className={inputClass(false)}
          />
        </Campo>

        <Campo label="Teléfono">
          <input
            type="tel"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            placeholder="+56 9 1234 5678"
            className={inputClass(false)}
          />
        </Campo>

        <Campo label="Fecha de nacimiento">
          <input
            type="date"
            name="fecha_nacimiento"
            value={form.fecha_nacimiento}
            onChange={handleChange}
            className={inputClass(false)}
          />
        </Campo>

        <Campo label="Estado">
          <select
            name="estado"
            value={form.estado}
            onChange={handleChange}
            className={inputClass(false)}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </Campo>

        <Campo label="Notas">
          <textarea
            name="notas"
            value={form.notas}
            onChange={handleChange}
            rows={4}
            placeholder="Observaciones, motivo de consulta, etc."
            className={`${inputClass(false)} resize-none`}
          />
        </Campo>
      </div>

      {errorGeneral && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{errorGeneral}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: primary }}
        >
          {loading ? 'Guardando...' : modo === 'crear' ? 'Crear paciente' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function Campo({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="px-6 py-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow ${
    hasError ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-purple-100'
  }`
}
