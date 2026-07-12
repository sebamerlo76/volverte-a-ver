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
function distanciaKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
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

  // 1) MATCH: dueños de avisos opuestos activos que coinciden.
  const { data: candidatos } = await sb
    .from('reportes')
    .select('*')
    .eq('estado', 'activo')
    .eq('oculto', false)
    .eq('bloqueado', false)
    .eq('tipo', opuesto)
    .eq('especie', nuevo.especie)
    .eq('localidad', nuevo.localidad || 'Paraná')
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
        body: `Apareció un ${ESP[nuevo.especie] || 'animal'} parecido en ${nuevo.zona || 'Paraná'}.`,
        url: '/',
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
        // Una o varias localidades (compat: si no hay array, usa la vieja columna localidad).
        const locs =
          Array.isArray(p.localidades) && p.localidades.length ? p.localidades : [p.localidad || 'Paraná']
        if (!locs.includes(nuevo.localidad || 'Paraná')) return false
        // Con varias ciudades elegidas, avisamos de todos los barrios de esas ciudades.
        const variasCiudades = locs.length > 1
        const porBarrio =
          variasCiudades ||
          (Array.isArray(p.barrios) && (p.barrios.includes('*') || (nuevo.zona && p.barrios.includes(nuevo.zona))))
        const porRadio =
          p.centro_lat != null &&
          nuevo.lat != null &&
          nuevo.lng != null &&
          distanciaKm(p.centro_lat, p.centro_lng, nuevo.lat, nuevo.lng) <= (p.radio_km || 5)
        return porBarrio || porRadio
      })
      .map((p: any) => p.user_id)

    // Zonas guardadas en "Mis ubicaciones" (avisar=true) dentro del radio del nuevo aviso.
    let destUbic: string[] = []
    if (nuevo.lat != null && nuevo.lng != null) {
      const { data: ubis } = await sb.from('ubicaciones').select('user_id, lat, lng, radio_km').eq('avisar', true)
      destUbic = (ubis || [])
        .filter((u: any) => u.user_id !== nuevo.user_id)
        .filter((u: any) => distanciaKm(u.lat, u.lng, nuevo.lat, nuevo.lng) <= (u.radio_km || 3))
        .map((u: any) => u.user_id)
    }

    const destC = [...new Set([...destPrefs, ...destUbic])]
    if (destC.length) {
      const tipoTxt = nuevo.tipo === 'perdido' ? 'perdido' : 'encontrado'
      await enviarAUsuarios(
        destC,
        {
          title: '📍 Nuevo aviso cerca tuyo',
          body: `Un ${ESP[nuevo.especie] || 'animal'} ${tipoTxt} en ${nuevo.zona || 'Paraná'}.`,
          url: '/',
        },
        { reporteId: nuevo.id, tipo: 'cerca' },
      )
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
          url: '/',
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
        url: '/',
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
      await enviarAUsuarios(segs, { title: '🎉 ¡Apareció!', body: `${nombre} volvió a casa. 🏠`, url: '/' }, { reporteId: rec.id, tipo: 'aparecio' })
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
        url: '/',
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
