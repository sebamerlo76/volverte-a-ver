-- Barrios elegidos para las notificaciones de "nuevos avisos cerca mío".
-- El usuario puede elegir barrios (principal) y/o un punto+radio (avanzado).
alter table public.notif_prefs
  add column if not exists barrios text[] default '{}';
