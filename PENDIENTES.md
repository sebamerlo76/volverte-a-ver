# Chicho — Pendientes e ideas

Buscador de mascotas perdidas/encontradas para Paraná (Entre Ríos).
En vivo: https://chicho.ar · Código: https://github.com/sebamerlo76/volverte-a-ver

---

## ✅ Hecho

**Base**
- App web (React + Vite), desplegada en Vercel con deploy automático.
- Datos y fotos en Supabase (nube, compartido).
- **PWA instalable** (Agregar a pantalla de inicio) con service worker.

**Marca**
- **Rebrand a "Chicho"**: paleta navy + crema, logo del perrito en el pin (barra, login, perfil del QR e ícono de la app). Los estados siguen en rojo (perdido) / verde (encontrado).

**Cuentas**
- Login **email + contraseña** y **Google**.
- Mi cuenta: **Mis mascotas** + **Mis avisos**.

**Publicar**
- **Dos caminos**: "Se me perdió" (rápido desde tus mascotas) / "Encontré" (paso a paso).
- Editar / borrar / marcar **reencontrado**; pestaña **🏠 En casa** (reencuentros).
- **Ubicación exacta** en el mapa al publicar (tocás el punto / GPS).
- Campos clickeables (color, sexo, tamaño, collar, edad) + **recompensa** (con aviso anti-estafa).
- **En tránsito**: marcar que retenés a la mascota que encontraste (queda en Mi cuenta).
- **Raza** en chips (comunes o escribir otra), **hasta 3 fotos** con carrusel en el aviso, y **Ciudad → barrio** (estructura escalable: sumar Santa Fe = agregar un dato).

**Mapa y búsqueda**
- Mapa real (OpenStreetMap/Leaflet, gratis); inicio con toggle **Lista / Mapa** y filtros compartidos.
- Pines con **emoji de especie** (🐕🐈🐾) manteniendo el color del estado.
- **Avistamientos** ("¡Lo vi acá!", sin login) con **recorrido** en el mapa, globitos y pantalla completa.
- Avistador puede dejar su **WhatsApp** → el dueño lo contacta ("Escribirle").
- **Buscador flotante multi-palabra y sin acentos** (ej: "perro marrón", "gato con collar").
- Filtros (Especie/Barrio/Cuándo con **Hoy**) que **tapan los resultados** mientras filtrás; "Limpiar filtros"; botón **mi ubicación** (GPS).
- "En casa" (reencontrados) en **ámbar** (distinto de Encontrado); fondo blanco cálido; al borrar un aviso desde Mi cuenta, volvés a Mi cuenta.

**Inteligente**
- **Reconocimiento visual** 🐶🔍: al cargar un "Encontré", sugiere los perdidos **parecidos por foto** (modelo CLIP corriendo en el navegador, gratis y privado).
- **Notificaciones push** 🔔: "apareció una parecida" (usa el reconocimiento), "alguien vio a tu mascota", "nuevo aviso en tu zona" (por **ciudad o provincia**, más los barrios si elegiste una sola ciudad; y tus lugares de "Mis ubicaciones" van solos). PWA + Edge Function en Supabase.
- **Seguir una mascota**: botón Seguir en el aviso + cartelito para crear cuenta al dejar un avistamiento → te llegan las novedades y el "🎉 ¡apareció!".
- **QR para el collar**: chapita imprimible que abre el perfil público (`/m/<id>`) con WhatsApp.

**Compartir y contacto**
- **Flyer para compartir**: genera una imagen linda del aviso (foto, estado, nombre, zona, chips, recompensa) con logo + chicho.ar, lista para WhatsApp/Facebook.
- **Link directo al aviso** (`chicho.ar/r/<id>`): el flyer/compartir incluye el link que abre justo esa mascota.
- **Botón Llamar** además de WhatsApp (usa el mismo número).

**Dominio y solidez**
- **Dominio propio `chicho.ar`** (con HTTPS), delegado a Vercel; Supabase Auth y Google OK.
- **Endurecimiento de seguridad** (warnings de Supabase: search_path en funciones, revoke del trigger).
- **Avistamiento a prueba de balas** (si falla el alta con WhatsApp, reintenta y no se pierde).
- Publicar **instantáneo** (la huella visual se calcula en segundo plano, ya no cuelga el guardado).

