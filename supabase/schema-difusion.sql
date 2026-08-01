-- Llevar la cuenta de qué avisos ya difundió el admin (1-ago-2026).
--
-- Sebastián publica en las historias de Instagram los perdidos que llevan más de una
-- semana ("Perdidos que necesitan empujón" en el panel), pero no tenía forma de saber
-- cuáles ya había subido: terminaba repitiendo los mismos y salteando otros.
--
-- Va en la base y no en el navegador a propósito: las historias las sube desde el celu
-- y el panel lo mira también desde la compu, así que en localStorage se desincronizaría
-- (y se perdería al limpiar los datos del sitio).

alter table public.reportes
  add column if not exists difundido_en timestamptz,          -- última vez que se difundió
  add column if not exists difusiones   integer not null default 0;  -- cuántas veces

-- Marcar un aviso como difundido. Suma uno y estampa la fecha; devuelve las dos cosas
-- para que el panel se actualice sin volver a pedir toda la lista.
--
-- security definer + es_admin(): los avisos son de otra gente, y las políticas de RLS
-- sólo dejan tocar los propios. Mismo patrón que admin_resolver_reporte.
create or replace function public.admin_marcar_difundido(rid uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare res jsonb;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  update public.reportes
     set difusiones = coalesce(difusiones, 0) + 1,
         difundido_en = now()
   where id = rid
  returning jsonb_build_object('difusiones', difusiones, 'difundidoEn', difundido_en)
    into res;
  return coalesce(res, '{}'::jsonb);
end;
$$;
grant execute on function public.admin_marcar_difundido(uuid) to authenticated;

-- Deshacer, para cuando se toca de más. Baja el contador (nunca abajo de cero) y borra
-- la fecha si vuelve a quedar en cero.
create or replace function public.admin_desmarcar_difundido(rid uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare res jsonb;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  update public.reportes
     set difusiones = greatest(coalesce(difusiones, 0) - 1, 0),
         difundido_en = case when coalesce(difusiones, 0) - 1 <= 0 then null else difundido_en end
   where id = rid
  returning jsonb_build_object('difusiones', difusiones, 'difundidoEn', difundido_en)
    into res;
  return coalesce(res, '{}'::jsonb);
end;
$$;
grant execute on function public.admin_desmarcar_difundido(uuid) to authenticated;
