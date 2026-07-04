-- Desactivar cuenta (reversible): al desactivar, los avisos del usuario se marcan
-- oculto=true y dejan de aparecer en el feed / búsqueda / link directo. Reactivar los
-- vuelve a mostrar. (El flag de la cuenta va en user_metadata.desactivada.)
alter table public.reportes
  add column if not exists oculto boolean not null default false;

create index if not exists reportes_oculto_idx on public.reportes (oculto) where oculto;
