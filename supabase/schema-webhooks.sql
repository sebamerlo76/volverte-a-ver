-- Dispara la Edge Function 'notificar' cuando se inserta/actualiza un reporte o
-- se inserta un avistamiento. Alternativa por SQL a los "Database Webhooks".
--
-- ANTES: activar la extensión pg_net (Database → Extensions → pg_net → ON).
-- Reemplazá PEGA_TU_SERVICE_ROLE por tu clave secreta (sb_secret_... o eyJ...).

create extension if not exists pg_net;

create or replace function public.disparar_notificar()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'https://ltrutscputgtmrxpmjbm.supabase.co/functions/v1/notificar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer PEGA_TU_SERVICE_ROLE'
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', to_jsonb(NEW),
      'old_record', case when TG_OP = 'UPDATE' then to_jsonb(OLD) else null end
    )
  );
  return NEW;
end;
$$;

-- Reportes: alta (match/cerca) y edición (para detectar "apareció").
drop trigger if exists trg_notificar_reportes on public.reportes;
create trigger trg_notificar_reportes
  after insert on public.reportes
  for each row execute function public.disparar_notificar();

drop trigger if exists trg_notificar_reportes_upd on public.reportes;
create trigger trg_notificar_reportes_upd
  after update on public.reportes
  for each row execute function public.disparar_notificar();

-- Avistamientos: alta (avisar al dueño y a los seguidores).
drop trigger if exists trg_notificar_avistamientos on public.avistamientos;
create trigger trg_notificar_avistamientos
  after insert on public.avistamientos
  for each row execute function public.disparar_notificar();
