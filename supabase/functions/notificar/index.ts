// Edge Function "notificar": envía notificaciones push cuando se publica un aviso
// o un avistamiento. Se dispara por Database Webhooks (INSERT en reportes /
// avistamientos). Reusa el mismo criterio de matching que el asistente Encontré.
//
// Secrets que necesita (Dashboard → Edge Functions → notificar → Secrets):
//   VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT (ej: mailto:tu@mail.com)
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase solo.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') || 'mailto:sebamerlo76@gmail.com',
  Deno.env.get('VAPID_PUBLIC')!,
  Deno.env.get('VAPID_PRIVATE')!,
)

const ESP: Record<string, string> = { perro: 'perro', gato: 'gato', otro: 'animal' }

// Mismo criterio que EncontreWizard: si el otro no especificó, no descarta.
function compat(a: any, b: any, campo: string, ignorarNoSe = false) {
  const va = a[campo]
  if (!va || (ignorarNoSe && va === 'No sé')) return true
  if (!b[campo]) return true
  return va === b[campo]
}
function similitud(a: any, b: any) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}
// Compara barrios sin depender de espacios, mayúsculas ni acentos.
//
// Por qué: los avisos viejos traen el barrio escrito a mano ("Antonini " con un
// espacio al final), y con comparación exacta el que se suscribió a "Antonini" no
// recibía nada. La alternativa era "arreglar" reportes.zona, pero zona está entre
// los campos que disparan el push de "la familia actualizó el aviso": limpiar un
// espacio invisible le mandaría una notificación a cada seguidor. Mejor tolerar acá
// que tocar los datos de la gente.
//
// Es estrictamente más permisivo: sólo puede sumar destinatarios, nunca sacarlos.
function normBarrio(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // acentos (las marcas que deja el NFD)
    .replace(/^barrio\s+/, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ALCANCE POR DISTANCIA. Un aviso llega hasta donde esté a <= RADIO_ALCANCE_KM.
// Antes era una tabla de conurbanos a mano (CONURBANOS); no escalaba a toda la
// Argentina. Ahora es distancia.
// ⚠️ DEBE coincidir con src/lib/localidades.js: el radio Y los centros de las
// localidades. No se puede importar acá (Edge Function Deno), así que está
// duplicado a propósito: si cambiás el radio o sumás/movés una localidad allá,
// actualizalo acá también.
const RADIO_ALCANCE_KM = 20
const CENTROS: Record<string, [number, number]> = {
  'Paraná': [-31.7405, -60.523],
  'Crespo': [-32.0294, -60.3097],
  'Colonia Avellaneda': [-31.76, -60.485],
  'San Benito': [-31.7708, -60.4636],
  'General Ramírez': [-32.171, -60.208],
  'Córdoba': [-31.415532, -64.181483],
  'Villa Urquiza': [-31.65, -60.367],
  'Sauce Montrull': [-31.745, -60.355],
  'La Picada': [-31.735, -60.309],
  'Oro Verde': [-31.8237, -60.5159],
  'Neuquén': [-38.9516, -68.0591],
  'San Martín de los Andes': [-40.1579, -71.3534],
  'Olavarría': [-36.8937, -60.3233],
  'Cañuelas': [-35.0533, -58.76],
  'Santa Fe': [-31.6107, -60.6989],
  'San Juan': [-31.5375, -68.5364],
  'Rafaela': [-31.2536, -61.4914],
  'Ceres': [-29.8814, -61.945],
  'Selva': [-29.7628, -62.0503],
}
function centroDe(loc: string): [number, number] {
  return CENTROS[loc] || CENTROS['Paraná']
}
// Distancia en km entre dos puntos (haversine). Igual que en src/lib/localidades.js.
function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
// Las vecinas de una localidad (centro a centro <= radio). Pre-filtro del match.
function vecinasDe(loc: string): string[] {
  const c = centroDe(loc)
  return Object.keys(CENTROS).filter((o) => {
    if (o === loc) return false
    const co = centroDe(o)
    return distanciaKm(c[0], c[1], co[0], co[1]) <= RADIO_ALCANCE_KM
  })
}
// ¿El aviso `nuevo` alcanza a un usuario cuya ubicación es la localidad `loc`? Su
// misma localidad SIEMPRE. Si no, el punto real del aviso al centro de `loc` (y si
// el aviso no trajera punto, centro a centro). Espeja avisoEnZona del front.
function avisoAlcanza(nuevo: any, loc: string): boolean {
  const avisoLoc = nuevo.localidad || 'Paraná'
  if (avisoLoc === loc) return true
  const c = centroDe(loc)
  if (nuevo.lat != null && nuevo.lng != null) return distanciaKm(nuevo.lat, nuevo.lng, c[0], c[1]) <= RADIO_ALCANCE_KM
  const ca = centroDe(avisoLoc)
  return distanciaKm(ca[0], ca[1], c[0], c[1]) <= RADIO_ALCANCE_KM
}

// Lugar para el texto de una notificación: "Centro, Paraná" (barrio + ciudad, sin
// provincia). Sin la ciudad, "en Centro" no dice de qué localidad es. Si falta el
// barrio, solo la ciudad; si no viene nada, Paraná.
function lugarDe(r: any): string {
  return [r.zona, r.localidad].filter(Boolean).join(', ') || 'Paraná'
}

async function prefsDe(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))]
  const map = new Map<string, any>()
  if (!ids.length) return map
  const { data } = await sb.from('notif_prefs').select('*').in('user_id', ids)
  for (const p of data || []) map.set(p.user_id, p)
  return map
}

