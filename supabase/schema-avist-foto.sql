-- Foto opcional del avistamiento (imagen del lugar/momento donde se lo vio).
alter table public.avistamientos
  add column if not exists foto text;
