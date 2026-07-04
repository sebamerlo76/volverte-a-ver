-- Centro de notificaciones in-app: guarda cada aviso que se le manda a un usuario,
-- para que pueda revisarlos después en la campanita (además del push del sistema).

create table if not exists public.notificaciones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  titulo      text not null,
  cuerpo      text,
  reporte_id  uuid,   -- aviso relacionado (para abrirlo al tocar la notificación)
  tipo        text,   -- match | cerca | avistamiento | aparecio | novedad
  leida       boolean not null default false,
  creado_en   timestamptz not null default now()
);

create index if not exists notificaciones_user_idx
  on public.notificaciones (user_id, creado_en desc);

alter table public.notificaciones enable row level security;

-- Cada usuario ve SOLO las suyas.
drop policy if exists "notif lectura propia" on public.notificaciones;
create policy "notif lectura propia" on public.notificaciones
  for select using (auth.uid() = user_id);

-- Y solo puede marcar como leídas las suyas.
drop policy if exists "notif update propia" on public.notificaciones;
create policy "notif update propia" on public.notificaciones
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- El alta la hace la Edge Function con service_role (saltea RLS): no hace falta
-- policy de INSERT para usuarios anónimos/autenticados.
