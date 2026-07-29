-- ===========================================================================
-- Chicho — Avistamientos ("¡Lo vi acá!")
-- Pegá TODO esto en Supabase -> SQL Editor -> New query -> Run.
-- ===========================================================================

create table if not exists public.avistamientos (
  id          uuid primary key default gen_random_uuid(),
  reporte_id  uuid not null references public.reportes(id) on delete cascade,
  lat         double precision not null,
  lng         double precision not null,
  nota        text,
  autor       text,
  creado_en   timestamptz not null default now()
);

create index if not exists avistamientos_reporte_idx on public.avistamientos (reporte_id, creado_en);

-- Cualquiera puede ver y dejar un avistamiento (sin login), para máxima participación.
alter table public.avistamientos enable row level security;

drop policy if exists "avistamientos lectura publica" on public.avistamientos;
create policy "avistamientos lectura publica" on public.avistamientos
  for select using (true);

drop policy if exists "avistamientos alta publica" on public.avistamientos;
create policy "avistamientos alta publica" on public.avistamientos
  for insert with check (true);

-- Tipo de aporte (2026-07-29). Antes había uno solo ("lo vi acá", con punto en el
-- mapa) y el resto de lo que sabe un vecino se perdía: que conoce a la familia, que
-- el animal tiene dueño y se escapa siempre, que está en peligro ahora. Ver
-- src/lib/aportes.js. Los avistamientos viejos quedan como 'visto' por el default.
-- Los aportes que no marcan lugar guardan el punto de la zona del aviso (lat/lng
-- siguen siendo NOT NULL) y se filtran del mapa por tipo.
alter table public.avistamientos
  add column if not exists tipo text not null default 'visto';
