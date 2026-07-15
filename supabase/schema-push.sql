-- Notificaciones push: suscripciones de dispositivos + preferencias por usuario.

-- Un dispositivo suscripto (endpoint del navegador + claves de cifrado).
create table if not exists public.push_subs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  creado_en timestamptz not null default now()
);
create index if not exists push_subs_user_idx on public.push_subs (user_id);

alter table public.push_subs enable row level security;
drop policy if exists "push_subs sel" on public.push_subs;
drop policy if exists "push_subs ins" on public.push_subs;
drop policy if exists "push_subs upd" on public.push_subs;
drop policy if exists "push_subs del" on public.push_subs;
create policy "push_subs sel" on public.push_subs for select using (user_id = auth.uid());
create policy "push_subs ins" on public.push_subs for insert with check (user_id = auth.uid());
create policy "push_subs upd" on public.push_subs for update using (user_id = auth.uid());
create policy "push_subs del" on public.push_subs for delete using (user_id = auth.uid());

-- Preferencias de notificación (una fila por usuario).
create table if not exists public.notif_prefs (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  avisar_match boolean not null default true,
  avisar_avistamiento boolean not null default true,
  avisar_cerca boolean not null default false,
  -- Acá había centro_lat/centro_lng/radio_km (un punto y un radio). Se borraron el
  -- 2026-07-15: hacían lo mismo que "Mis ubicaciones" y las dos ramas terminaban en
  -- el mismo destC de la función notificar. El alcance ahora se define por nombre,
  -- con las columnas que agregan schema-localidad.sql y provincia-notifs.sql
  -- (localidades[], provincias[], barrios[]). Ver schema-ubicaciones-ciudad.sql.
  especie text not null default 'todas',
  creado_en timestamptz not null default now()
);

alter table public.notif_prefs enable row level security;
drop policy if exists "notif_prefs sel" on public.notif_prefs;
drop policy if exists "notif_prefs ins" on public.notif_prefs;
drop policy if exists "notif_prefs upd" on public.notif_prefs;
create policy "notif_prefs sel" on public.notif_prefs for select using (user_id = auth.uid());
create policy "notif_prefs ins" on public.notif_prefs for insert with check (user_id = auth.uid());
create policy "notif_prefs upd" on public.notif_prefs for update using (user_id = auth.uid());
