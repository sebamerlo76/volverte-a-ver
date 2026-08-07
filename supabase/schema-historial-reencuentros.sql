-- ===========================================================================
-- Historial de reencuentros: cada vez que una mascota vuelve a casa (7-ago-2026).
--
-- "Es parte de la vida del bichito" (Sebastián). Hasta ahora el reencuentro vivía en el
-- propio aviso, así que se perdía al reabrirlo: si la mascota se volvía a perder, el
-- recuerdo anterior desaparecía. Acá queda uno por vez, para siempre.
--
-- POR QUÉ CUELGA DEL AVISO Y NO DE LA MASCOTA. Medido sobre los datos reales: de 34
-- perdidos, sólo 6 tienen la mascota cargada en "Mis mascotas" (y de 21 encontrados,
-- ninguno — ahí es correcto, son animales de otra gente). Colgándolo de la mascota, el
-- 82% de las familias se quedaría sin historial. mascota_id se guarda igual cuando está,
-- para poder agrupar por mascota el día que se quiera.
--
-- ES PRIVADO. Sólo lo ve su dueño (RLS por user_id). Un contador público de "se perdió 3
-- veces" se lee como reproche a la familia, y Chicho está para ayudarla.
--
-- Los datos se COPIAN (nombre, foto, lugar) en vez de referenciarse: si después borran o
-- editan el aviso, el recuerdo no se deshace. Un historial que se puede evaporar no es un
-- historial.
--
-- Correr una vez en Supabase → SQL Editor → New query → Run.
-- ===========================================================================

create table if not exists public.reencuentros (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  reporte_id  uuid references public.reportes(id) on delete set null,  -- puede borrarse el aviso
  mascota_id  uuid references public.mascotas(id) on delete set null,  -- si estaba cargada
  nombre      text,          -- copiado del aviso
  especie     text,
  tipo        text,          -- 'perdido' | 'encontrado'
  localidad   text,
  zona        text,
  foto        text,          -- la del reencuentro, si la subieron
  foto_aviso  text,          -- la del aviso: sirve de respaldo para mostrar algo
  dias        integer,       -- cuánto estuvo afuera (publicación → reencuentro)
  volvio_en   timestamptz not null default now(),
  creado_en   timestamptz not null default now()
);
create index if not exists reencuentros_user_idx on public.reencuentros (user_id, volvio_en desc);
create index if not exists reencuentros_mascota_idx on public.reencuentros (mascota_id);
-- Un reencuentro por aviso y por fecha: evita duplicar si el trigger corre dos veces o si
-- el relleno hacia atrás se ejecuta más de una vez.
create unique index if not exists reencuentros_unico on public.reencuentros (reporte_id, volvio_en);

alter table public.reencuentros enable row level security;
drop policy if exists "reencuentros sel" on public.reencuentros;
drop policy if exists "reencuentros upd" on public.reencuentros;
drop policy if exists "reencuentros del" on public.reencuentros;
-- Sólo lectura y borrado propios. El alta la hace el trigger (security definer), así que
-- no hace falta política de insert para el usuario.
create policy "reencuentros sel" on public.reencuentros for select using (user_id = auth.uid());
create policy "reencuentros upd" on public.reencuentros for update using (user_id = auth.uid());
create policy "reencuentros del" on public.reencuentros for delete using (user_id = auth.uid());


-- 1) Cuando un aviso pasa a 'resuelto', queda el recuerdo.
--
-- security definer porque escribe una fila del usuario dueño del aviso, y el que resuelve
-- puede ser él o el admin (o el link de gestión sin cuenta). Igual sólo puede escribir lo
-- que sale del propio aviso: no recibe nada de afuera.
create or replace function public.guardar_reencuentro()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.estado = 'resuelto' and (old.estado is distinct from 'resuelto') and new.user_id is not null then
    insert into public.reencuentros
      (user_id, reporte_id, mascota_id, nombre, especie, tipo, localidad, zona, foto, foto_aviso, dias, volvio_en)
    values (
      new.user_id, new.id, new.mascota_id, new.nombre, new.especie, new.tipo, new.localidad, new.zona,
      new.foto_reencuentro, new.foto,
      greatest(0, (now()::date - new.creado_en::date)),
      now()
    )
    on conflict (reporte_id, volvio_en) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_guardar_reencuentro on public.reportes;
create trigger trg_guardar_reencuentro
  after update on public.reportes
  for each row execute function public.guardar_reencuentro();


-- 2) La foto del reencuentro se sube DESPUÉS de marcarlo, así que hay que reflejarla en
--    el historial cuando llega. Se actualiza el último reencuentro de ese aviso.
create or replace function public.sync_foto_reencuentro()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.foto_reencuentro is distinct from old.foto_reencuentro and new.foto_reencuentro is not null then
    update public.reencuentros
       set foto = new.foto_reencuentro
     where id = (
       select id from public.reencuentros
        where reporte_id = new.id
        order by volvio_en desc
        limit 1
     );
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_foto_reencuentro on public.reportes;
create trigger trg_sync_foto_reencuentro
  after update on public.reportes
  for each row execute function public.sync_foto_reencuentro();


-- 3) RELLENO HACIA ATRÁS: los reencuentros que ya pasaron, para que el historial no
--    arranque vacío. Usa resuelto_en cuando está (lo estampa el trigger desde que existe)
--    y cae a creado_en para los más viejos. Es idempotente: el índice único lo protege,
--    así que correrlo dos veces no duplica nada.
insert into public.reencuentros
  (user_id, reporte_id, mascota_id, nombre, especie, tipo, localidad, zona, foto, foto_aviso, dias, volvio_en)
select
  r.user_id, r.id, r.mascota_id, r.nombre, r.especie, r.tipo, r.localidad, r.zona,
  r.foto_reencuentro, r.foto,
  greatest(0, (coalesce(r.resuelto_en, r.creado_en)::date - r.creado_en::date)),
  coalesce(r.resuelto_en, r.creado_en)
from public.reportes r
where r.estado = 'resuelto'
  and r.user_id is not null
on conflict (reporte_id, volvio_en) do nothing;

-- Para ver cómo quedó:
--   select nombre, tipo, dias, volvio_en::date, (foto is not null) as con_foto
--   from public.reencuentros order by volvio_en desc;
