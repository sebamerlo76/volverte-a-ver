-- Panel de administración (solo para el dueño). Una función que agrega todas las
-- estadísticas del lado del servidor (saltea RLS) y SOLO responde si el que llama
-- es el admin (por email). Cambiá el email si hace falta.

create or replace function public.admin_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  es_admin boolean;
  res jsonb;
begin
  select coalesce((auth.jwt() ->> 'email') = 'sebamerlo76@gmail.com', false) into es_admin;
  if not es_admin then
    raise exception 'No autorizado';
  end if;

  select jsonb_build_object(
    'usuarios',       (select count(*) from auth.users),
    'usuariosMes',    (select count(*) from auth.users where created_at >= date_trunc('month', now())),
    'avisos',         (select count(*) from reportes),
    'avisosHoy',      (select count(*) from reportes where creado_en >= date_trunc('day', now())),
    'avisosMes',      (select count(*) from reportes where creado_en >= date_trunc('month', now())),
    'avisosAnio',     (select count(*) from reportes where creado_en >= date_trunc('year', now())),
    'activos',        (select count(*) from reportes where estado = 'activo'),
    'perdidos',       (select count(*) from reportes where tipo = 'perdido'),
    'enLaCalle',      (select count(*) from reportes where tipo = 'encontrado'),
    'enCasa',         (select count(*) from reportes where estado = 'resuelto'),
    'perro',          (select count(*) from reportes where especie = 'perro'),
    'gato',           (select count(*) from reportes where especie = 'gato'),
    'otro',           (select count(*) from reportes where especie = 'otro'),
    'avistamientos',  (select count(*) from avistamientos),
    'mascotas',       (select count(*) from mascotas),
    'ubicaciones',    (select count(*) from ubicaciones),
    'seguidores',     (select count(*) from seguidores),
    'apoyos',         (select coalesce(sum(apoyos), 0) from reportes),
    'notificaciones', (select count(*) from notificaciones),
    'pushSubs',       (select count(*) from push_subs),
    'avisosPorMes', (
      select coalesce(jsonb_agg(jsonb_build_object('mes', to_char(mes, 'YYYY-MM'), 'total', coalesce(c, 0)) order by mes), '[]'::jsonb)
      from generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') mes
      left join (
        select date_trunc('month', creado_en) mm, count(*) c from reportes group by 1
      ) t on t.mm = mes
    ),
    'topZonas', (
      select coalesce(jsonb_agg(jsonb_build_object('zona', zona, 'total', c) order by c desc), '[]'::jsonb)
      from (
        select coalesce(nullif(zona, ''), '—') as zona, count(*) as c
        from reportes group by 1 order by c desc limit 8
      ) z
    )
  ) into res;

  return res;
end;
$$;

grant execute on function public.admin_stats() to authenticated;

-- Estadísticas de un rango de fechas elegido (para el selector del panel).
create or replace function public.admin_stats_rango(desde date, hasta date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  res jsonb;
  d1 timestamptz := desde::timestamptz;
  d2 timestamptz := (hasta + 1)::timestamptz; -- inclusivo del día "hasta"
begin
  if not coalesce((auth.jwt() ->> 'email') = 'sebamerlo76@gmail.com', false) then
    raise exception 'No autorizado';
  end if;
  select jsonb_build_object(
    'avisos',        (select count(*) from reportes where creado_en >= d1 and creado_en < d2),
    'perdidos',      (select count(*) from reportes where tipo = 'perdido' and creado_en >= d1 and creado_en < d2),
    'enLaCalle',     (select count(*) from reportes where tipo = 'encontrado' and creado_en >= d1 and creado_en < d2),
    'enCasa',        (select count(*) from reportes where estado = 'resuelto' and creado_en >= d1 and creado_en < d2),
    'perro',         (select count(*) from reportes where especie = 'perro' and creado_en >= d1 and creado_en < d2),
    'gato',          (select count(*) from reportes where especie = 'gato' and creado_en >= d1 and creado_en < d2),
    'otro',          (select count(*) from reportes where especie = 'otro' and creado_en >= d1 and creado_en < d2),
    'avistamientos', (select count(*) from avistamientos where creado_en >= d1 and creado_en < d2),
    'usuarios',      (select count(*) from auth.users where created_at >= d1 and created_at < d2)
  ) into res;
  return res;
end;
$$;
grant execute on function public.admin_stats_rango(date, date) to authenticated;
