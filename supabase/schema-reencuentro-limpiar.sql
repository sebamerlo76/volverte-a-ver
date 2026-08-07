-- ===========================================================================
-- Al reactivar un aviso, olvidar el reencuentro anterior (7-ago-2026).
--
-- El caso: se pierde una mascota, aparece, la familia sube la foto de "ya en casa",
-- y meses después se vuelve a perder. Al reactivar el aviso, el trigger ya limpiaba
-- resuelto_en pero foto_reencuentro quedaba pegada, y eso rompía dos cosas:
--
--   1. Cuando la mascota volvía a aparecer, el aviso NO ofrecía subir la foto nueva:
--      el cartel sólo sale si todavía no hay foto, así que la familia se quedaba sin
--      poder contar el segundo reencuentro.
--   2. El muro de "Ya en casa" mostraba la foto del reencuentro VIEJO como si fuera
--      del nuevo.
--
-- Se resuelve en el mismo trigger que ya limpia la fecha, y no sólo en la app, para
-- que valga por cualquier camino: el botón "Volver a activar", el panel de admin o
-- un update a mano desde el SQL Editor.
--
-- La foto vieja NO se borra de Storage: sólo se suelta el vínculo con el aviso. Si
-- algún día se quiere el historial de todos los reencuentros de una mascota, va en
-- una tabla aparte — el aviso guarda el estado actual, no la historia.
--
-- Correr una vez en Supabase → SQL Editor → New query → Run.
-- ===========================================================================

create or replace function public.set_resuelto_en()
returns trigger language plpgsql as $$
begin
  -- Al pasar a 'resuelto' (y no estarlo antes), estampamos la fecha.
  if new.estado = 'resuelto' and (old.estado is distinct from 'resuelto') then
    new.resuelto_en := now();
  -- Si se reactiva (vuelve a activo o queda pausado), limpiamos la fecha Y la foto
  -- del reencuentro: ese reencuentro terminó cuando el aviso volvió a abrirse.
  elsif new.estado <> 'resuelto' then
    new.resuelto_en := null;
    new.foto_reencuentro := null;
  end if;
  return new;
end $$;

-- El trigger ya existe (supabase/resuelto-en.sql) y apunta a esta misma función, así
-- que con reemplazarla alcanza. Se recrea igual por si esa migración no se corrió.
drop trigger if exists trg_resuelto_en on public.reportes;
create trigger trg_resuelto_en
  before update on public.reportes
  for each row execute function public.set_resuelto_en();