---

## 🔜 Próximo / priorizado

**Epic "menú de usuario" — Etapa 2 (Etapa 1 ya hecha: header cara/logo/campana + menú + secciones + nombre/teléfono):**
- [x] **Mis ubicaciones**: lugares guardados + zonas de aviso (tabla `ubicaciones` + Edge Function considera las zonas guardadas). ✅ *(correr `schema-ubicaciones.sql` + redeploy de `notificar`)*
- [x] **Desactivar cuenta** reversible (oculta avisos vía `reportes.oculto` + baja de push + flag; reactivar los muestra). ✅ *(correr `schema-desactivar.sql` + redeploy de `notificar`)*
- [x] **Guía**: sumada la pantalla "Instalá la app" (Android + iPhone). ✅ → **Etapa 2 COMPLETA**.
- [x] **Banner "hay versión nueva"** (PWA): version.json por build + chequeo → "Actualizar" recarga. ✅
- [x] Usar el **teléfono guardado** para autocompletar el WhatsApp al publicar. ✅
- [x] **Guía de bienvenida / recorrido**: carrusel de 5 pasos, "no volver a mostrar", accesible desde el menú como "Guía". ✅

- [x] **Backend de features:** SQLs corridos (localidad, fotos, contacto avist., seguridad) + Edge Function `notificar` re-desplegada (chip "Todos" + filtro por ciudad). ✅
- [ ] **Anti-spam** en avistamientos (hoy cualquiera puede dejar uno sin login).
- [ ] **Borrar los avisos de prueba** (demo) — **el usuario los mantiene por ahora para probar**.
- [ ] **Email**: para lanzar se va con **"Confirm email" OFF** (Google primario, registro sin depender de correo). SMTP propio (Resend) + "recuperar contraseña" quedan para cuando se quiera reforzar.

---

## 💡 Ideas a futuro

- [x] **Múltiples fotos** por aviso (hasta 3 + carrusel). ✅
- [x] **Teléfono** además de WhatsApp — botón Llamar con el mismo número. ✅
- [x] **Compartir con imagen linda** (flyer del aviso) para WhatsApp/Facebook + **link directo al aviso**. ✅
- [x] **Preview rico del link** (`/r/<id>`): serverless function `api/og.js` que inyecta los tags OG por aviso (foto + nombre + estado + zona), así al pegar el link en un grupo la tarjeta muestra la mascota y no el ícono genérico. ✅ Ojo: en Vercel `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` tienen que estar disponibles **en runtime** para las functions (si no, cae al genérico, no rompe). Test: `node test/og.test.mjs`.
  - [ ] **v2**: en vez de la foto cruda, generar una imagen 1200×630 (el flyer) como `og:image` — tarjeta más linda y sin recortes raros.
- [ ] **Editar un aviso como admin** (30-jul-2026, diferido a propósito): hoy el admin puede
  **borrar** y **desbloquear** avisos ajenos, pero no **corregir** (una zona mal escrita, un
  nombre con un error, datos de contacto en la descripción). Surgió porque Sebastián vio un
  WhatsApp con el país duplicado — pero eso se arregló de raíz normalizando el número
  (`numeroWa` en src/lib/formato.js), así que ya no urge. Si aparece otro caso raro:
  botón "Editar como admin" en Detalle que abra el formulario normal + un RPC security
  definer gateado por `es_admin()` para poder guardar avisos de otros (RLS solo deja lo
  propio) — mismo patrón que `admin_embedding` en supabase/schema-huellas-admin.sql.
- [x] **Extender `fotoOptimizada()` al resto de las miniaturas** ✅ (1-ago-2026). Se
  auditaron las 31 `<img>` de la app y se cubrieron todas las que faltaban, con el ancho
  que cada una necesita: 200 para las de 44-64 px (panel de reencuentros, Moderación,
  ElegirMascota, el thumb de un aporte, el globito del mapa, GestionAviso) y 800 para la
  vista previa de una coincidencia y la foto del perfil del QR.
  Siguen SIN transformar a propósito: el hero del Detalle y el Lightbox (ahí hace falta
  ver bien al animal, y el Lightbox tiene zoom), la foto que se está por subir (todavía es
  local) y el avatar de Google (otra CDN — `fotoOptimizada` la devuelve intacta).
  **Lo caro del día fue el bug que apareció en el camino**: la transformación de Supabase
  usa `cover` por defecto, así que pasarle sólo `width` RECORTA en vez de escalar (con el
  recorte del feed de 800x400, pedir 300 devolvía 300x400 — una franja vertical). En el
  feed no se veía porque 800 coincide con el original. Se arregló agregando
  `resize=contain` en src/lib/foto.js: **si algún día se toca esa función, ese parámetro
  no se saca**.
