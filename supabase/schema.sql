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


  ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS apellido text,
  ADD COLUMN IF NOT EXISTS rut text,
  ADD COLUMN IF NOT EXISTS genero text,
  ADD COLUMN IF NOT EXISTS seguro_medico text,
  ADD COLUMN IF NOT EXISTS telefono_alternativo text,
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre text,
  ADD COLUMN IF NOT EXISTS contacto_emergencia_parentesco text,
  ADD COLUMN IF NOT EXISTS contacto_emergencia_telefono text,
  ADD COLUMN IF NOT EXISTS numero_expediente text,
  ADD COLUMN IF NOT EXISTS como_llego text;