async function enviarAUsuarios(userIds: string[], payload: any, meta: any = {}) {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (!ids.length) return 0
  // La notificación tiene que llevar al AVISO, no al feed. Todas las llamadas ya
  // pasan meta.reporteId (es el mismo que se guarda en el inbox), así que la url sale
  // de ahí, en un solo lugar. Antes cada payload traía url:'/' y el toque caía
  // siempre en el feed — la notificación decía "Fido volvió a casa" y no te llevaba
  // a Fido. Sin reporteId (no pasa hoy), el service worker cae a '/'.
  if (meta.reporteId) payload = { ...payload, url: `/r/${meta.reporteId}` }
  // Guardar en el "inbox" de cada usuario, aunque no tenga push activado.
  try {
    const { error } = await sb.from('notificaciones').insert(
      ids.map((uid) => ({
        user_id: uid,
        titulo: payload.title,
        cuerpo: payload.body,
        reporte_id: meta.reporteId ?? null,
        tipo: meta.tipo ?? null,
      })),
    )
    if (error) console.error('inbox insert error:', error.message)
  } catch (e) {
    console.error('inbox insert error:', e)
  }
  const { data: subs } = await sb.from('push_subs').select('*').in('user_id', ids)
  if (!subs?.length) return 0
  let ok = 0
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      )
      ok++
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await sb.from('push_subs').delete().eq('endpoint', s.endpoint)
      }
    }
  }
  return ok
}

