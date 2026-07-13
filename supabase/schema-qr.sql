-- ===========================================================================
-- Chicho — QR para el collar (perfil público de la mascota)
-- Pegá TODO esto en Supabase -> SQL Editor -> New query -> Run.
-- ===========================================================================

-- 1) Un WhatsApp de contacto en la mascota (para que el QR pueda avisar).
alter table public.mascotas add column if not exists whatsapp text;

-- 2) Función pública y SEGURA: devuelve SOLO los datos públicos de UNA mascota
--    (la del id que trae el QR). No expone la tabla entera.
--    Ahora devuelve también reporte_id (el aviso perdido activo), para que quien
--    escanea pueda avisarle a la familia dónde lo vio (crea un avistamiento).
-- Cambia la firma (agrega reporte_id) → hay que DROP + CREATE.
drop function if exists public.perfil_publico(uuid);
create or replace function public.perfil_publico(m_id uuid)
returns table (
  nombre text, especie text, foto text, descripcion text,
  color text, tamano text, raza text, sexo text, edad text, collar text,
  whatsapp text, perdido boolean, zona text, reporte_id uuid
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    m.nombre, m.especie, m.foto, m.descripcion, m.color, m.tamano, m.raza,
    m.sexo, m.edad, m.collar, m.whatsapp,
    exists (
      select 1 from public.reportes r
      where r.mascota_id = m.id and r.estado = 'activo' and r.tipo = 'perdido'
    ) as perdido,
    (
      select r.zona from public.reportes r
      where r.mascota_id = m.id and r.estado = 'activo'
      order by r.creado_en desc limit 1
    ) as zona,
    (
      select r.id from public.reportes r
      where r.mascota_id = m.id and r.estado = 'activo' and r.tipo = 'perdido'
      order by r.creado_en desc limit 1
    ) as reporte_id
  from public.mascotas m
  where m.id = m_id;
$$;

-- Permitir que cualquiera (sin login) llame a la función con el id del QR.
grant execute on function public.perfil_publico(uuid) to anon, authenticated;
