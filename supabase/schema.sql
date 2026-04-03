-- Tabla de pacientes
create table if not exists pacientes (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  email text,
  telefono text,
  fecha_nacimiento date,
  estado text default 'activo' check (estado in ('activo', 'inactivo')),
  notas text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Trigger para updated_at automático
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on pacientes
  for each row
  execute function update_updated_at();

-- Activar Row Level Security
alter table pacientes enable row level security;

-- Política: solo el usuario autenticado puede ver y modificar los pacientes
create policy "usuario autenticado puede leer pacientes"
  on pacientes for select
  to authenticated
  using (true);

create policy "usuario autenticado puede insertar pacientes"
  on pacientes for insert
  to authenticated
  with check (true);

create policy "usuario autenticado puede actualizar pacientes"
  on pacientes for update
  to authenticated
  using (true)
  with check (true);


-- Columnas adicionales de pacientes (migración)
alter table pacientes
  add column if not exists apellido text,
  add column if not exists rut text,
  add column if not exists genero text,
  add column if not exists seguro_medico text,
  add column if not exists telefono_alternativo text,
  add column if not exists direccion text,
  add column if not exists contacto_emergencia_nombre text,
  add column if not exists contacto_emergencia_parentesco text,
  add column if not exists contacto_emergencia_telefono text,
  add column if not exists numero_expediente text,
  add column if not exists como_llego text;


-- ============================================================
-- Tabla de citas
-- ============================================================

create table if not exists citas (
  id uuid default gen_random_uuid() primary key,
  -- Relación con paciente (se mantiene null si el paciente es eliminado)
  paciente_id uuid references pacientes(id) on delete set null,
  -- UID único de reserva en Cal.com (null para citas creadas manualmente en el CRM)
  cal_booking_uid text unique,
  fecha_inicio timestamp with time zone not null,
  fecha_fin timestamp with time zone not null,
  estado text default 'confirmada' check (estado in ('confirmada', 'cancelada', 'reagendada', 'completada')),
  tipo_cita text,
  notas_cita text,
  -- Link de videollamada generado por Cal.com (Google Meet, etc.)
  meet_link text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Trigger para updated_at automático (reutiliza la función definida en pacientes)
create trigger set_updated_at
  before update on citas
  for each row
  execute function update_updated_at();

-- Activar Row Level Security
alter table citas enable row level security;

-- Política: usuarios autenticados del CRM pueden leer todas las citas
create policy "usuario autenticado puede leer citas"
  on citas for select
  to authenticated
  using (true);

-- Política: usuarios autenticados del CRM pueden crear citas manualmente
create policy "usuario autenticado puede insertar citas"
  on citas for insert
  to authenticated
  with check (true);

-- Política: usuarios autenticados del CRM pueden actualizar citas
create policy "usuario autenticado puede actualizar citas"
  on citas for update
  to authenticated
  using (true)
  with check (true);

-- Política: usuarios autenticados del CRM pueden eliminar citas
create policy "usuario autenticado puede eliminar citas"
  on citas for delete
  to authenticated
  using (true);

-- Política: service_role tiene acceso total (usado por el webhook de Cal.com)
create policy "service role puede todo en citas"
  on citas for all
  to service_role
  using (true)
  with check (true);
