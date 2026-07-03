-- Dispara la Edge Function 'notificar' cuando se inserta un reporte o un
-- avistamiento. Alternativa por SQL a los "Database Webhooks" del panel
-- (por si el panel no muestra la sección Webhooks).
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
    body := jsonb_build_object('type', 'INSERT', 'table', TG_TABLE_NAME, 'record', to_jsonb(NEW))
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notificar_reportes on public.reportes;
create trigger trg_notificar_reportes
  after insert on public.reportes
  for each row execute function public.disparar_notificar();

drop trigger if exists trg_notificar_avistamientos on public.avistamientos;
create trigger trg_notificar_avistamientos
  after insert on public.avistamientos
  for each row execute function public.disparar_notificar();
