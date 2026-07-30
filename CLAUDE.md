# Chicho

PWA de mascotas perdidas y encontradas. **En vivo** en https://chicho.ar (y en Google
Play como TWA). React 18 + Vite (JS, sin TypeScript) + Supabase.

Todo en **español rioplatense**: código, comentarios, commits y lo que ve el usuario.

## Quién toca qué

Hay varios chats abiertos sobre este proyecto, con trabajos distintos:

- **Chat de código** — el **único** que edita archivos, commitea y pushea.
- **Chat de guiones/videos (Instagram) y cualquier otro** — **NO edita ni un archivo,
  no commitea, no pushea.** Lee el código para escribir con precisión, y nada más.
  Si encuentra un bug o una inconsistencia: **lo reporta, no lo arregla.**

Si no sabés cuál sos, preguntá antes de escribir un archivo. Dos chats tocando el
mismo repo en vivo es la forma más rápida de romper algo.

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
    - commit: <hash corto> · <fecha>
    - Qué cambió: <una o dos líneas, sin palabras de programador>
    - Por qué le importa: <qué gana quien está buscando a su mascota>
    - Dónde se ve: <pantalla y botón exactos, para poder filmarlo>
    - [ ] push desde el panel    [ ] redes

No es un changelog, es una **cola**: el hilo de novedades manda el push desde el panel
y borra el bloque; el de guiones tilda "redes" cuando salió el video. Archivo vacío =
está todo contado. Lo de "dónde se ve" no es opcional: sin eso el guion se escribe a
ciegas.

Los cambios internos (refactors, dependencias, tooling) **no** van: sólo lo que
alguien puede ver o sentir en la app.

## Palabras

- **Nunca** decir "final feliz": en Argentina tiene connotación sexual. Usar
  **"reencuentro"** o **"volvió a casa"**.
- Se dice **"mascota"**, no "animalito".

## Comandos

- `npm run build` — tiene que quedar limpio antes de commitear.
