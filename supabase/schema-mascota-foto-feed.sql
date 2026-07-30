-- Recorte apaisado de la foto de una mascota (el que el dueño encuadra en el cropper,
-- "¿qué se ve en el feed?").
--
-- Por qué: la mascota guardaba SOLO la foto completa, y la tarjeta de Mis mascotas la
-- recortaba por CSS (object-fit: cover), que agarra el centro — no lo que la persona
-- había elegido. Guardar solo el recorte tampoco servía: el perfil público del QR
-- muestra la foto grande y casi cuadrada, donde el apaisado quedaría mal. Así que van
-- las dos, igual que en los avisos (foto = completa, foto_feed = recorte).
--
-- Las mascotas ya cargadas quedan sin recorte y las vistas caen a `foto`; al editarlas
-- y volver a encuadrar la foto, se guarda. Si este SQL todavía no se corrió, el alta y
-- la edición funcionan igual (el store reintenta sin la columna).
alter table public.mascotas
  add column if not exists foto_feed text;
