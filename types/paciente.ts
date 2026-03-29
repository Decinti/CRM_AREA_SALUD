export type EstadoPaciente = 'activo' | 'inactivo'

export interface Paciente {
  id: string
  nombre: string
  email: string | null
  telefono: string | null
  fecha_nacimiento: string | null
  estado: EstadoPaciente
  notas: string | null
  created_at: string
  updated_at: string
}

export interface PacienteFormData {
  nombre: string
  email: string
  telefono: string
  fecha_nacimiento: string
  estado: EstadoPaciente
  notas: string
}
