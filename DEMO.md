# Chicho demo (para grabar tutoriales)

Una copia de Chicho que corre **sin Supabase** — todo local, con datos de ejemplo.
Sirve para grabar videos de tutorial (publicar, cargar mascota, "Encontré una", etc.)
**sin tocar la base real, sin disparar notificaciones y sin filmar avisos de gente
de verdad**.

## Por qué es seguro

La app decide sola: si no encuentra las variables de Supabase, arranca en modo local
(`src/lib/supabase.js` → `supabaseConfigurado = false`). En ese modo:

- No hay conexión al servidor → **imposible** disparar una notificación (no hay a
  quién notificar) y **nada se guarda** en la base real.
- El feed son las mascotas de ejemplo de `src/data/seed.js` (nombres, fotos y
  teléfonos **inventados**) → no exponés a nadie.
- No pide login: `logueado = !authActivo || ...`, y sin Supabase `authActivo` es
  false. Podés publicar directo.

Son **dos Chicho separados**: el real (con Supabase) y el demo (sin Supabase). No hay
nada que replicar a mano — es el **mismo repo**, así que cada push actualiza los dos.

## Setup (una sola vez, en Vercel)

1. Vercel → **Add New… → Project** → importá **el mismo repo** de GitHub
   (`sebamerlo76/volverte-a-ver`). Se puede importar dos veces; no rompe el real.
2. Nombre: `chicho-demo` (o el que quieras).
3. **Environment Variables: NO agregar `VITE_SUPABASE_URL` ni
   `VITE_SUPABASE_ANON_KEY`.** Esa ausencia es todo el truco. (Tampoco hace falta
   `VITE_VAPID_PUBLIC_KEY` — el push no va en demo.)
4. Deploy. Queda en algo como `chicho-demo.vercel.app`.
5. (Opcional) Dominio propio, ej. `demo.chicho.ar`.

Listo. De ahí en más los dos proyectos se despliegan solos con cada push a `main`;
la demo nunca queda atrás.

## Cómo saber que estás en modo demo

- En la consola del navegador: `[Chicho] Supabase no configurado — usando
  almacenamiento local del navegador.`
- Entrás sin login y podés publicar de una.
- El feed muestra a Michi, Rocco, Lola y compañía (los del seed).

## Qué anda y qué no en la demo

**Anda** (tiene camino local): el feed, publicar un aviso, cargar/editar mascotas,
"Encontré una", Mis ubicaciones, marcar "Ya en casa", renovar, seguir. Todo se
guarda solo en ese teléfono (localStorage) y se borra si limpiás los datos del sitio.

**No anda** (necesita el servidor): recibir un push real, el panel admin
(`admin_stats`), el reconocimiento por foto que sugiere parecidos (baja un modelo y
compara contra la base). Para tutoriales de esos flujos, se muestran en el Chicho
real con una cuenta de prueba, no acá.

## Para que la demo quede linda

`src/data/seed.js` es lo que se ve. La app real lo ignora (usa Supabase), así que se
puede editar libre. Al cambiarlo en el teléfono, puede quedar cacheado lo viejo:
limpiá los datos del sitio o abrí en incógnito para ver el seed nuevo.
