-- ===========================================================================
-- Chicho — Campos extra en avisos y mascotas
-- Pegá TODO esto en Supabase -> SQL Editor -> New query -> Run.
-- ===========================================================================

alter table public.reportes add column if not exists sexo text;        -- macho | hembra
alter table public.reportes add column if not exists edad text;        -- libre (ej: "2 años")
alter table public.reportes add column if not exists collar text;      -- ej: "Sí, rojo con chapita"
alter table public.reportes add column if not exists recompensa text;  -- ej: "$50.000" (vacío = sin recompensa)

alter table public.mascotas add column if not exists sexo text;
alter table public.mascotas add column if not exists edad text;
alter table public.mascotas add column if not exists collar text;
