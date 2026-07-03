-- Contacto opcional de quien deja un avistamiento, para que la familia le escriba.
alter table public.avistamientos
  add column if not exists whatsapp text;
