-- Gestión de avisos SIN cuenta: un token secreto por aviso para poder cerrarlo
-- o borrarlo desde un link (chicho.ar/g/<token>) sin estar logueado.
-- El token va en una tabla aparte (no en reportes) para que NUNCA se filtre en
-- las lecturas públicas. Todo se toca por RPC (security definer).
create table if not exists public.gestion (
  reporte_id uuid primary key references public.reportes(id) on delete cascade,
  token text not null unique,
  creado_en timestamptz default now()
);
alter table public.gestion enable row level security;
-- Sin políticas: nadie accede directo a la tabla.

-- Registrar el token de un aviso recién creado (una sola vez por aviso).
create or replace function public.publicar_gestion(rid uuid, tok text)
returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  insert into public.gestion (reporte_id, token) values (rid, tok)
  on conflict (reporte_id) do nothing;
  return found;
end;
$$;
grant execute on function public.publicar_gestion(uuid, text) to anon, authenticated;

-- Traer el aviso por su token (para la pantalla de gestión). No expone el token.
create or replace function public.reporte_por_token(tok text)
returns table (id uuid, tipo text, especie text, nombre text, zona text, localidad text, foto text, estado text, creado_en timestamptz)
language sql security definer set search_path = public, pg_temp
as $$
  select r.id, r.tipo, r.especie, r.nombre, r.zona, r.localidad, r.foto, r.estado, r.creado_en
  from public.reportes r
  join public.gestion g on g.reporte_id = r.id
  where g.token = tok;
$$;
grant execute on function public.reporte_por_token(text) to anon, authenticated;

-- Cerrar (marcar resuelto / volvió a casa) por token.
create or replace function public.resolver_gestion(tok text)
returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
declare rid uuid;
begin
  select reporte_id into rid from public.gestion where token = tok;
  if rid is null then return false; end if;
  update public.reportes set estado = 'resuelto' where id = rid;
  return true;
end;
$$;
grant execute on function public.resolver_gestion(text) to anon, authenticated;

-- Borrar el aviso por token.
create or replace function public.borrar_gestion(tok text)
returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
declare rid uuid;
begin
  select reporte_id into rid from public.gestion where token = tok;
  if rid is null then return false; end if;
  delete from public.reportes where id = rid;
  return true;
end;
$$;
grant execute on function public.borrar_gestion(text) to anon, authenticated;
