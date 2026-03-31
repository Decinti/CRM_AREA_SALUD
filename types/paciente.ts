export type EstadoPaciente = 'activo' | 'inactivo'

export interface Paciente {
  id: string
  // Datos personales
  nombre: string
  apellido: string | null
  rut: string | null
  fecha_nacimiento: string | null
  genero: string | null
  seguro_medico: string | null
  // Información de contacto
  telefono: string | null
  telefono_alternativo: string | null
  email: string | null
  direccion: string | null
  // Contacto de emergencia
  contacto_emergencia_nombre: string | null
  contacto_emergencia_parentesco: string | null
  contacto_emergencia_telefono: string | null
  // Datos administrativos
  numero_expediente: string | null
  como_llego: string | null
  notas: string | null
  estado: EstadoPaciente
  created_at: string
  updated_at: string
}

export interface PacienteFormData {
  // Datos personales
  nombre: string
  apellido: string
  rut: string
  fecha_nacimiento: string
  genero: string
  seguro_medico: string
  // Información de contacto
  telefono: string
  telefono_alternativo: string
  email: string
  direccion: string
  // Contacto de emergencia
  contacto_emergencia_nombre: string
  contacto_emergencia_parentesco: string
  contacto_emergencia_telefono: string
  // Datos administrativos
  numero_expediente: string
  como_llego: string
  notas: string
  estado: EstadoPaciente
}
