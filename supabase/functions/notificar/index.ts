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
        // Match por localidad (lista de ciudades) O por provincia entera elegida.
        const locs =
          Array.isArray(p.localidades) && p.localidades.length ? p.localidades : [p.localidad || 'Paraná']
        const provs = Array.isArray(p.provincias) ? p.provincias : []
        const enLocalidad = locs.includes(nuevo.localidad || 'Paraná')
        const enProvincia = !!nuevo.provincia && provs.includes(nuevo.provincia)
        if (!enLocalidad && !enProvincia) return false
        // Provincia entera o varias ciudades: avisamos de todos los barrios.
        const variasZonas = enProvincia || locs.length > 1
        // Antes esto era `porBarrio || porRadio`, con un punto+radio propio. Se
        // fue: hacía lo mismo que "Mis ubicaciones" (ver abajo) y los dos caían
        // en el mismo destC. A los que tenían punto marcado el SQL de migración
        // les abre todos los barrios, así no pierden alcance sin enterarse.
        return (
          variasZonas ||
          (Array.isArray(p.barrios) && (p.barrios.includes('*') || (nuevo.zona && p.barrios.includes(nuevo.zona))))
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
      .filter((u: any) => u.localidad && u.localidad === (nuevo.localidad || 'Paraná'))
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
          body: `Un ${ESP[nuevo.especie] || 'animal'} ${tipoTxt} en ${nuevo.zona || 'Paraná'}.`,
          url: '/',
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
