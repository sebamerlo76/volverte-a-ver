-- ===========================================================================
-- Chicho — Mis mascotas (perfiles guardados de cada usuario)
-- Pegá TODO esto en Supabase -> SQL Editor -> New query -> Run.
-- ===========================================================================

create table if not exists public.mascotas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) default auth.uid(),
  nombre       text,
  especie      text not null default 'perro' check (especie in ('perro', 'gato', 'otro')),
  color        text,
  tamano       text,
  raza         text,
  descripcion  text,
  foto         text,
  creado_en    timestamptz not null default now()
);

create index if not exists mascotas_user_idx on public.mascotas (user_id, creado_en desc);

-- Cada usuario ve y maneja SOLO sus propias mascotas.
alter table public.mascotas enable row level security;

drop policy if exists "mascotas select propias" on public.mascotas;
create policy "mascotas select propias" on public.mascotas
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "mascotas insert propias" on public.mascotas;
create policy "mascotas insert propias" on public.mascotas
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "mascotas update propias" on public.mascotas;
create policy "mascotas update propias" on public.mascotas
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "mascotas delete propias" on public.mascotas;
create policy "mascotas delete propias" on public.mascotas
  for delete to authenticated using (user_id = auth.uid());