async function manejarReporte(nuevo: any) {
  const opuesto = nuevo.tipo === 'perdido' ? 'encontrado' : 'perdido'

  // 1) MATCH: dueños de avisos opuestos activos que coinciden. En el conurbano cruza
  // (un encontrado en San Benito puede ser el perdido en Colonia): buscamos también
  // en las vecinas.
  const avisoLoc = nuevo.localidad || 'Paraná'
  const { data: candidatos } = await sb
    .from('reportes')
    .select('*')
    .eq('estado', 'activo')
    .eq('oculto', false)
    .eq('bloqueado', false)
    .eq('tipo', opuesto)
    .eq('especie', nuevo.especie)
    .in('localidad', [avisoLoc, ...vecinasDe(avisoLoc)])
  let matches = (candidatos || []).filter(
    (c: any) => compat(nuevo, c, 'color') && compat(nuevo, c, 'tamano') && compat(nuevo, c, 'sexo', true),
  )
  if (Array.isArray(nuevo.embedding)) {
    matches = matches
      .map((c: any) => ({ c, s: similitud(nuevo.embedding, c.embedding) }))
      .sort((a: any, b: any) => b.s - a.s)
      .map((o: any) => o.c)
  }
  matches = matches.slice(0, 6)
  const prefsM = await prefsDe(matches.map((m: any) => m.user_id))
  const destM = matches
    .filter((m: any) => m.user_id && m.user_id !== nuevo.user_id)
    .filter((m: any) => (prefsM.get(m.user_id)?.avisar_match ?? true) !== false)
    .map((m: any) => m.user_id)
  if (destM.length) {
    await enviarAUsuarios(
      destM,
      {
        title: '🐾 ¿Será el tuyo?',
        body: `Apareció un ${ESP[nuevo.especie] || 'animal'} parecido en ${lugarDe(nuevo)}.`,
      },
      { reporteId: nuevo.id, tipo: 'match' },
    )
  }

  // 2) CERCA: usuarios con avisar_cerca (barrio o punto+radio) + zonas de "Mis ubicaciones".
  {
    const { data: cercaPrefs } = await sb.from('notif_prefs').select('*').eq('avisar_cerca', true)
    const destPrefs = (cercaPrefs || [])
      .filter((p: any) => p.user_id !== nuevo.user_id)
      .filter((p: any) => p.especie === 'todas' || p.especie === nuevo.especie)
      .filter((p: any) => {
        // Match por localidad (lista de ciudades) O por provincia entera elegida.
        const locs =
          Array.isArray(p.localidades) && p.localidades.length ? p.localidades : [p.localidad || 'Paraná']
        const provs = Array.isArray(p.provincias) ? p.provincias : []
        // El aviso cae en la zona del usuario si es su localidad o está a <= 20 km.
        const enLocalidad = locs.some((l: string) => avisoAlcanza(nuevo, l))
        const enProvincia = !!nuevo.provincia && provs.includes(nuevo.provincia)
        if (!enLocalidad && !enProvincia) return false
        // Provincia entera, varias ciudades, o el aviso viene de una VECINA: avisamos
        // de todos los barrios. (El barrio no cruza localidades, así que no se puede
        // filtrar por barrio un aviso de la localidad de al lado.)
        const desdeVecina = !locs.includes(avisoLoc)
        const variasZonas = enProvincia || locs.length > 1 || desdeVecina
        // Antes esto era `porBarrio || porRadio`, con un punto+radio propio. Se
        // fue: hacía lo mismo que "Mis ubicaciones" (ver abajo) y los dos caían
        // en el mismo destC. A los que tenían punto marcado el SQL de migración
        // les abre todos los barrios, así no pierden alcance sin enterarse.
        return (
          variasZonas ||
          (Array.isArray(p.barrios) &&
            (p.barrios.includes('*') ||
              // Comparación tolerante (ver normBarrio): "Antonini " matchea "Antonini".
              (!!nuevo.zona && p.barrios.some((b: string) => normBarrio(b) === normBarrio(nuevo.zona)))))
        )
      })
      .map((p: any) => p.user_id)

    // Lugares de "Mis ubicaciones" (avisar=true) en la misma ciudad que el aviso.
    // Antes era geométrico (lat/lng + radio). Ahora es por nombre de ciudad: el
    // barrio no sirve de llave (el 38% viene escrito a mano) y así también
    // avisamos de los avisos que no traen coords.
    const { data: ubis, error: errUbis } = await sb.from('ubicaciones').select('user_id, localidad').eq('avisar', true)
    // El error se loguea SÍ o SÍ. Sin esto, `ubis || []` lo tapa: la consulta
    // falla, no avisamos a nadie, la función devuelve 200 y nadie se entera nunca.
    // Es justo lo que pasaría corriendo la versión vieja contra el schema nuevo.
    if (errUbis) console.error('notificar: no se pudieron leer las ubicaciones →', errUbis.message)
    const destUbic = (ubis || [])
      .filter((u: any) => u.user_id !== nuevo.user_id)
      .filter((u: any) => u.localidad && avisoAlcanza(nuevo, u.localidad)) // su localidad o a <= 20 km
      .map((u: any) => u.user_id)

    const destC = [...new Set([...destPrefs, ...destUbic])]
    // Rastro para poder responder "¿anduvo?" sin adivinar. Cero destinatarios es
    // un resultado válido, pero hay que poder distinguirlo de que algo se rompió.
    console.log(
      `notificar cerca: aviso en ${nuevo.localidad || 'Paraná'} · ${destPrefs.length} por prefs + ${destUbic.length} por ubicaciones = ${destC.length} a notificar`
    )
    if (destC.length) {
      const tipoTxt = nuevo.tipo === 'perdido' ? 'perdido' : 'encontrado'
      await enviarAUsuarios(
        destC,
        {
          title: '📍 Nuevo aviso cerca tuyo',
          body: `Un ${ESP[nuevo.especie] || 'animal'} ${tipoTxt} en ${lugarDe(nuevo)}.`,
        },
        { reporteId: nuevo.id, tipo: 'cerca' },
      )
    }
  }

  // 3) CIUDAD NUEVA: si este es el primer aviso de esa localidad, avisamos al admin.
  {
    const loc = nuevo.localidad || 'Paraná'
    const { count } = await sb.from('reportes').select('*', { count: 'exact', head: true }).eq('localidad', loc)
    if (count === 1) {
      await pushAAdmin({ title: '🌱 ¡Nueva ciudad en Chicho!', body: `Primer aviso en ${loc}. ¡Prendió! 🎉`, url: '/' })
    }
  }
}

async function seguidoresDe(reporteId: string) {
  const { data } = await sb.from('seguidores').select('user_id').eq('reporte_id', reporteId)
  return (data || []).map((s: any) => s.user_id)
}

// Push al admin (para moderación). La notif in-app la inserta el RPC.
async function pushAAdmin(payload: any) {
  const { data: adminId } = await sb.rpc('admin_id')
  if (!adminId) return
  const { data: subs } = await sb.from('push_subs').select('*').eq('user_id', adminId)
  for (const s of subs || []) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload))
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await sb.from('push_subs').delete().eq('endpoint', s.endpoint)
    }
  }
}

