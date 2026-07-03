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

async function enviarAUsuarios(userIds: string[], payload: any) {
  const ids = [...new Set(userIds.filter(Boolean))]
  if (!ids.length) return 0
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
    .eq('tipo', opuesto)
    .eq('especie', nuevo.especie)
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
    await enviarAUsuarios(destM, {
      title: '🐾 ¿Será el tuyo?',
      body: `Apareció un ${ESP[nuevo.especie] || 'animal'} parecido en ${nuevo.zona || 'Paraná'}.`,
      url: '/',
    })
  }

  // 2) CERCA: usuarios con avisar_cerca — por barrio elegido O por punto+radio.
  {
    const { data: cercaPrefs } = await sb.from('notif_prefs').select('*').eq('avisar_cerca', true)
    const destC = (cercaPrefs || [])
      .filter((p: any) => p.user_id !== nuevo.user_id)
      .filter((p: any) => p.especie === 'todas' || p.especie === nuevo.especie)
      .filter((p: any) => {
        const porBarrio = Array.isArray(p.barrios) && nuevo.zona && p.barrios.includes(nuevo.zona)
        const porRadio =
          p.centro_lat != null &&
          nuevo.lat != null &&
          nuevo.lng != null &&
          distanciaKm(p.centro_lat, p.centro_lng, nuevo.lat, nuevo.lng) <= (p.radio_km || 5)
        return porBarrio || porRadio
      })
      .map((p: any) => p.user_id)
    if (destC.length) {
      const tipoTxt = nuevo.tipo === 'perdido' ? 'perdido' : 'encontrado'
      await enviarAUsuarios(destC, {
        title: '📍 Nuevo aviso cerca tuyo',
        body: `Un ${ESP[nuevo.especie] || 'animal'} ${tipoTxt} en ${nuevo.zona || 'Paraná'}.`,
        url: '/',
      })
    }
  }
}

async function manejarAvistamiento(rec: any) {
  const { data: rep } = await sb.from('reportes').select('*').eq('id', rec.reporte_id).maybeSingle()
  if (!rep?.user_id) return
  const prefs = await prefsDe([rep.user_id])
  if ((prefs.get(rep.user_id)?.avisar_avistamiento ?? true) === false) return
  await enviarAUsuarios([rep.user_id], {
    title: '👀 ¡Vieron a tu mascota!',
    body: rec.nota ? `Nuevo avistamiento: ${rec.nota}` : `Alguien reportó ver a tu ${ESP[rep.especie] || 'mascota'}.`,
    url: '/',
  })
}

Deno.serve(async (req) => {
  try {
    const body = await req.json()
    const rec = body.record
    if (rec && body.type === 'INSERT') {
      if (body.table === 'reportes') await manejarReporte(rec)
      else if (body.table === 'avistamientos') await manejarAvistamiento(rec)
    }
    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('notificar error:', e)
    // Devolvemos 200 para que el webhook no reintente en loop.
    return new Response('error', { status: 200 })
  }
})
