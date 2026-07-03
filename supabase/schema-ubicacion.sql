-- ===========================================================================
-- "Volverte a ver" — Ubicación exacta de cada aviso (punto en el mapa)
-- Pegá TODO esto en Supabase -> SQL Editor -> New query -> Run.
-- ===========================================================================

alter table public.reportes add column if not exists lat double precision;
alter table public.reportes add column if not exists lng double precision;