async function manejarAvistamiento(rec: any) {
  const { data: rep } = await sb.from('reportes').select('*').eq('id', rec.reporte_id).maybeSingle()
  if (!rep) return
  const nombre = rep.nombre || (ESP[rep.especie] || 'tu mascota')

  // Dueño del aviso.
  if (rep.user_id) {
    const prefs = await prefsDe([rep.user_id])
    if ((prefs.get(rep.user_id)?.avisar_avistamiento ?? true) !== false) {
      await enviarAUsuarios(
        [rep.user_id],
        {
          title: '👀 ¡Vieron a tu mascota!',
          body: rec.nota ? `Nuevo avistamiento: ${rec.nota}` : `Alguien reportó ver a tu ${ESP[rep.especie] || 'mascota'}.`,
        },
        { reporteId: rec.reporte_id, tipo: 'avistamiento' },
      )
    }
  }

  // Seguidores del aviso (menos el dueño, que ya recibió).
  const segs = (await seguidoresDe(rec.reporte_id)).filter((u: string) => u !== rep.user_id)
  if (segs.length) {
    await enviarAUsuarios(
      segs,
      {
        title: `👀 Novedad de ${nombre}`,
        body: rec.nota ? `Nuevo avistamiento: ${rec.nota}` : 'Alguien lo vio.',
      },
      { reporteId: rec.reporte_id, tipo: 'avistamiento' },
    )
  }
}

// Cambios en un aviso → avisar a los seguidores.
async function manejarReporteUpdate(rec: any, old: any) {
  const nombre = rec.nombre || (ESP[rec.especie] || 'la mascota')

  // Bloqueado por reportes → push al admin.
  if (!old?.bloqueado && rec.bloqueado) {
    await pushAAdmin({
      title: '🚫 Aviso bloqueado por reportes',
      body: 'Un aviso juntó 3 denuncias y se ocultó. Revisalo en Moderación.',
      url: '/',
    })
    return
  }

  // A) Apareció: activo → resuelto.
  if (old?.estado === 'activo' && rec.estado === 'resuelto') {
    const segs = (await seguidoresDe(rec.id)).filter((u: string) => u !== rec.user_id)
    if (segs.length) {
      await enviarAUsuarios(segs, { title: '🎉 ¡Apareció!', body: `${nombre} volvió a casa. 🏠` }, { reporteId: rec.id, tipo: 'aparecio' })
    }
    // Aviso al admin: cada reencuentro (son pocos y son la mejor noticia).
    const lugar = [rec.zona, rec.localidad].filter(Boolean).join(', ')
    await pushAAdmin({ title: '🎉 ¡Reencuentro en Chicho!', body: `${nombre} volvió a casa${lugar ? ` (${lugar})` : ''}. 🏠`, url: '/' })
    return
  }

  // B) Novedades del dueño: cambió contenido relevante en un aviso activo.
  //    Ignora updates internos (contador de apoyos, huella visual) comparando
  //    solo los campos que le importan a un seguidor.
  if (!old || rec.estado !== 'activo') return
  const campos = [
    'nombre', 'zona', 'referencia', 'descripcion', 'recompensa',
    'color', 'tamano', 'raza', 'collar', 'sexo', 'edad',
    'whatsapp', 'en_custodia', 'lat', 'lng', 'fecha_evento',
  ]
  const cambioCampo = campos.some((c) => (old[c] ?? null) !== (rec[c] ?? null))
  const cambioFotos =
    (old.foto ?? null) !== (rec.foto ?? null) ||
    JSON.stringify(old.fotos ?? null) !== JSON.stringify(rec.fotos ?? null)
  if (!cambioCampo && !cambioFotos) return

  const segs = (await seguidoresDe(rec.id)).filter((u: string) => u !== rec.user_id)
  if (segs.length) {
    await enviarAUsuarios(
      segs,
      {
        title: `📝 Novedad de ${nombre}`,
        body: 'La familia actualizó el aviso. Tocá para ver.',
      },
      { reporteId: rec.id, tipo: 'novedad' },
    )
  }
}

Deno.serve(async (req) => {
  try {
    const body = await req.json()
    const rec = body.record
    if (rec) {
      if (body.table === 'reportes' && body.type === 'INSERT') await manejarReporte(rec)
      else if (body.table === 'reportes' && body.type === 'UPDATE') await manejarReporteUpdate(rec, body.old_record)
      else if (body.table === 'avistamientos' && body.type === 'INSERT') await manejarAvistamiento(rec)
    }
    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('notificar error:', e)
    // Devolvemos 200 para que el webhook no reintente en loop.
    return new Response('error', { status: 200 })
  }
})
