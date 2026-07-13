-- ===========================================================================
-- "Toda la provincia" automático en notificaciones.
-- Correr una vez en Supabase -> SQL Editor -> New query -> Run.
--
-- 1) reportes.provincia: se guarda la provincia del aviso (la calcula el front al
--    publicar). Así la edge function matchea por provincia sin duplicar el mapa
--    ciudad->provincia. Los avisos viejos quedan en null (no importa: el match de
--    notificaciones corre solo sobre avisos nuevos).
-- 2) notif_prefs.provincias: provincias que el usuario eligió "toda la provincia".
-- ===========================================================================

alter table public.reportes add column if not exists provincia text;

alter table public.notif_prefs add column if not exists provincias text[] default '{}';
