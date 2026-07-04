-- "Mis ubicaciones": lugares guardados del usuario (casa, trabajo) que además
-- pueden funcionar como zonas de aviso ("avisame de avisos cerca de acá").

create table if not exists public.ubicaciones (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nombre     text not null,
  lat        double precision not null,
  lng        double precision not null,
  radio_km   int not null default 3,
  avisar     boolean not null default true, -- usar como zona de aviso
  creado_en  timestamptz not null default now()
);

create index if not exists ubicaciones_user_idx on public.ubicaciones (user_id);
create index if not exists ubicaciones_avisar_idx on public.ubicaciones (avisar) where avisar;

alter table public.ubicaciones enable row level security;

-- Cada usuario administra SOLO las suyas.
drop policy if exists "ubic propias select" on public.ubicaciones;
create policy "ubic propias select" on public.ubicaciones for select using (auth.uid() = user_id);
drop policy if exists "ubic propias insert" on public.ubicaciones;
create policy "ubic propias insert" on public.ubicaciones for insert with check (auth.uid() = user_id);
drop policy if exists "ubic propias update" on public.ubicaciones;
create policy "ubic propias update" on public.ubicaciones for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "ubic propias delete" on public.ubicaciones;
create policy "ubic propias delete" on public.ubicaciones for delete using (auth.uid() = user_id);
