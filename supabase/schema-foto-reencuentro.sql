-- Foto del reencuentro: la sube el dueño al marcar "ya volvió" (en el festejo) o
-- después desde Mis avisos. Alimenta el muro de "Ya en casa" (la tarjeta muestra
-- esta foto en vez de la del aviso) y el detalle del aviso resuelto. La escribe el
-- dueño sobre su propio aviso → la RLS de update existente ya la cubre.
alter table public.reportes
  add column if not exists foto_reencuentro text;

-- La RPC del panel admin (sección Reencuentros, permiso IG) también la devuelve:
-- con la foto ya subida, pedir permiso para publicarla en IG es un solo paso.
create or replace function public.admin_reencuentros()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare res jsonb;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'nombre', r.nombre, 'especie', r.especie, 'tipo', r.tipo,
    'localidad', r.localidad, 'zona', r.zona, 'foto', r.foto, 'autor', r.autor,
    'whatsapp', r.whatsapp, 'email', u.email,
    'fotoReencuentro', r.foto_reencuentro,
    'resueltoEn', r.resuelto_en, 'creadoEn', r.creado_en
  ) order by r.resuelto_en desc nulls last), '[]'::jsonb)
  into res
  from public.reportes r
  left join auth.users u on u.id = r.user_id
  where r.estado = 'resuelto'
  limit 200;
  return res;
end;
$$;
grant execute on function public.admin_reencuentros() to authenticated;
