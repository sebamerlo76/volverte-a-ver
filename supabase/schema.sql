-- ===========================================================================
-- "Volverte a ver" — esquema inicial para Supabase
-- Pegá TODO esto en Supabase -> SQL Editor -> New query -> Run.
-- ===========================================================================

-- 1) Tabla de reportes -------------------------------------------------------
create table if not exists public.reportes (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null check (tipo in ('perdido', 'encontrado')),
  especie      text not null check (especie in ('perro', 'gato', 'otro')),
  nombre       text,
  zona         text,
  referencia   text,
  color        text,
  tamano       text,
  raza         text,
  descripcion  text,
  foto         text,
  whatsapp     text,
  autor        text default 'Anónimo',
  fecha_evento date,
  creado_en    timestamptz not null default now(),
  estado       text not null default 'activo'
);

create index if not exists reportes_creado_en_idx on public.reportes (creado_en desc);

-- 2) Seguridad a nivel de fila (RLS) ----------------------------------------
-- MVP sin cuentas de usuario: cualquiera puede LEER y PUBLICAR.
-- (Más adelante, con login, se restringe borrar/editar al dueño.)
alter table public.reportes enable row level security;

drop policy if exists "lectura publica" on public.reportes;
create policy "lectura publica" on public.reportes
  for select using (true);

drop policy if exists "alta publica" on public.reportes;
create policy "alta publica" on public.reportes
  for insert with check (true);

-- 3) Storage para las fotos --------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "fotos lectura publica" on storage.objects;
create policy "fotos lectura publica" on storage.objects
  for select using (bucket_id = 'fotos');

drop policy if exists "fotos alta publica" on storage.objects;
create policy "fotos alta publica" on storage.objects
  for insert with check (bucket_id = 'fotos');

-- 4) (Opcional) Datos de ejemplo para no arrancar vacío ---------------------
insert into public.reportes (tipo, especie, nombre, zona, referencia, color, tamano, raza, descripcion, whatsapp, autor, fecha_evento)
values
  ('perdido', 'gato', 'Michi', 'Parque Urquiza', 'a 3 cuadras del túnel', 'Atigrado', 'Mediano', 'Común europeo', 'Muy asustadizo, mancha blanca en el pecho.', '3434123456', 'Sofía G.', '2026-06-28'),
  ('perdido', 'perro', 'Rocco', 'Centro', 'a 6 cuadras de plaza 1° de Mayo', 'Marrón y negro', 'Grande', 'Ovejero mestizo', 'Collar azul, responde a "Rocco".', '3434777888', 'Martín P.', '2026-06-28'),
  ('encontrado', 'gato', null, 'San Agustín', 'sobre calle Newton', 'Blanca', 'Pequeña', 'Común europeo', 'Gatita blanca muy mansa, sin collar.', '3434555111', 'Vet. San Agustín', '2026-06-27');
