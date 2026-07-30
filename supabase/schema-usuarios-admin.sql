-- Ver los usuarios desde el panel (solo el admin). Para soporte: cuando alguien
-- escribe "no me llega el mail para cambiar la contraseña", lo primero que hay que
-- saber es CÓMO se registró — si entró con Google no tiene contraseña, y ese mail no
-- va a llegar nunca.
--
-- Devuelve el email, el proveedor (google / email), cuándo se registró, cuándo entró
-- por última vez y si confirmó el correo. NO permite cambiar contraseñas: eso exige la
-- clave maestra del proyecto, que no puede vivir en el navegador. Para eso está el
-- botón que le reenvía el mail de recuperación (lo manda el propio Supabase).
create or replace function public.admin_usuarios()
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare res jsonb;
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'proveedor', coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
    'nombre', coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
    'creadoEn', u.created_at,
    'ultimoAcceso', u.last_sign_in_at,
    'confirmado', u.email_confirmed_at is not null
  ) order by u.created_at desc), '[]'::jsonb)
  into res
  from (select * from auth.users order by created_at desc limit 500) u;
  return res;
end;
$$;
grant execute on function public.admin_usuarios() to authenticated;
