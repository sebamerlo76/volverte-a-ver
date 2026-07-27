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
- [ ] **Fotitos de raza** (grilla visual curada) — más adelante, con imágenes con licencia.
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
  (25-jul-2026):** se regeneró el paquete en PWABuilder (versionCode **3**, carpeta
  `Desktop\Chicho\...package v3`, misma firma verificada por hash) y se subió a la
  prueba cerrada — **pero salió con SDK objetivo 35**: PWABuilder todavía no apunta
  a 36. Ese rebuild arregló el splash y llevó el nombre nuevo; **falta OTRO rebuild
  antes del 30-ago** cuando PWABuilder actualice su target:
  - Mismo proceso: PWABuilder → `ar.chicho.app` → versionCode **4** → Signing
    **"Use mine"** con `signing.keystore` (cualquier carpeta v2/v3, son la misma llave).
  - **Verificar en Play al subir** que "SDK objetivo" diga **36** (en la tabla del
    bundle) — no dar por hecho que PWABuilder ya lo subió.
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
