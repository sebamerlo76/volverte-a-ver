-- Reencuentros: avisos "ya en casa" (resueltos) con su contacto, SOLO para el admin.
-- Sirve para pedir permiso de publicar el reencuentro en el IG (@chicho.ar) o mandar
-- una encuesta. El whatsapp está en reportes pero se oculta en la app una vez resuelto;
-- esta RPC lo devuelve únicamente al admin (security definer + es_admin()), así el
-- contacto no se expone a clientes normales. Mismo patrón que admin_moderacion.
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
