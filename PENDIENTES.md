# Volverte a ver — Pendientes e ideas

App de mascotas perdidas/encontradas para Paraná (Entre Ríos).
En vivo: https://volverte-a-ver.vercel.app · Código: https://github.com/sebamerlo76/volverte-a-ver

---

## ✅ Hecho

- App web (React + Vite), desplegada en Vercel con deploy automático.
- Base de datos y fotos en Supabase (nube, compartido).
- Cuentas: **email + contraseña** y **Google**.
- Mi cuenta: **Mis mascotas** (cargás tu perro/gato) + **Mis avisos**.
- Publicar en **dos caminos**: "Se me perdió" (rápido desde tus mascotas) / "Encontré" (paso a paso).
- Editar / borrar / marcar **reencontrado**; pestaña **🎉 Reencontrados** (finales felices).
- Campos: sexo, edad, collar, **recompensa** (con aviso anti-estafa).
- **Campos clickeables** (color, sexo, tamaño, etc.) para carga rápida y datos limpios.
- **Mapa real** (OpenStreetMap/Leaflet, gratis).
- **Avistamientos** ("¡Lo vi acá!", sin login) con **recorrido** en el mapa.
- Mapa del recorrido a **pantalla completa** (mover/zoom, centrar, encuadre).
- **Globitos** (popups) en los pines con día/hora/quién/cómo.
- Botón "Limpiar filtros"; foto de perfil de Google en el header.

---

## 🔜 Próximo / priorizado

- [ ] **Mapa como pantalla principal** — el inicio puede ser el mapa con todos los avisos activos (tarjetas como vista alternativa).
- [ ] **Filtros sobre el mapa** — que los chips (perdido/encontrado, especie, zona) apliquen también al mapa.
- [ ] **#3 Filtros progresivos** — panel "Filtrar" para que no se sature al crecer (en vez de muchos chips).
- [ ] **Filtro por tiempo** — "esta semana", "este mes" (útil con muchos avisos).
- [ ] **Pines siempre visibles** en todos los mapas (encuadre automático).

---

## 💡 Ideas a futuro

- [ ] **Múltiples fotos** por aviso.
- [ ] **Teléfono** además de WhatsApp.
- [ ] **Raza clickeable** (hoy es texto libre).
- [ ] **Acciones rápidas**: marcar reencontrado desde la lista sin abrir el aviso.
- [ ] **Buscar dentro de "Mis avisos"** (si alguien tiene muchos).
- [ ] **Notificaciones de coincidencias** (avisar cuando aparece una parecida).
- [ ] **QR para el collar** (escanear y ver el perfil / avisar).
- [ ] **Reconocimiento facial** de mascotas (cruzar perdidos con encontrados).
- [ ] **Compartir a Facebook** (además de WhatsApp).
- [ ] **Dominio propio** (ej: volverteaver.com.ar).
- [ ] Botón centrar: opción "volver a la zona del aviso" además de "al pin".

---

## 🧹 Limpieza / técnico

- [ ] Borrar avisos de prueba cuando no los necesites: `delete from public.reportes where autor = 'DEMO';` (y el viejo "Prueba Nube").
- [ ] **Staging** (cuando lance): trabajar en rama + preview de Vercel; base Supabase de prueba aparte para no tocar producción con SQL/datos.
- [ ] **Producción de email**: reactivar "Confirm email" en Supabase + configurar un SMTP.
- [ ] **Anti-spam** en avistamientos (hoy cualquiera puede dejar uno sin login).

---

## 📣 Difusión (cuando esté listo)

- [ ] Compartir el link en grupos de Facebook/WhatsApp de mascotas de Paraná.
- [ ] Sumar veterinarias y refugios locales.
