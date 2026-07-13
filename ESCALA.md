# Chicho — Guía de escalar 📈

Todo lo que vamos a necesitar mirar a medida que crezca, con **dónde ver** cada
límite. Los números son **orientativos** (los planes cambian): la fuente de
verdad siempre es el dashboard de cada servicio. Última revisión: 2026-07.

---

## Resumen: en qué orden van a pegar los límites

Para Chicho (muchas fotos, tráfico creciente), el orden probable es:

1. **Supabase Storage (fotos)** — el más probable de pegar primero.
2. **Supabase Egress / bandwidth** — servir esas fotos a la gente.
3. **Tiles de OpenStreetMap** — si el tráfico pega un salto grande.
4. **Vercel Web Analytics / Speed Insights (eventos)** — topes de eventos.
5. **Resend (emails)** — solo si activamos email masivo.
6. **Supabase base de datos (tamaño)** — crece lento (es texto), va último.

> **Regla de oro:** lo que más cuesta al escalar son **las fotos** (guardarlas y
> servirlas). Todo lo demás es barato o gratis por mucho tiempo.

---

## 1. Supabase (base, fotos, auth, notificaciones)

**Para qué:** base de datos (avisos, usuarios, prefs), **Storage de fotos**,
login (Auth), Edge Functions (`notificar`, `resumen-diario`), y el motor de push.

**Plan actual:** Free. **Plan siguiente:** Pro (~US$25/mes).

| Recurso | Free (aprox) | Pro (aprox) | Qué lo consume en Chicho |
|---|---|---|---|
| **Storage (fotos)** | ~1 GB | ~100 GB | Cada foto de aviso/mascota. **El primero en apretar.** |
| **Egress / bandwidth** | ~5 GB/mes | ~250 GB/mes | Servir fotos + datos a los usuarios |
| **Base de datos** | ~500 MB | ~8 GB | Filas (texto) — crece lento |
| **Edge Functions** | ~500 mil llamadas/mes | ~2 M/mes | `notificar` (por aviso), crons |
| **Usuarios activos (MAU)** | ~50 mil | ~100 mil | Logins |

**Dónde ver:** Supabase → tu proyecto → **Reports** (uso por métrica) y
**Settings → Billing / Usage** (barras de cada límite del plan).

**Qué hacer cuando se acerque:**
- **Fotos (lo más importante):** ya subimos un recorte liviano para el feed
  (`subirFotoFeed`). Si el Storage se llena, opciones: (a) comprimir/redimensionar
  más agresivo antes de subir, (b) borrar fotos de avisos viejos resueltos,
  (c) pasar a Pro, (d) mover las fotos a un CDN/almacenamiento más barato
  (Cloudflare R2, Backblaze) — cambio de mediano esfuerzo.
- **En Pro** se puede poner un **spend cap** (tope de gasto) para no llevarte
  sorpresas: Settings → Billing.

---

## 2. Vercel (hosting del front + deploys)

**Para qué:** sirve la web (JS/CSS de la app) y despliega en cada push a `main`.

**Plan actual:** Hobby (gratis). **Plan siguiente:** Pro (~US$20/mes por miembro).

| Recurso | Hobby (aprox) | Qué lo consume en Chicho |
|---|---|---|
| **Bandwidth** | ~100 GB/mes | Bajar el bundle de la app (las **fotos NO** salen de acá, salen de Supabase) → crece **lento** |
| **Build minutes** | límite mensual | Cada deploy (son cortos) |
| **Web Analytics (eventos)** | ~2.5 mil eventos/mes | Cada visita cuenta un evento → **puede apretar antes que el bandwidth** |
| **Speed Insights** | tier gratis limitado | Métricas de velocidad |

**Ojo legal:** el plan **Hobby es para uso no comercial**. Si Chicho pasa a
tener fines comerciales (venta de chapitas, etc.), Vercel pide **Pro**.

**Dónde ver:** Vercel → tu proyecto → **Usage** (bandwidth, builds, analytics
events). También te llega mail cuando te acercás a un tope.

**Qué hacer:** el front es liviano, así que el bandwidth aguanta muchísimo. Lo
primero que puede toparse es **Web Analytics (eventos)** — si pasa, o subís a
Pro, o desactivás Analytics (no afecta a la app, es solo para vos).

---

## 3. Mapas: OpenStreetMap (tiles) + Nominatim (buscar direcciones)

**Para qué:** el mapa embebido (Leaflet + tiles de OSM) y buscar calle+altura
(Nominatim). **Ambos gratis, sin cuenta, sin API key.**

**El "límite":** es una **política de uso razonable**, no un número con
dashboard. Los servidores públicos de OSM/Nominatim están para tráfico moderado;
si un app los golpea muy fuerte, pueden **rate-limitear o bloquear** la IP.

**Dónde ver:** no hay dashboard (no hay cuenta). La señal es indirecta: si los
mapas empiezan a **cargar lento o gris**, o la búsqueda de direcciones falla
seguido, puede ser rate-limit.

**Qué hacer cuando el tráfico crezca (no urgente):** pasar los **tiles** a un
proveedor con plan y dashboard: **MapTiler / Stadia Maps / Carto** (todos con
tier gratis generoso). Es **cambiar una línea** (la URL de los tiles en
`MapaLeaflet.jsx`). Para geocodificar en volumen, esos mismos proveedores o
Google Geocoding.

> Nota: el botón **"Cómo llegar"** abre Google Maps/Waze por link externo — eso
> no tiene costo ni límite nuestro (usa la app del celular del usuario).

---

## 4. Resend (emails)

**Para qué:** mails de **recupero de contraseña** (y a futuro, si lo activamos,
el resumen diario por email).

**Plan actual:** Free (~3 mil emails/mes, ~100/día). **Siguiente:** desde ~US$20/mes.

**Dónde ver:** Resend → **Usage / Logs**.

**Qué hacer:** hoy el volumen es bajísimo (solo recuperos). Solo apretaría si
mandamos emails masivos. Barato de subir.

---

## 5. Web Push (notificaciones)

**Para qué:** las notificaciones push (VAPID + `web-push` en la edge function).

**Costo/límite:** **cero.** No es un servicio con cuota — mandamos directo a los
endpoints de push de cada navegador. Lo único que consume es **invocaciones de
Edge Function** (contadas en Supabase, ver punto 1).

---

## 6. Google Play

**Costo:** pago **único** de US$25 (ya hecho). No hay costo recurrente ni límite
de escala. Lo que hay que cuidar son las **políticas** (testing, data safety,
etc.), no un límite técnico.

---

## 7. Dominio chicho.ar

No es un límite de escala, pero **anotado para no olvidar:** el dominio `.ar` se
**renueva cada año** (NIC.ar). Si vence, se cae todo. Poner recordatorio anual.

---

## Reconocimiento por foto (onnxruntime)

Corre **100% en el navegador del usuario** (no en servidor). O sea: **escala
gratis**, no suma costo por más que crezca. 👍

---

## Checklist de "salud" (para mirar cada tanto)

- [ ] **Supabase → Reports/Usage:** ¿Storage cerca del límite? ¿Egress del mes?
- [ ] **Vercel → Usage:** ¿bandwidth y analytics events del mes?
- [ ] **Mapas:** ¿cargan rápido? (si no, pensar en cambiar de proveedor de tiles)
- [ ] **Resend → Usage:** ¿lejos del tope? (casi siempre sí)
- [ ] **Dominio:** ¿cuándo vence chicho.ar?

Cuando algo llegue al ~70-80% de su límite, es momento de actuar (subir de plan
o aplicar la mitigación de ese punto), sin apuro pero sin dejarlo pasar.
