-- "Mis ubicaciones" pasa de punto+radio a ciudad+barrio.
--
-- Por qué: había DOS mecanismos haciendo lo mismo (el radio de acá y el
-- centro_lat/radio_km de notif_prefs), los dos mandando la notificación "cerca".
-- Y el barrio como texto libre ya demostró no ser confiable (38% de los avisos lo
-- tienen escrito a mano), así que la granularidad real ya era la ciudad.
--
-- Se corre en TRES pasos, no de una. El B va en el medio, con código.

-- ===========================================================================
-- PASO A — no destructivo. Correr ANTES de desplegar el código nuevo.
-- Deja las columnas nuevas al lado de las viejas: la app vieja sigue andando.
-- ===========================================================================
alter table public.ubicaciones add column if not exists localidad text;
alter table public.ubicaciones add column if not exists zona text;

-- Las viejas dejan de ser obligatorias, si no el insert nuevo no entra.
alter table public.ubicaciones alter column lat drop not null;
alter table public.ubicaciones alter column lng drop not null;


-- ===========================================================================
-- PASO B — el backfill. NO es SQL: se corre
--     node scripts/migrar-ubicaciones.mjs            (dry-run, no escribe)
--     node scripts/migrar-ubicaciones.mjs --escribir
-- Traduce lat/lng -> ciudad usando el localidades.js real, para que no se
-- desincronice cuando sumemos ciudades. Revisá la lista antes de escribir.
--
-- Y esto, que va junto: al sacar el radio de notif_prefs, el que tenía UNA
-- ciudad + barrios puntuales + un punto marcado se queda más angosto que antes
-- (el radio le AGREGABA avisos: era un OR, no un filtro). Le abrimos todos los
-- barrios de su ciudad para que no pierda alcance sin enterarse.
update public.notif_prefs
  set barrios = array['*']
  where centro_lat is not null
    and coalesce(array_length(barrios, 1), 0) > 0
    and not (barrios @> array['*']);


-- ===========================================================================
-- PASO C — DESTRUCTIVO. Recién cuando el paso B esté verificado a ojo, y con la
-- app nueva andando en el celu. Los lat/lng originales no se recuperan.
--
-- OJO: correr SOLO este bloque, no el archivo entero (los pasos A y B ya
-- corrieron). Seleccionalo y dale Run.
--
-- Antes estaba comentado con "--" para que no se disparara sin querer, pero eso
-- confunde más de lo que protege: Postgres ignora la línea y te contesta
-- "Success" igual, así que parece que corrió y no corrió nada.
-- ===========================================================================
alter table public.ubicaciones drop column lat, drop column lng, drop column radio_km;
alter table public.ubicaciones alter column localidad set not null;

-- Idem notif_prefs: su punto+radio ya no lo lee nadie. Ojo: esto va DESPUÉS del
-- update de barrios del paso B, que necesita centro_lat para saber a quién tocar.
alter table public.notif_prefs drop column centro_lat, drop column centro_lng, drop column radio_km;
