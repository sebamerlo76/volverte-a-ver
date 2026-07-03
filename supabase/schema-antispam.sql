-- Anti-flood de avistamientos (backstop del lado del servidor).
-- Un aviso no puede recibir más de N avistamientos en pocos minutos, sin importar
-- quién los mande. Umbral generoso: un uso real jamás lo toca; un aluvión sí.

create or replace function public.limitar_avistamientos()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  recientes int;
begin
  select count(*) into recientes
  from public.avistamientos
  where reporte_id = NEW.reporte_id
    and creado_en > now() - interval '5 minutes';

  if recientes >= 10 then
    raise exception 'Demasiados avistamientos para este aviso en poco tiempo. Probá en unos minutos.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_limitar_avistamientos on public.avistamientos;
create trigger trg_limitar_avistamientos
  before insert on public.avistamientos
  for each row execute function public.limitar_avistamientos();
