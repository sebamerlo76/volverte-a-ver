-- ===========================================================================
-- "Volverte a ver" — Cuentas de usuario y dueño de cada aviso
-- Pegá TODO esto en Supabase -> SQL Editor -> New query -> Run.
-- (Es seguro correrlo aunque ya hayas corrido el schema.sql anterior.)
-- ===========================================================================

-- 1) Cada aviso queda atado a quién lo publicó -------------------------------
alter table public.reportes
  add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- 2) Permisos (RLS) ----------------------------------------------------------
-- Leer: cualquiera (la app es pública para buscar).
-- Publicar: solo usuarios con sesión iniciada.
-- Editar / borrar: solo el dueño del aviso.

drop policy if exists "alta publica" on public.reportes;      -- vieja: cualquiera publicaba
drop policy if exists "alta autenticada" on public.reportes;
create policy "alta autenticada" on public.reportes
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "editar propio" on public.reportes;
create policy "editar propio" on public.reportes
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "borrar propio" on public.reportes;
create policy "borrar propio" on public.reportes
  for delete to authenticated
  using (user_id = auth.uid());

-- 3) Storage de fotos: subir solo con sesión (lectura sigue pública) ---------
drop policy if exists "fotos alta publica" on storage.objects;
drop policy if exists "fotos alta autenticada" on storage.objects;
create policy "fotos alta autenticada" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos');

-- ===========================================================================
-- IMPORTANTE (además de este SQL): en el panel de Supabase, entrá a
--   Authentication -> Providers -> Email  y DESACTIVÁ "Confirm email".
-- Así la gente puede crear cuenta y usar la app al instante, sin depender de
-- que llegue un mail de confirmación. (Para producción real conviene volver a
-- activarlo y configurar un SMTP, pero para arrancar así está perfecto.)
-- ===========================================================================
