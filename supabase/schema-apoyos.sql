-- Contador de "apoyos" (prueba social): cuánta gente se sumó a difundir/buscar.
alter table public.reportes
  add column if not exists apoyos int not null default 0;

-- Suma 1 apoyo de forma anónima y segura (sin dar UPDATE directo sobre la tabla).
-- Es una función pública a propósito (como perfil_publico): solo incrementa un contador.
create or replace function public.sumar_apoyo(rid uuid)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  nuevo int;
begin
  update public.reportes
    set apoyos = coalesce(apoyos, 0) + 1
    where id = rid
    returning apoyos into nuevo;
  return nuevo;
end;
$$;

grant execute on function public.sumar_apoyo(uuid) to anon, authenticated;
