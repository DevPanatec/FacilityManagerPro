-- Crear la extensión moddatetime si no existe
create extension if not exists moddatetime schema extensions;

create table deep_tasks (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  active boolean default true
);

-- Trigger para actualizar updated_at
create trigger handle_updated_at before update on deep_tasks
  for each row execute procedure moddatetime (updated_at);

-- Agregar columna deep_task_id a la tabla assignments
alter table assignments add column deep_task_id uuid references deep_tasks(id); 