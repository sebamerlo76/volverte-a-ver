# Chicho

PWA de mascotas perdidas y encontradas. **En vivo** en https://chicho.ar (y en Google
Play como TWA). React 18 + Vite (JS, sin TypeScript) + Supabase.

Todo en **español rioplatense**: código, comentarios, commits y lo que ve el usuario.

## Quién toca qué

Hay varios chats abiertos sobre este proyecto, con trabajos distintos:

- **Chat de código** — el **único** que edita archivos, commitea y pushea.
- **Chat de guiones/videos (Instagram), el de novedades y cualquier otro** — **NO
  edita ni un archivo, no commitea, no pushea.** Lee el código para escribir con
  precisión, y nada más. Si encuentra un bug o una inconsistencia: **lo reporta, no
  lo arregla.**

"Archivo" es **cualquier** archivo del repo, no sólo código: los `.md` también
cuentan, incluido este. "Es sólo documentación" no es una excepción — un commit es
un commit, y `git push` dispara un deploy en Vercel.

Si otro chat necesita un cambio en el repo (una regla nueva acá, un bloque en
`NOVEDADES-PENDIENTES.md`), **se lo pide al chat de código y él lo commitea**. El
único que borra bloques de la cola es el hilo de novedades, y lo hace pidiéndolo
también.

Si no sabés cuál sos, preguntá antes de escribir un archivo. Dos chats tocando el
mismo repo en vivo es la forma más rápida de romper algo.

## Los dos deploys: producción y el demo

El mismo repo está publicado dos veces, y `git push` actualiza los dos:

- **chicho.ar** — producción. Base real, usuarios reales, notificaciones reales.
- **chicho-demo.vercel.app** — el mismo código **sin las variables de Supabase**. Corre
  en modo local (localStorage): cada visitante ve su propio contenido, arranca vacío y
  **no toca la base**. Ahí Sebastián graba los tutoriales de Instagram, para no dispararle
  avisos falsos a la gente.

**Cómo distinguirlos de verdad**: mirar `var u = '%VITE_SUPABASE_URL%'` en el HTML servido.
Si el literal quedó **sin reemplazar**, es el demo. **NO alcanza con mirar el
`<link rel="preconnect">` a Supabase: está escrito a mano en `index.html` y aparece igual
en los dos.** Ese error ya se cometió una vez y llevó a afirmar que el demo escribía en
producción y a recomendar borrarlo.

En el demo no anda nada que necesite la base (~31 funciones del store): panel de admin,
push, seguir avisos, historial de reencuentros, link de gestión sin cuenta y las huellas
visuales guardadas. **Es esperable, no un bug.** Sí andan publicar, editar, marcar
reencuentro, mascotas, avistamientos, ubicaciones, mapa y filtros.

Desde el 7-ago el demo se saca solo de Google: `index.html` inyecta `noindex` cuando
detecta que faltan las variables (si no, aparecería en las búsquedas un Chicho vacío
compitiendo con el real).

## Estamos EN VIVO

Hay usuarios reales y avisos de mascotas perdidas de verdad. Lo que sale, la gente lo
ve o le falla. Por eso:

- **Verificá, no supongas.** Lo que afirmes tiene que estar comprobado contra el
  código, la base o la app. Si no lo pudiste comprobar (algo pide login, el panel de
  preview no pinta), **decilo explícitamente** en vez de darlo por hecho.
- **Leé el código antes de afirmar cómo funciona algo.** No tu memoria ni lo que
  recordás de la charla: ya pasó varias veces que la memoria estaba vieja y el código
  decía otra cosa.
- **Ojo con lo que falla mudo.** Es el modo de falla dominante acá: un `data || []`
  que tapa el error de una query, un `--` que hace que el SQL conteste "Success" sin
  hacer nada, un deploy viejo que sigue corriendo igual. Si algo puede fallar callado,
  dejale rastro (un log, un error que grite) antes de seguir.
- **Dudá de tu propia sonda.** Ante un resultado negativo sorprendente, revisá primero
  el comando de verificación: ya dio falsos negativos.
- Los cambios de datos van **en pasos**, con lo destructivo al final y sólo después de
  ver la app andando.

## Qué corre Sebastián (no el asistente)

- **El SQL**, siempre, en su Supabase. Se le da el SQL listo para pegar; nunca se ejecuta.
- **Los deploys de Edge Functions** (`supabase functions deploy <fn>`). Ojo: el
  `git push` **no** las actualiza — sólo despliega el front (Vercel, automático).
- **Nunca** pedirle que pegue contraseñas, API keys ni la service_role en el chat.

## Para saber qué cambió

`git log` es el registro de novedades: los commits explican el qué y **el porqué**. No
hay changelog a mano, a propósito — se desactualiza. Ver también `PENDIENTES.md`
(ideas/pendientes) y `ESCALA.md` (límites al crecer).

## Cuando salga una mejora que el usuario nota

Si un commit cambia algo que la persona **ve o siente**, el chat de código suma un
bloque al final de `NOVEDADES-PENDIENTES.md`, en el mismo commit que la mejora:

    ## <título corto, como se lo contás a un vecino>
    - commit: "<asunto del commit>" · <fecha>
    - Qué cambió: <una o dos líneas, sin palabras de programador>
    - Por qué le importa: <qué gana quien está buscando a su mascota>
    - Dónde se ve: <pantalla y botón exactos, para poder filmarlo>
    - [ ] push desde el panel    [ ] redes

Va el **asunto** del commit y no el hash: el hash sale del contenido del commit, así que
escribirlo adentro lo cambia y queda apuntando a un commit que no existe. Con el asunto
se llega igual: `git log --grep "<asunto>"`.

No es un changelog, es una **cola**: el hilo de novedades manda el push desde el panel
y avisa que ya está contado; el de guiones avisa cuando salió el video. **El que tacha
o borra el bloque es siempre el chat de código** (ver "Quién toca qué"). Archivo vacío
= está todo contado. Lo de "dónde se ve" no es opcional: sin eso el guion se escribe a
ciegas.

Los cambios internos (refactors, dependencias, tooling) **no** van: sólo lo que
alguien puede ver o sentir en la app.

## Palabras

- **Nunca** decir "final feliz": en Argentina tiene connotación sexual. Usar
  **"reencuentro"** o **"volvió a casa"**.
- Se dice **"mascota"**, no "animalito".

## Comandos

- `npm run build` — tiene que quedar limpio antes de commitear.
