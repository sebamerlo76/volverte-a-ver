-- Anti-estafa: reportar números de WhatsApp sospechosos (patrón de las denuncias).
-- Cualquiera puede reportar (1 por dispositivo). A las 3 denuncias, la app muestra
-- una advertencia en los avisos que usan ese número.
create table if not exists public.numeros_estafa (
  id uuid primary key default gen_random_uuid(),
  numero text not null,        -- normalizado: solo dígitos, últimos 10
  device text not null,
  motivo text,
  creado_en timestamptz default now(),
  unique (numero, device)
);
create index if not exists idx_numeros_estafa_num on public.numeros_estafa (numero);

alter table public.numeros_estafa enable row level security;
-- Nadie lee la tabla directo (se consulta por RPC); las escrituras van por RPC (security definer).

-- Reportar un número. Devuelve cuántos dispositivos distintos lo reportaron.
create or replace function public.reportar_numero(num text, dev text, motivo text)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare n int;
begin
  if num is null or length(num) < 6 then
    return 0;
  end if;
  insert into public.numeros_estafa (numero, device, motivo)
  values (num, dev, motivo)
  on conflict (numero, device) do nothing;
  select count(distinct device) into n from public.numeros_estafa where numero = num;
  return n;
end;
$$;
grant execute on function public.reportar_numero(text, text, text) to anon, authenticated;

-- Cuántos dispositivos distintos reportaron un número (para la advertencia).
create or replace function public.reportes_de_numero(num text)
returns int
language sql
security definer
set search_path = public, pg_temp
as $$
  select coalesce(count(distinct device), 0)::int from public.numeros_estafa where numero = num;
$$;
grant execute on function public.reportes_de_numero(text) to anon, authenticated;
