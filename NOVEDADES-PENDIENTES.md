# Novedades pendientes de publicar

Cola de mejoras que ya están en vivo y todavía no se contaron. El formato del bloque y
quién lo agrega están en `CLAUDE.md` → "Cuando salga una mejora que el usuario nota".

- El **chat de código** agrega el bloque en el mismo commit que la mejora, y es el
  **único que edita este archivo**: también es el que tacha y el que borra.
- El **chat de novedades** manda el push desde el panel y después avisa al de código
  qué bloque ya está contado, para que lo borre.
- El **chat de guiones** avisa cuando salió el video o el posteo.

Ningún chat que no sea el de código escribe acá, aunque sea "sólo una tilde": un
commit es un commit y dispara un deploy (`CLAUDE.md` → "Quién toca qué").

Archivo vacío quiere decir que está todo contado.

Las 18 novedades del arranque (todo lo hecho hasta `8d2d71e`) se llevan aparte, en el
calendario del hilo de novedades. Acá van las mejoras nuevas, de ahí en adelante.

---

## Ahora entrás a ver las mascotas en un toque

- commit: "Bienvenida: que se pueda entrar a ver los avisos desde la primera pantalla" · 31-jul-2026
- Qué cambió: al entrar por primera vez había un recorrido de 7 pantallas, y para llegar
  a los avisos había que pasarlas todas de a una o encontrar un "Saltar" chiquito y gris
  arriba. Ahora la primera pantalla tiene un botón grande que dice **"Ver las mascotas"**
  y te lleva derecho al listado; el recorrido queda abajo como opción, para el que lo quiera.
- Por qué le importa: el que llega desde un link compartido en un grupo de Facebook o por
  WhatsApp entra buscando si está su mascota, no a leer siete pantallas. Antes muchos se
  quedaban trabados ahí y no llegaban nunca a ver un aviso.
- Dónde se ve: abrí chicho.ar en una ventana de incógnito (o borrá los datos del sitio) y
  es la primera pantalla, la de "¡Bienvenido a Chicho!". Abajo se ven los dos botones:
  el navy **"Ver las mascotas"** y debajo **"Ver cómo funciona"**. Tocando el primero
  aparece el feed al instante.
- [ ] push desde el panel    [ ] redes
