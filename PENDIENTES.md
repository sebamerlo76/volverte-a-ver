# Chicho — Pendientes e ideas

Buscador de mascotas perdidas/encontradas para Paraná (Entre Ríos).
En vivo: https://volverte-a-ver.vercel.app · Código: https://github.com/sebamerlo76/volverte-a-ver

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
- Editar / borrar / marcar **reencontrado**; pestaña **🏠 En casa** (finales felices).
- **Ubicación exacta** en el mapa al publicar (tocás el punto / GPS).
- Campos clickeables (color, sexo, tamaño, collar, edad) + **recompensa** (con aviso anti-estafa).
- **En tránsito**: marcar que retenés a la mascota que encontraste (queda en Mi cuenta).

**Mapa y búsqueda**
- Mapa real (OpenStreetMap/Leaflet, gratis); inicio con toggle **Lista / Mapa** y filtros compartidos.
- Pines con **emoji de especie** (🐕🐈🐾) manteniendo el color del estado.
- **Avistamientos** ("¡Lo vi acá!", sin login) con **recorrido** en el mapa, globitos y pantalla completa.
- Avistador puede dejar su **WhatsApp** → el dueño lo contacta ("Escribirle").
- **Buscador flotante multi-palabra y sin acentos** (ej: "perro marrón", "gato con collar").
- Filtros progresivos (Especie/Barrio), por tiempo y orden; "Limpiar filtros"; botón **mi ubicación** (GPS).

**Inteligente**
- **Reconocimiento visual** 🐶🔍: al cargar un "Encontré", sugiere los perdidos **parecidos por foto** (modelo CLIP corriendo en el navegador, gratis y privado).
- **Notificaciones push** 🔔: "apareció una parecida" (usa el reconocimiento), "alguien vio a tu mascota", "nuevo aviso en tu zona" (por **barrios** o punto+radio). PWA + Edge Function en Supabase.
- **Seguir una mascota**: botón Seguir en el aviso + cartelito para crear cuenta al dejar un avistamiento → te llegan las novedades y el "🎉 ¡apareció!".
- **QR para el collar**: chapita imprimible que abre el perfil público (`/m/<id>`) con WhatsApp.

---

## 🔜 Próximo / priorizado

- [ ] **Anti-spam** en avistamientos (hoy cualquiera puede dejar uno sin login).
- [ ] **Borrar los avisos de prueba** (demo) antes de lanzar de verdad.
- [ ] **Producción de email**: reactivar "Confirm email" en Supabase + configurar un SMTP.

---

## 💡 Ideas a futuro

- [ ] **Múltiples fotos** por aviso.
- [ ] **Teléfono** además de WhatsApp.
- [ ] **Raza clickeable** (hoy es texto libre).
- [ ] **Acciones rápidas**: marcar reencontrado desde la lista sin abrir el aviso.
- [ ] **Buscar dentro de "Mis avisos"** (si alguien tiene muchos).
- [ ] **Compartir a Facebook** (además de WhatsApp).
- [ ] **Dominio propio** (ej: chicho.com.ar).
- [ ] Botón centrar: opción "volver a la zona del aviso" además de "al pin".

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