- [x] **Bajar el LCP de campo: 4 cambios chicos** ✅ (los 4 hechos el 31-jul-2026; falta
  que la ventana de 28 días de PageSpeed los refleje — **no sacar conclusiones antes de
  fines de agosto**). Efecto ya visible en laboratorio: LCP **10,7 s → 9,1 s**, bloqueo de
  renderizado 300 → 150 ms, caché ineficiente 1055 → 322 KiB. La nota sigue en 58 y va a
  seguir: la dominan FCP y Speed Index, que dependen del celu simulado.
  **Lo próximo, si se retoma el tema, es el INP** (243 ms, 65% de la gente en "bueno"):
  está a 10 puntos de aprobar, más cerca que el LCP (47%). Antes de tocar nada hay que
  MEDIR qué interacción lo causa — candidatos: cambiar de pestaña en el feed (re-render de
  la lista entera) y abrir un aviso.
  Contexto para no volver a diagnosticar de cero: el **58 del laboratorio
  es un espejismo** (Lighthouse simula un Moto G Power con la CPU frenada 4×). Lo que
  importa es el **campo**, que ya trae 28 días de usuarios reales: FCP **1,8 s** (era 7,4
  antes del boot splash ✅) pero LCP **4,1 s** e INP **243 ms** → "no se aprueba" (CLS 0 ✅).
  Ojo con un efecto perverso al leer el LCP de campo: el elemento LCP es el cartel de
  bienvenida, que **sólo lo ve quien entra por primera vez**, así que una campaña de
  tráfico nuevo empeora el número aunque el sitio esté mejor.
  El servidor NO es el problema: medido `curl` a chicho.ar da **366 ms de TTFB, 0
  redirecciones, `X-Vercel-Cache: HIT`** desde São Paulo. El 1,4 s de TTFB del informe es
  la red 4G de la gente.
  **El elemento LCP es el cartel de bienvenida** (`<div class="guia-d">`, WelcomeGuide.jsx),
  y su desglose es **TTFB 0 ms + 2530 ms de "retraso de renderizado"**: no espera un
  recurso, espera a que baje y monte el JS. Los 4 cambios atacan ese número:
  - **A. Segundo `preconnect` a Supabase sin `crossorigin`** en index.html (dejando el que
    ya está). El informe lo marca "conexión previa sin usar" y a la vez lo lista como
    candidato con **330 ms de ahorro de LCP**: el `crossorigin` sirve para el `fetch` del
    feed, pero las fotos `<img>` se piden sin CORS y abren otra conexión desde cero.
    Riesgo nulo, una línea.
  - **B. Mover el prefetch del mapa a después de que la app pintó** (App.jsx, el
    `requestIdleCallback` con `timeout: 3000`). En un celu lento el navegador nunca queda
    libre, así que **el timeout se cumple y baja el mapa a los 3 s justos**, en plena
    pelea por pintar: `MapaLeaflet.js` (2775 ms) y su CSS (2825 ms) son **la rama más
    larga de la ruta crítica**, y reaparecen como "JS sin usar: 38,9 KiB". Son 54 KB que
    en esa visita nadie mira. Ojo al tocarlo: la idea original (que el mapa esté listo
    cuando toquen "Mapa") es buena y hay que conservarla — mover el momento, no sacarlo.
  - **C. `logo-boot.png` (176×176, 5,6 KB) en vez de `logo.png` (500×500, **57,8 KB**)** en
    las 8 pantallas que lo muestran a 42-86 px: Auth, EliminarCuenta, Feed, GestionAviso,
    NuevaPassword, PerfilPublico, Privacidad, WelcomeGuide. **NO tocar `src/lib/flyer.js`**,
    que ahí el logo se imprime y necesita los 500 px.
  - **D. Sacarle el `lazy` al WelcomeGuide**: su chunk pesa **1,9 KB** y estamos pagando un
    viaje de red entero (1214 ms en el árbol) por eso. Cadena actual: HTML (388 ms) →
    index.js 165 KB (830 ms) → WelcomeGuide.js. Suma 1,9 KB al bundle inicial y elimina
    un salto serializado del camino al LCP.
  **Cómo verificar (importante):** el 58 del lab casi no se va a mover — el número a mirar
  es el **LCP de campo**, y la ventana de PageSpeed son 28 días, así que recién se ve a los
  20-30 días. No sacar conclusiones a las 48 h.
