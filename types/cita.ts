export type EstadoCita = 'confirmada' | 'cancelada' | 'reagendada' | 'completada'

export interface Cita {
  id: string
  paciente_id: string | null
  cal_booking_uid: string | null
  fecha_inicio: string
  fecha_fin: string
  estado: EstadoCita
  tipo_cita: string | null
  notas_cita: string | null
  meet_link: string | null
  created_at: string
  updated_at: string
}

export interface CitaConPaciente extends Cita {
  pacientes: { nombre: string } | null
}
