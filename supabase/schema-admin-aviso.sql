-- Soporte sobre un aviso puntual (solo el admin).
--
-- Caso real (30-jul-2026): una mascota ya había aparecido —lo confirmó la familia por
-- WhatsApp— pero el aviso seguía activo porque la persona no podía entrar a su cuenta.
-- El admin podía BORRAR el aviso, pero eso pierde el reencuentro (y los reencuentros
-- son lo que muestra que la app funciona). Faltaba poder cerrarlo bien.

-- 1) Quién publicó un aviso (para poder ayudarlo). El aviso dice "Anónimo" cuando la
--    persona no cargó su nombre, pero siempre tiene dueño: publicar exige cuenta.
create or replace function public.admin_contacto_reporte(rid uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare res jsonb;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  select jsonb_build_object(
    'email', u.email,
    'proveedor', coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
    'nombre', coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
    'ultimoAcceso', u.last_sign_in_at,
    'whatsapp', r.whatsapp
  )
  into res
  from public.reportes r
  left join auth.users u on u.id = r.user_id
  where r.id = rid;
  return coalesce(res, '{}'::jsonb);
end;
$$;
grant execute on function public.admin_contacto_reporte(uuid) to authenticated;

-- 2) Cerrar un aviso como admin cuando el dueño no puede hacerlo. Marca 'resuelto',
--    igual que el botón "Ya volvió a casa": el aviso sale del feed, queda en "Ya en
--    casa" y dispara el festejo/notificaciones como cualquier reencuentro.
create or replace function public.admin_resolver_reporte(rid uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  update public.reportes set estado = 'resuelto' where id = rid;
end;
$$;
grant execute on function public.admin_resolver_reporte(uuid) to authenticated;
