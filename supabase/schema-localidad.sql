-- Localidad (ciudad) de cada aviso y de las preferencias de notificación.
-- Base para escalar a otras ciudades (Santa Fe, etc.) sin reprogramar.
alter table public.reportes
  add column if not exists localidad text default 'Paraná';
alter table public.notif_prefs
  add column if not exists localidad text default 'Paraná';
-- Varias localidades para "cerca mío" (el usuario elige las ciudades cercanas).
alter table public.notif_prefs
  add column if not exists localidades text[];
