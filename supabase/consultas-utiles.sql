-- ===========================================================================
-- Chicho — Consultas de diagnóstico
-- ===========================================================================
-- NO son migraciones: nada de acá hay que "correr" para que la app funcione.
-- Son las preguntas que se repiten cuando algo no cierra. Copiá la que necesites
-- al SQL Editor de Supabase.
--
-- (Las migraciones son los schema-*.sql de esta misma carpeta, y se corren una
-- vez. Guardarlas también dentro de Supabase crea dos verdades que se
-- desincronizan: el repo manda, Supabase sólo ejecuta.)


-- ---------------------------------------------------------------------------
-- QUIÉN PUBLICÓ UN AVISO
-- ---------------------------------------------------------------------------
-- El aviso dice "Anónimo" cuando la persona no cargó su nombre, pero siempre
-- tiene dueño: publicar exige cuenta. Esto dice con qué correo y CÓMO entra
-- (si dice google, esa cuenta no tiene contraseña y el mail de recuperación
-- nunca le va a llegar).
select r.nombre as mascota,
       r.estado,
       r.creado_en::date as publicado,
       u.email,
       coalesce(u.raw_app_meta_data ->> 'provider', 'email') as entra_con,
       u.last_sign_in_at as ultimo_acceso
from public.reportes r
left join auth.users u on u.id = r.user_id
where r.nombre ilike '%TOBI%';        -- ← cambiá el nombre (o usá r.id = '...')


-- ---------------------------------------------------------------------------
-- CERRAR UN AVISO A MANO (ya apareció y la familia no puede entrar)
-- ---------------------------------------------------------------------------
-- Mejor hacerlo desde el panel (aviso → 🛡️ Admin → Marcar "Ya en casa"), que
-- además dispara el festejo. Esto es la red por si el panel no está a mano.
-- update public.reportes set estado = 'resuelto' where id = 'PEGA_EL_ID';


-- ---------------------------------------------------------------------------
-- NOTIFICACIONES: quién las tiene activadas
-- ---------------------------------------------------------------------------
-- push_subs guarda DISPOSITIVOS (celu + tablet = 2 filas), no personas.
select count(*)                    as dispositivos,
       count(distinct user_id)     as personas,
       (select count(*) from auth.users) as usuarios_totales
from public.push_subs;

-- Quiénes son (para entender el perfil del que sí las activa)
select u.email, count(*) as dispositivos, max(p.creado_en) as ultima_alta
from public.push_subs p
join auth.users u on u.id = p.user_id
group by u.email
order by ultima_alta desc;


-- ---------------------------------------------------------------------------
-- SALUD DEL FEED
-- ---------------------------------------------------------------------------
-- Avisos por estado (activo / resuelto / pausado)
select estado, count(*) from public.reportes group by estado order by 2 desc;

-- Perdidos activos hace más de 7 días: los que necesitan un empujón
select nombre, localidad, zona, creado_en::date, recordatorio_en::date
from public.reportes
where tipo = 'perdido' and estado = 'activo'
  and creado_en < now() - interval '7 days'
order by creado_en;

-- Avisos sin foto (se ven mucho peor en el feed y no entran en la búsqueda por foto)
select id, nombre, tipo, creado_en::date
from public.reportes
where estado = 'activo' and (foto is null or foto = '')
order by creado_en desc;

-- Avisos sin huella visual: no aparecen entre los "parecidos" de Encontré.
-- Si hay muchos, correr "Recalcular huellas visuales" en el panel.
select count(*) as sin_huella
from public.reportes
where estado = 'activo' and foto is not null and foto <> '' and embedding is null;


-- ---------------------------------------------------------------------------
-- ACTIVIDAD DE LA COMUNIDAD
-- ---------------------------------------------------------------------------
-- Aportes de vecinos por tipo (visto / sé de quién es / se escapa / peligro)
select coalesce(tipo, 'visto') as tipo, count(*)
from public.avistamientos group by 1 order by 2 desc;

-- Reencuentros por mes, y cuántos tienen la foto del reencuentro
select date_trunc('month', coalesce(resuelto_en, creado_en))::date as mes,
       count(*) as reencuentros,
       count(foto_reencuentro) as con_foto
from public.reportes
where estado = 'resuelto'
group by 1 order by 1 desc;

-- Dónde está pasando (avisos activos por ciudad)
select localidad, count(*) filter (where tipo = 'perdido')    as perdidos,
                  count(*) filter (where tipo = 'encontrado') as encontrados,
                  count(*) as total
from public.reportes
where estado = 'activo'
group by localidad order by total desc;


-- ---------------------------------------------------------------------------
-- LIMPIEZA
-- ---------------------------------------------------------------------------
-- Avisos de prueba (ojo: borra de verdad, mirar primero con el select)
-- select * from public.reportes where autor = 'DEMO';
-- delete from public.reportes where autor = 'DEMO';
