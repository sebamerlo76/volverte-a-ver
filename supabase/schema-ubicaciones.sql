-- "Mis ubicaciones": los lugares del usuario (casa, trabajo). Son la única fuente
-- de "dónde estás": de acá sale su ciudad por defecto al publicar y a quién
-- notificar.
--
-- OJO: esto tenía lat/lng + radio_km y se migró a ciudad + barrio (2026-07-15).
-- La historia y el porqué están en schema-ubicaciones-ciudad.sql. Este archivo
-- quedó actualizado al schema REAL: si armás un proyecto nuevo desde acá, tiene
-- que quedar como está en producción. (Con las columnas viejas, la app no arranca:
-- lat era obligatoria y el código ya no la manda.)

create table if not exists public.ubicaciones (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nombre     text not null,             -- lo escribe el usuario: "Casa", "Trabajo"
  localidad  text not null,             -- ciudad; es lo que matchea notificar
  zona       text,                      -- barrio, opcional: sólo para reconocer el lugar
  avisar     boolean not null default true, -- ¿te avisamos de los avisos de esta ciudad?
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