- [ ] **Ver el recorrido de la gente dentro de la app** (1-ago-2026, diferido). Surgió
  mirando el embudo de la campaña: sabemos cuántos llegan y cuántos activan los avisos,
  pero no **qué hacen en el medio ni dónde se caen**.
  **Lo que ya hay, para no re-descubrirlo**: `@vercel/analytics` en src/main.jsx (visitas,
  países, dispositivos de TODO el tráfico — se mira en Vercel → Analytics) y el píxel de
  Meta en src/lib/pixel.js, que da el embudo completo pero **sólo de quien viene de un
  anuncio**: PageView → EntroConSesion → AvisosOfrecidos → AvisosActivados.
  **Por qué ninguno sirve para el recorrido**: Chicho es una sola página. Abrir un aviso,
  ir al mapa o publicar no cambian la URL, así que todo lo que mida "páginas vistas" ve
  una sola pantalla. Los eventos personalizados de Vercel Analytics son de plan pago.
  **Recomendación (mía, para discutir al retomar): propio sobre Supabase.** Una tabla de
  eventos y un insert por acción — no pesa (el cliente ya está cargado), no suma terceros
  al rendimiento que tanto costó, los datos quedan en casa y el panel de Admin ya existe
  para mostrarlos. La alternativa es GA4: trae el diagrama de rutas hecho, pero son ~50 KB
  de terceros y en un SPA hay que mandarle los eventos a mano igual, así que no ahorra
  trabajo — sólo cambia el destino.
  **Los pasos que interesan**: entró → miró un aviso → tocó Perdí/Encontré → se registró →
  publicó → siguió un aviso → activó avisos.
  **Dos cosas que hay que resolver ANTES de escribir código**:
  1. **Actualizar la política de privacidad** (public/privacidad/index.html): hoy declara
     el píxel de Meta y nada más. Guardar qué hace la gente se declara, aunque no haya
     datos personales. Estamos en vivo.
  2. **Decidir anónimo o con `user_id`.** Anónimo alcanza para el embudo y evita que la
     base sea un registro de qué hizo cada vecino; con user_id es más potente para
     soporte. Se puede empezar anónimo y agregar después — al revés no.
  Ver también la nota de límites en ESCALA.md: cada evento es una fila, y conviene
  decidir de entrada cada cuánto se borran los viejos (¿90 días?).
- [ ] **Buscar parecidos con TODAS las fotos, no sólo la primera** (1-ago-2026, diferido a
  pedido de Sebastián). Hoy en "Encontré" se pueden subir hasta 3 fotos, pero la huella
  visual se calcula sólo sobre `fotos[0]` (EncontreWizard.jsx, el efecto que depende de
  `fotos[0]?.url`). Las otras se guardan y se ven en el carrusel, pero no buscan. Si la
  primera salió movida o es de lomo, el parecido se calcula con esa aunque la segunda sea
  mucho mejor — y dos ángulos distintos encuentran cosas que uno solo no.
  **Cómo**: calcular la huella de cada foto y quedarse con el MEJOR parecido de todas
  contra cada perdido (máximo, no promedio: el promedio castiga tener una foto mala).
  **Lo que hay que medir antes**: cuánto tarda. Hoy el modelo (DINOv2, ~24 MB) analiza una
  foto en el celu; con tres son tres pasadas y el paso 2 ya tiene un "Analizando…". Si se
  siente lento, se puede analizar la primera y dejar las otras en segundo plano,
  refrescando la lista cuando terminen.
  Relacionado: la idea de guardar varias huellas por aviso (el lado del que publica) —
  eso necesita columna nueva y más cómputo al publicar.
