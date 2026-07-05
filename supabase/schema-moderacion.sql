-- Moderación: reportar avisos (3 denuncias de dispositivos distintos → se oculta) +
-- banear usuarios. Solo el admin (por email) desbloquea/banea. Reusa el patrón del
-- RPC anónimo sumar_apoyo. Correr TODO esto en Supabase → SQL Editor.

-- 1) Columnas + tablas -------------------------------------------------------
alter table public.reportes
  add column if not exists denuncias int not null default 0,
  add column if not exists bloqueado boolean not null default false;
create index if not exists reportes_bloqueado_idx on public.reportes (bloqueado) where bloqueado;

create table if not exists public.denuncias (
  id         uuid primary key default gen_random_uuid(),
  reporte_id uuid not null references public.reportes(id) on delete cascade,
  device     text not null,
  motivo     text,
  creado_en  timestamptz not null default now(),
  unique (reporte_id, device)
);
create index if not exists denuncias_reporte_idx on public.denuncias (reporte_id);

create table if not exists public.usuarios_baneados (
  user_id   uuid primary key,
  creado_en timestamptz not null default now()
);

-- Estas tablas solo se tocan vía funciones SECURITY DEFINER: RLS on, sin policies.
alter table public.denuncias enable row level security;
alter table public.usuarios_baneados enable row level security;

-- 2) Helpers -----------------------------------------------------------------
create or replace function public.es_admin() returns boolean
  language sql stable security definer set search_path = public, pg_temp
  as $$ select coalesce((auth.jwt() ->> 'email') = 'sebamerlo76@gmail.com', false) $$;

-- Id del admin (para que la Edge Function le mande el push).
create or replace function public.admin_id() returns uuid
  language sql stable security definer set search_path = public, pg_temp
  as $$ select id from auth.users where email = 'sebamerlo76@gmail.com' limit 1 $$;
grant execute on function public.admin_id() to service_role, authenticated;

create or replace function public.esta_baneado(uid uuid) returns boolean
  language sql stable security definer set search_path = public, pg_temp
  as $$ select exists(select 1 from public.usuarios_baneados where user_id = uid) $$;
grant execute on function public.esta_baneado(uuid) to anon, authenticated;

-- 3) Reportar (anónimo, dedup por dispositivo). Al 3er device distinto → oculta.
create or replace function public.denunciar_reporte(rid uuid, dev text, motivo text default null)
returns int language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  cuenta int;
  admin_id uuid;
begin
  insert into public.denuncias (reporte_id, device, motivo)
    values (rid, dev, motivo)
    on conflict (reporte_id, device) do nothing;

  select count(*) into cuenta from public.denuncias where reporte_id = rid;
  update public.reportes set denuncias = cuenta where id = rid;

  if cuenta >= 3 then
    update public.reportes set bloqueado = true where id = rid and bloqueado = false;
    if found then
      select id into admin_id from auth.users where email = 'sebamerlo76@gmail.com' limit 1;
      if admin_id is not null then
        insert into public.notificaciones (user_id, titulo, cuerpo, reporte_id, tipo)
          values (admin_id, '🚫 Aviso bloqueado por reportes',
                  'Un aviso juntó 3 denuncias y se ocultó. Revisalo en Moderación.', rid, 'moderacion');
      end if;
    end if;
  end if;

  return cuenta;
end;
$$;
grant execute on function public.denunciar_reporte(uuid, text, text) to anon, authenticated;

-- 4) Funciones de admin ------------------------------------------------------
create or replace function public.admin_moderacion()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare res jsonb;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  select jsonb_build_object(
    'avisos', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id, 'nombre', r.nombre, 'tipo', r.tipo, 'especie', r.especie, 'zona', r.zona,
        'foto', r.foto, 'autor', r.autor, 'userId', r.user_id, 'bloqueado', r.bloqueado,
        'denuncias', r.denuncias, 'creadoEn', r.creado_en,
        'motivos', (select coalesce(jsonb_agg(distinct d.motivo) filter (where d.motivo is not null), '[]'::jsonb)
                    from public.denuncias d where d.reporte_id = r.id)
      ) order by r.bloqueado desc, r.denuncias desc), '[]'::jsonb)
      from public.reportes r
      where r.bloqueado = true or r.denuncias > 0
    ),
    'baneados', (
      select coalesce(jsonb_agg(jsonb_build_object('userId', b.user_id, 'email', u.email, 'desde', b.creado_en)
             order by b.creado_en desc), '[]'::jsonb)
      from public.usuarios_baneados b left join auth.users u on u.id = b.user_id
    )
  ) into res;
  return res;
end;
$$;
grant execute on function public.admin_moderacion() to authenticated;

create or replace function public.desbloquear_reporte(rid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  update public.reportes set bloqueado = false, denuncias = 0 where id = rid;
  delete from public.denuncias where reporte_id = rid;
end;
$$;
grant execute on function public.desbloquear_reporte(uuid) to authenticated;

create or replace function public.borrar_reporte_admin(rid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  delete from public.reportes where id = rid;
end;
$$;
grant execute on function public.borrar_reporte_admin(uuid) to authenticated;

create or replace function public.banear_usuario(uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  insert into public.usuarios_baneados (user_id) values (uid) on conflict do nothing;
  update public.reportes set bloqueado = true where user_id = uid;
end;
$$;
grant execute on function public.banear_usuario(uuid) to authenticated;

create or replace function public.desbanear_usuario(uid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  delete from public.usuarios_baneados where user_id = uid;
  update public.reportes set bloqueado = false where user_id = uid;
end;
$$;
grant execute on function public.desbanear_usuario(uuid) to authenticated;

-- 5) Bloquear a los baneados al publicar (la lectura pública no cambia) -------
drop policy if exists "alta publica" on public.reportes;
create policy "alta publica" on public.reportes
  for insert with check (auth.uid() is null or not public.esta_baneado(auth.uid()));
