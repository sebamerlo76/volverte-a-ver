-- ===========================================================================
-- Chicho — Enlazar cada aviso con la mascota de tu perfil (opcional)
-- Pegá TODO esto en Supabase -> SQL Editor -> New query -> Run.
-- ===========================================================================

-- Permite saber si una mascota tuya está publicada como perdida, para poder
-- marcarla "¡Apareció!" de un toque. Es opcional (los avisos sueltos siguen
-- funcionando con mascota_id nulo).
alter table public.reportes
  add column if not exists mascota_id uuid references public.mascotas(id) on delete set null;
