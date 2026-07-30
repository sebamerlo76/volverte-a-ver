-- ===========================================================================
-- Chicho — Novedades (anuncios de mejoras y actualizaciones)
-- Pegá TODO esto en Supabase → SQL Editor → New query → Run.
-- ===========================================================================
--
-- Para qué: que Sebastián pueda contar una mejora ("ahora podés subir la foto del
-- reencuentro") y que llegue como push a quien tiene los avisos activados, quedando
-- además el historial: en el panel (qué mandé y a cuántos) y en una pantalla pública
-- "Novedades" del menú, que hace de changelog y muestra que el proyecto está vivo.

create table if not exists public.novedades (
  id        uuid primary key default gen_random_uuid(),
  titulo    text not null,
  texto     text not null,
  enviados  int  not null default 0, -- a cuántos dispositivos les llegó el push
  creado_en timestamptz not null default now()
);

create index if not exists novedades_fecha_idx on public.novedades (creado_en desc);

alter table public.novedades enable row level security;

-- Lectura pública: es un changelog, lo ve cualquiera (incluso sin cuenta).
drop policy if exists "novedades lectura publica" on public.novedades;
create policy "novedades lectura publica" on public.novedades
  for select using (true);

-- Solo el admin publica novedades.
drop policy if exists "novedades alta admin" on public.novedades;
create policy "novedades alta admin" on public.novedades
  for insert with check (public.es_admin());

drop policy if exists "novedades borrar admin" on public.novedades;
create policy "novedades borrar admin" on public.novedades
  for delete using (public.es_admin());

-- Al publicar una novedad, avisar a la Edge Function para que mande los push.
-- Reusa disparar_notificar() de schema-webhooks.sql (ya tiene la service_role adentro:
-- no hay que volver a pegarla acá).
drop trigger if exists trg_notificar_novedades on public.novedades;
create trigger trg_notificar_novedades
  after insert on public.novedades
  for each row execute function public.disparar_notificar();

-- La Edge Function escribe cuántos push salieron (con service_role saltea RLS).
