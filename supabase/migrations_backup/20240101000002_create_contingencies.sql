create table if not exists public.contingencies (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text not null default 'pending',
  priority text not null default 'medium',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  area_id uuid references public.areas(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null
);

-- Habilitar RLS
alter table public.contingencies enable row level security;

-- Crear políticas de RLS
create policy "Usuarios pueden ver contingencias de su organización"
  on public.contingencies for select
  using (
    auth.uid() in (
      select user_id from public.organization_members 
      where organization_id = contingencies.organization_id
    )
  );

create policy "Usuarios pueden crear contingencias en su organización"
  on public.contingencies for insert
  with check (
    auth.uid() in (
      select user_id from public.organization_members 
      where organization_id = organization_id
    )
  );

create policy "Usuarios pueden actualizar contingencias de su organización"
  on public.contingencies for update
  using (
    auth.uid() in (
      select user_id from public.organization_members 
      where organization_id = contingencies.organization_id
    )
  )
  with check (
    auth.uid() in (
      select user_id from public.organization_members 
      where organization_id = organization_id
    )
  );

create policy "Usuarios pueden eliminar contingencias de su organización"
  on public.contingencies for delete
  using (
    auth.uid() in (
      select user_id from public.organization_members 
      where organization_id = contingencies.organization_id
    )
  ); 