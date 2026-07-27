-- Recalcular huellas (embeddings) como admin. El botón "Recalcular huellas
-- visuales" del panel Admin regenera la huella de cada aviso desde el recorte del
-- feed (la columna foto): las huellas viejas se calculaban de la foto entera y el
-- fondo ensuciaba los "parecidos por foto". Los avisos son de otros usuarios y RLS
-- solo deja actualizar lo propio, así que va por RPC security definer gateada por
-- es_admin() — mismo patrón que admin_reencuentros.
create or replace function public.admin_embedding(rid uuid, emb jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.es_admin() then raise exception 'No autorizado'; end if;
  update public.reportes set embedding = emb where id = rid;
end;
$$;
grant execute on function public.admin_embedding(uuid, jsonb) to authenticated;
