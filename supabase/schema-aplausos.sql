-- Contador de "aplausos" 👏 en los avisos que ya volvieron a casa (reencuentros).
-- Reusa el patrón del RPC anónimo sumar_apoyo (ver schema-apoyos.sql).
-- Correr una vez en Supabase -> SQL Editor -> New query -> Run. Es idempotente.
alter table public.reportes
  add column if not exists aplausos int not null default 0;

-- Suma 1 aplauso de forma anónima y segura (sin dar UPDATE directo sobre la tabla).
-- Solo aplica a avisos resueltos: si el aviso no está "resuelto", no incrementa y
-- devuelve null (el cliente ya muestra el +1 optimista, así que degrada sin romper).
create or replace function public.sumar_aplauso(rid uuid)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  nuevo int;
begin
  update public.reportes
    set aplausos = coalesce(aplausos, 0) + 1
    where id = rid and estado = 'resuelto'
    returning aplausos into nuevo;
  return nuevo;
end;
$$;

grant execute on function public.sumar_aplauso(uuid) to anon, authenticated;
