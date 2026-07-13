-- ===========================================================================
-- Chicho — En tránsito (retengo a la mascota que encontré)
-- Pegá TODO esto en Supabase -> SQL Editor -> New query -> Run.
-- ===========================================================================

-- ¿Quien publicó el "encontrado" tiene la mascota a resguardo?
alter table public.reportes add column if not exists en_custodia boolean default false;

-- Una mascota del perfil puede ser propia o estar en tránsito (foster).
alter table public.mascotas
  add column if not exists relacion text default 'propia' check (relacion in ('propia', 'transito'));