- [ ] **Abrir el buscador por foto a los usuarios** (3-ago-2026). Hoy está en el panel
  (sección "🔎 ¿Esta mascota está en Chicho?", src/components/BuscarPorFoto.jsx) y es sólo
  de admin **a propósito**: sirve para ver cuánto acierta con fotos de grupos, que vienen
  mucho peores que las que se suben a la app (capturas de pantalla, recortes, marcas de
  agua, fotos de fotos). Cuando haya evidencia de que anda bien con eso, el paso natural
  es que cualquiera pueda tirar una foto y preguntar "¿está publicada?" sin tener que
  empezar el asistente de Encontré ni crear cuenta.
  **Antes de abrirlo, decidir**: si se limita por zona (el asistente compara con la ciudad
  + 20 km; el panel compara con todos, que para grupos es lo correcto), y si se muestra el
  puntaje (en la app se sacó a propósito, ver el historial del wizard).
  Ojo: el modelo son ~24 MB para quien lo use. Hoy sólo lo baja el que entra a Encontré.
- [ ] **Fotitos de raza** (grilla visual curada) — más adelante, con imágenes con licencia.
- [ ] **Recalcular huellas visuales viejas** (26-jul-2026): desde hoy la huella (embedding
  CLIP) se calcula sobre el RECORTE del feed (menos fondo → mejores parecidos), pero los
  avisos ya publicados tienen la huella de la foto completa. Mientras conviven, el matching
  anda igual (un lado ya viene limpio). Cuando moleste: una acción de admin que recorra los
  activos con foto y regenere `embedding` desde `foto` (el recorte) con `guardarEmbedding`.
- [x] **Matching por foto: swap a DINOv2** ✅ (28-jul-2026). El criterio que habíamos
  escrito se cumplió en la primera prueba real (banda apretada 0.72-0.76 entre un blanco,
  un negro y un tricolor contra una consulta canela), y el A/B con los avisos reales
  (`node scripts/ab-similitud.mjs`, usa la 2ª foto de cada aviso como consulta) fue
  categórico: DINOv2 11/13 top-1 con margen +0.155 vs CLIP 8/13 con margen −0.005 —
  y encima pesa 24MB contra 85MB (el usuario baja MENOS). Piso recalibrado a 0.4.
  Migración: deploy + "Recalcular huellas visuales" en Admin (las huellas de distinto
  largo dan similitud 0: transición sin fallas mudas, verificado en las dos `similitud`).
  - **Descartado a esta escala** (análisis de un PDF externo): FAISS (índice para
    millones de vectores con servidor; acá los candidatos post-filtro son 5-15 y la
    fuerza bruta tarda microsegundos — si algún día explota, el paso es pgvector en
    Supabase), inferencia en servidor (Chicho corre el modelo en el celu a propósito:
    gratis y privado), y entrenar un modelo propio de re-identificación (necesita un
    dataset de pares del mismo animal que hoy no existe). El porcentaje visible se
    probó y se sacó. Los filtros por atributos y el "quitar fondo" (recorte) ya están.
  matchea desde cualquier ángulo. Necesita columna nueva (SQL) y más cómputo al publicar.
  Para cuando haya más volumen.
- [ ] **Auto-detectar color/tamaño desde la foto** (idea de Sebastián, 26-jul-2026): que al
  subir la foto en "Encontré" se precarguen color/tamaño del paso siguiente. Diferido: el
  modelo actual (huella para parecidos) no clasifica atributos, y estimar color por píxeles
  falla feo (fondo, luz, sombras) — precargar mal es peor que no precargar. Si algún día se
  hace: modelo clasificador aparte (o API de visión), corriendo en el cliente como el actual.
- [x] **Raza clickeable** — chips de razas comunes (perro/gato) o escribir otra, en Publicar y Encontré. ✅ (fotitos de raza quedan para más adelante)
- [ ] **Acciones rápidas**: marcar reencontrado desde la lista sin abrir el aviso.
- [ ] **Buscar dentro de "Mis avisos"** (si alguien tiene muchos).
- [ ] **Compartir a Facebook** (además de WhatsApp).
- [x] **Dominio propio**: `chicho.ar` en vivo. ✅
- [x] Botón centrar: opción "volver a la zona del aviso" además de "a mi pin". ✅
- [x] **Foto opcional en el avistamiento** (imagen del lugar donde se lo vio) — miniatura en el recorrido y el globito. ✅

