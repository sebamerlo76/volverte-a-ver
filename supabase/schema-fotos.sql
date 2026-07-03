-- Varias fotos por aviso (hasta 3). Se mantiene la columna `foto` como principal
-- (thumbnail de tarjetas + huella visual); `fotos` guarda todas, en orden.
alter table public.reportes
  add column if not exists fotos text[];
