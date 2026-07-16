-- Auto-archivar suave: un perdido activo hace +60 días, ya avisado y sin acción,
-- pasa a estado 'pausado'. NO se borra, NO se marca "Ya en casa" (sería mentira):
-- sale del feed pero queda en Mi cuenta con un botón Reactivar.
--
-- La regla de oro: nunca esconder de sorpresa el aviso de una familia que sigue
-- buscando. Por eso hay pre-aviso 3 días antes, y es reversible siempre.
--
-- Todo esto es NO destructivo: agrega columnas y actualiza admin_stats. La app
-- vieja sigue andando igual (nadie escribe estas columnas hasta que se despliegue
-- el cron resumen-diario nuevo). Correr en Supabase → SQL Editor → Run.

-- Cuándo le mandamos el pre-aviso al dueño ("en 3 días pausamos"). Igual que
-- recordatorio_en: para no repetirlo cada día. Se compara contra creado_en.
alter table public.reportes add column if not exists preaviso_en timestamptz;

-- Cuándo se pausó (para "en pausa desde hace X" y para el panel). El reactivar lo
-- vuelve a null.
alter table public.reportes add column if not exists pausado_en timestamptz;


-- admin_stats: ya tiene el contador 'enPausa' agregado en schema-admin.sql. Volvé a
-- correr esa función entera (create or replace ... hasta el grant) para que tome el
-- campo nuevo. El resto no cambia: 'activos' ya filtra estado='activo', así que los
-- pausados salen solos de ese número.
