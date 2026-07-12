-- ===========================================================================
-- Columna resuelto_en + trigger: registra CUÁNDO un aviso pasó a "resuelto".
-- Sirve para el resumen diario (contar reencuentros del día) y, a futuro, para
-- el tiempo promedio hasta "Ya en casa".
--
-- Correr una vez en Supabase -> SQL Editor -> New query -> Run.
-- El trigger funciona para cualquier camino que resuelva un aviso: el dueño
-- logueado (update directo) y el link de gestión sin cuenta (RPC). No hay que
-- tocar nada del frontend.
-- ===========================================================================

alter table public.reportes add column if not exists resuelto_en timestamptz;

create or replace function public.set_resuelto_en()
returns trigger language plpgsql as $$
begin
  -- Al pasar a 'resuelto' (y no estarlo antes), estampamos la fecha.
  if new.estado = 'resuelto' and (old.estado is distinct from 'resuelto') then
    new.resuelto_en := now();
  -- Si se reactiva (vuelve a activo), limpiamos la fecha.
  elsif new.estado <> 'resuelto' then
    new.resuelto_en := null;
  end if;
  return new;
end $$;

drop trigger if exists trg_resuelto_en on public.reportes;
create trigger trg_resuelto_en
  before update on public.reportes
  for each row execute function public.set_resuelto_en();
