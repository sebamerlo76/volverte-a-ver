-- Similitud visual de mascotas (reconocimiento por foto).
-- Guarda la "huella" (embedding) de la foto de cada aviso como JSON.
-- La huella se calcula en el navegador del usuario (gratis, sin servidor).
alter table public.reportes
  add column if not exists embedding jsonb;