---

## 🧹 Limpieza / técnico

- [ ] **Staging** (cuando lance): trabajar en rama + preview de Vercel; base Supabase de prueba aparte para no tocar producción con SQL/datos.
- [ ] Borrar avisos de prueba: `delete from public.reportes where autor = 'DEMO';` (y el viejo "Prueba Nube").

---

## 📣 Difusión (cuando esté listo)

- [ ] **Estrategia por barrios + embajadores**: crecer barrio por barrio en Paraná (el "seguí tu barrio" y "seguí a esta mascota" son los ganchos), y en espiral al resto de la ciudad; después otras localidades.
- [ ] Compartir el link en grupos de Facebook/WhatsApp de mascotas de Paraná.
- [ ] Sumar veterinarias y refugios locales.
- [ ] **Publicar en Play Store** (más adelante, cuando esté validado). NO hay que reprogramar: se "envuelve" la PWA en una TWA con **PWABuilder** (genera el `.aab`). Requiere: cuenta de desarrollador de Google (**US$25** único), **política de privacidad** (URL), **`assetlinks.json`** en el dominio, material de tienda, y —para cuentas personales nuevas— **prueba cerrada con 20 testers × 14 días**. Por ahora la PWA "instalable" alcanza; la tienda suma credibilidad/alcance cuando la app ya tenga uso.

## 🤖 Play Store — mantenimiento

- [ ] **⚠️ Target API 36 (Android 16) — antes del 30-ago-2026.** Google exige que la
  TWA apunte a API 36 desde esa fecha (aviso recibido el 2026-07-19). **Estado
  (28-jul-2026):** se intentó DOS veces con PWABuilder (versionCode 3 el 25-jul y
  versionCode 4 el 28-jul) y **ambas salieron con SDK objetivo 35** — PWABuilder aún
  no actualizó su target. El borrador de la v4 se descartó sin publicar. **Plan A
  elegido por Sebastián**: re-chequear PWABuilder una vez por semana (regenerar el
  paquete tarda 5 min y el "SDK objetivo" se ve en la tabla del bundle al subirlo a
  Play — verificar SIEMPRE ese número antes de publicar). Fechas: chequear ~4-ago y
  ~11-ago (junto con la re-solicitud de producción); si al **~15-ago** sigue en 35,
  pasar al **Plan B: Bubblewrap local** (la CLI de Google debajo de PWABuilder):
  generar el proyecto, editar `targetSdkVersion`/`compileSdkVersion` a 36 en el
  build.gradle generado, y compilar en la máquina de Sebastián (él tipea las
  contraseñas del keystore en SU terminal, nunca por el chat). Requiere JDK + SDK
  de Android (~2GB, Bubblewrap ofrece instalarlos).
  - Mismo proceso PWABuilder: `ar.chicho.app` → versionCode **4** (o el que siga) →
    Signing **"Use mine"** con `signing.keystore` (carpetas v2/v3/v4: misma llave).
  - La huella del assetlinks del sitio (`63:1D:D4:…`) es la de **Play App Signing**
    (Google re-firma); la del zip de PWABuilder (`6B:A9:…`) es la llave de subida.
    Son distintas a propósito: **no tocar el assetlinks de chicho.ar**.

- [ ] **Cuándo migrar de TWA (a futuro, no urgente).** Hoy TWA es la decisión correcta:
  un solo código (la web) sirve web + Android, se actualiza al instante con `git push`
  (la app de Play sólo abre chicho.ar), y valida la idea sin costo de app nativa. Corre
  Chrome real por debajo, no un WebView viejo. Convendría saltar a **Capacitor** (envuelve
  la misma web con acceso nativo → se reaprovecha casi todo el código) o **React Native**
  el día que pegue contra una de estas paredes:
  - **iPhone en la App Store**: TWA es sólo Android; en iOS Chicho anda como PWA (agregar
    a inicio), pero para estar en la store de Apple hace falta wrapper (Capacitor) o nativo.
  - **Features nativas profundas**: ubicación en segundo plano, widgets, Bluetooth, cámara
    avanzada.
  - **Pulcritud "de app cara"**: animaciones/gestos que sólo se logran nativo.
  Mientras Chicho sea contenido + notificaciones + mapa, TWA alcanza y sobra.
