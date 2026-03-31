import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { clientConfig } from '@/lib/config'
import type { Paciente } from '@/types/paciente'

const GENERO_LABEL: Record<string, string> = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  no_binario: 'No binario',
  prefiero_no_decir: 'Prefiero no decir',
}

const COMO_LLEGO_LABEL: Record<string, string> = {
  derivacion_medica: 'Derivación médica',
  recomendacion: 'Recomendación de conocido',
  redes_sociales: 'Redes sociales',
  busqueda_internet: 'Búsqueda en internet',
  otro: 'Otro',
}

function formatFecha(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatWsp(telefono: string) {
  return telefono.replace(/\s/g, '').replace(/^00/, '+')
}

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

  const nombreCompleto = p.nombre

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
        <Link href="/dashboard/pacientes" className="hover:text-gray-600 transition-colors">
          Pacientes
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{nombreCompleto}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{ backgroundColor: secondary, color: primary }}
          >
            {p.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{nombreCompleto}</h1>
            {p.alias && <p className="text-sm text-gray-400 mt-0.5 italic">"{p.alias}"</p>}
            {p.rut && <p className="text-sm text-gray-400 mt-0.5">RUT: {p.rut}</p>}
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

        <div className="flex items-center gap-2 shrink-0">
          {p.telefono && (
            <a
              href={`https://wa.me/${formatWsp(p.telefono)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
          <Link
            href={`/dashboard/pacientes/${p.id}/editar`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Link>
        </div>
      </div>

      <div className="space-y-5">
        {/* Datos Personales */}
        <Seccion titulo="Datos Personales">
          <Fila label="Nombre completo" value={nombreCompleto} />
          <Fila label="Alias" value={p.alias} />
          <Fila label="RUT" value={p.rut} />
          <Fila
            label="Fecha de nacimiento"
            value={p.fecha_nacimiento ? formatFecha(p.fecha_nacimiento) : null}
          />
          <Fila label="Género" value={p.genero ? (GENERO_LABEL[p.genero] ?? p.genero) : null} />
          <Fila label="Seguro médico" value={p.seguro_medico} />
        </Seccion>

        {/* Información de Contacto */}
        <Seccion titulo="Información de Contacto">
          <Fila label="Teléfono principal" value={p.telefono} />
          <Fila label="Teléfono alternativo" value={p.telefono_alternativo} />
          <Fila label="Correo electrónico" value={p.email} />
          <Fila label="Dirección" value={p.direccion} />
        </Seccion>

        {/* Contacto de Emergencia */}
        <Seccion titulo="Contacto de Emergencia">
          <Fila label="Nombre del contacto" value={p.contacto_emergencia_nombre} />
          <Fila label="Parentesco" value={p.contacto_emergencia_parentesco} />
          <Fila label="Teléfono" value={p.contacto_emergencia_telefono} />
        </Seccion>

        {/* Datos Administrativos */}
        <Seccion titulo="Datos Administrativos">
          <Fila label="N° Expediente Físico" value={p.numero_expediente} />
          <Fila
            label="¿Cómo llegó al consultorio?"
            value={p.como_llego ? (COMO_LLEGO_LABEL[p.como_llego] ?? p.como_llego) : null}
          />
          {p.notas ? (
            <div className="px-6 py-4">
              <span className="text-sm text-gray-400 block mb-2">Notas generales</span>
              <p className="text-sm text-gray-900 whitespace-pre-line">{p.notas}</p>
            </div>
          ) : (
            <Fila label="Notas generales" value={null} />
          )}
        </Seccion>
      </div>

      <p className="text-xs text-gray-400 mt-6">
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

function Fila({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-1">
      <span className="text-sm text-gray-400 sm:w-52 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value ?? '—'}</span>
    </div>
  )
}
