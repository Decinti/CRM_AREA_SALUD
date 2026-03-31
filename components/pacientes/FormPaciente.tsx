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
  alias: '',
  rut: '',
  fecha_nacimiento: '',
  genero: '',
  seguro_medico: '',
  telefono: '',
  telefono_alternativo: '',
  email: '',
  direccion: '',
  contacto_emergencia_nombre: '',
  contacto_emergencia_parentesco: '',
  contacto_emergencia_telefono: '',
  numero_expediente: '',
  como_llego: '',
  notas: '',
  estado: 'activo',
}

function fromPaciente(p: Paciente): PacienteFormData {
  return {
    nombre: p.nombre,
    alias: p.alias ?? '',
    rut: p.rut ?? '',
    fecha_nacimiento: p.fecha_nacimiento ?? '',
    genero: p.genero ?? '',
    seguro_medico: p.seguro_medico ?? '',
    telefono: p.telefono ?? '',
    telefono_alternativo: p.telefono_alternativo ?? '',
    email: p.email ?? '',
    direccion: p.direccion ?? '',
    contacto_emergencia_nombre: p.contacto_emergencia_nombre ?? '',
    contacto_emergencia_parentesco: p.contacto_emergencia_parentesco ?? '',
    contacto_emergencia_telefono: p.contacto_emergencia_telefono ?? '',
    numero_expediente: p.numero_expediente ?? '',
    como_llego: p.como_llego ?? '',
    notas: p.notas ?? '',
    estado: p.estado,
  }
}

export default function FormPaciente({ paciente, modo }: Props) {
  const router = useRouter()
  const primary = clientConfig.colorPrimary

  const [form, setForm] = useState<PacienteFormData>(
    paciente ? fromPaciente(paciente) : camposVacios
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
    if (!form.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio.'
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
      alias: form.alias.trim() || null,
      rut: form.rut.trim() || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      genero: form.genero || null,
      seguro_medico: form.seguro_medico.trim() || null,
      telefono: form.telefono.trim() || null,
      telefono_alternativo: form.telefono_alternativo.trim() || null,
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
      contacto_emergencia_nombre: form.contacto_emergencia_nombre.trim() || null,
      contacto_emergencia_parentesco: form.contacto_emergencia_parentesco.trim() || null,
      contacto_emergencia_telefono: form.contacto_emergencia_telefono.trim() || null,
      numero_expediente: form.numero_expediente.trim() || null,
      como_llego: form.como_llego || null,
      notas: form.notas.trim() || null,
      estado: form.estado,
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
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Datos Personales */}
      <Seccion titulo="Datos Personales">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-gray-50">
          <Campo label="Nombre completo *" error={errores.nombre} className="sm:border-r sm:border-gray-50">
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Nombre y apellido"
              className={inputClass(!!errores.nombre)}
            />
          </Campo>
          <Campo label="Alias">
            <input
              type="text"
              name="alias"
              value={form.alias}
              onChange={handleChange}
              placeholder="Ej: la señora del martes..."
              className={inputClass(false)}
            />
          </Campo>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-gray-50 border-t border-gray-50">
          <Campo label="RUT" className="sm:border-r sm:border-gray-50">
            <input
              type="text"
              name="rut"
              value={form.rut}
              onChange={handleChange}
              placeholder="12.345.678-9"
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
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-gray-50 border-t border-gray-50">
          <Campo label="Género" className="sm:border-r sm:border-gray-50">
            <select name="genero" value={form.genero} onChange={handleChange} className={inputClass(false)}>
              <option value="">Seleccionar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="no_binario">No binario</option>
              <option value="prefiero_no_decir">Prefiero no decir</option>
            </select>
          </Campo>
          <Campo label="Seguro médico">
            <input
              type="text"
              name="seguro_medico"
              value={form.seguro_medico}
              onChange={handleChange}
              placeholder="Ej: Fonasa, Isapre Cruz Blanca..."
              className={inputClass(false)}
            />
          </Campo>
        </div>
      </Seccion>

      {/* Información de Contacto */}
      <Seccion titulo="Información de Contacto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-gray-50">
          <Campo label="Teléfono principal" className="sm:border-r sm:border-gray-50">
            <input
              type="tel"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              placeholder="+56 9 1234 5678"
              className={inputClass(false)}
            />
          </Campo>
          <Campo label="Teléfono alternativo">
            <input
              type="tel"
              name="telefono_alternativo"
              value={form.telefono_alternativo}
              onChange={handleChange}
              placeholder="+56 9 8765 4321"
              className={inputClass(false)}
            />
          </Campo>
        </div>
        <Campo label="Correo electrónico" className="border-t border-gray-50">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            className={inputClass(false)}
          />
        </Campo>
        <Campo label="Dirección" className="border-t border-gray-50">
          <input
            type="text"
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            placeholder="Calle, número, ciudad"
            className={inputClass(false)}
          />
        </Campo>
      </Seccion>

      {/* Contacto de Emergencia */}
      <Seccion titulo="Contacto de Emergencia">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-gray-50">
          <Campo label="Nombre del contacto" className="sm:border-r sm:border-gray-50">
            <input
              type="text"
              name="contacto_emergencia_nombre"
              value={form.contacto_emergencia_nombre}
              onChange={handleChange}
              placeholder="Nombre completo"
              className={inputClass(false)}
            />
          </Campo>
          <Campo label="Parentesco">
            <input
              type="text"
              name="contacto_emergencia_parentesco"
              value={form.contacto_emergencia_parentesco}
              onChange={handleChange}
              placeholder="Ej: madre, cónyuge, hermano..."
              className={inputClass(false)}
            />
          </Campo>
        </div>
        <Campo label="Teléfono" className="border-t border-gray-50">
          <input
            type="tel"
            name="contacto_emergencia_telefono"
            value={form.contacto_emergencia_telefono}
            onChange={handleChange}
            placeholder="+56 9 1234 5678"
            className={inputClass(false)}
          />
        </Campo>
      </Seccion>

      {/* Datos Administrativos */}
      <Seccion titulo="Datos Administrativos">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-gray-50">
          <Campo label="N° Expediente Físico" className="sm:border-r sm:border-gray-50">
            <input
              type="text"
              name="numero_expediente"
              value={form.numero_expediente}
              onChange={handleChange}
              placeholder="Ej: EXP-0042"
              className={inputClass(false)}
            />
          </Campo>
          <Campo label="¿Cómo llegó al consultorio?">
            <select name="como_llego" value={form.como_llego} onChange={handleChange} className={inputClass(false)}>
              <option value="">Seleccionar</option>
              <option value="derivacion_medica">Derivación médica</option>
              <option value="recomendacion">Recomendación de conocido</option>
              <option value="redes_sociales">Redes sociales</option>
              <option value="busqueda_internet">Búsqueda en internet</option>
              <option value="otro">Otro</option>
            </select>
          </Campo>
        </div>
        <Campo label="Estado" className="border-t border-gray-50">
          <select name="estado" value={form.estado} onChange={handleChange} className={inputClass(false)}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </Campo>
        <Campo label="Notas generales" className="border-t border-gray-50">
          <textarea
            name="notas"
            value={form.notas}
            onChange={handleChange}
            rows={4}
            placeholder="Observaciones, motivo de consulta, información adicional..."
            className={`${inputClass(false)} resize-none`}
          />
        </Campo>
      </Seccion>

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

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{titulo}</h2>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )
}

function Campo({
  label,
  error,
  children,
  className = '',
}: {
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`px-6 py-4 ${className}`}>
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
