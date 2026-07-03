-- "Seguir" un aviso: recibir novedades de una mascota puntual (nuevos
-- avistamientos, o que apareció), sin ser el dueño.
create table if not exists public.seguidores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reporte_id uuid not null references public.reportes(id) on delete cascade,
  creado_en timestamptz not null default now(),
  unique (user_id, reporte_id)
);
create index if not exists seguidores_reporte_idx on public.seguidores (reporte_id);

alter table public.seguidores enable row level security;
drop policy if exists "seguidores sel" on public.seguidores;
drop policy if exists "seguidores ins" on public.seguidores;
drop policy if exists "seguidores del" on public.seguidores;
create policy "seguidores sel" on public.seguidores for select using (user_id = auth.uid());
create policy "seguidores ins" on public.seguidores for insert with check (user_id = auth.uid());
create policy "seguidores del" on public.seguidores for delete using (user_id = auth.uid());
