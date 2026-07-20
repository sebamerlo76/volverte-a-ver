// Edge Function "resumen-diario": manda al admin un resumen de las últimas 24 h
// (avisos nuevos, reencuentros, usuarios nuevos, perdidos que necesitan empujón).
// Se dispara por un cron (pg_cron) una vez por día — ver README de deploy.
//
// Secrets (los mismos que "notificar"): VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT.
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

async function contar(query: any): Promise<number> {
  const { count } = await query
  return count || 0
}

// Push + inbox a un usuario puntual (para los recordatorios a dueños).
async function pushAUsuario(uid: string, payload: any, meta: any = {}) {
  try {
    await sb.from('notificaciones').insert({
      user_id: uid,
      titulo: payload.title,
      cuerpo: payload.body,
      reporte_id: meta.reporteId ?? null,
      tipo: meta.tipo ?? null,
    })
  } catch (e) {
    console.error('inbox recordatorio:', e)
  }
  const { data: subs } = await sb.from('push_subs').select('*').eq('user_id', uid)
  for (const s of subs || []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      )
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await sb.from('push_subs').delete().eq('endpoint', s.endpoint)
    }
  }
}

// Recordatorio a los dueños de perdidos activos: que renueven o cierren. El primero
// a los 3 días de publicado, y después se repite cada 7 días (así no hay un hueco
// largo de silencio). Si renuevan, creado_en se actualiza y arranca de nuevo.
async function enviarRecordatorios(): Promise<number> {
  const corte3 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const hace7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  let viejos: any[] = []
  try {
    const { data } = await sb
      .from('reportes')
      .select('id, nombre, especie, user_id, creado_en, recordatorio_en')
      .eq('estado', 'activo')
      .eq('tipo', 'perdido')
      .eq('oculto', false)
      .eq('bloqueado', false)
      .lt('creado_en', corte3) // publicado hace +3 días
      .not('user_id', 'is', null)
    viejos = data || []
  } catch (_e) {
    return -1 // la columna recordatorio_en todavía no existe
  }
  let n = 0
  for (const r of viejos) {
    // Recurrente: si ya le avisamos en los últimos 7 días, saltar. Así el primero
    // sale a los 3 días y después uno cada 7, sin spamear.
    if (r.recordatorio_en && r.recordatorio_en >= hace7) continue
    const nombre = r.nombre || (ESP[r.especie] || 'tu mascota')
    await pushAUsuario(
      r.user_id,
      {
        title: '🔔 ¿Cómo va la búsqueda?',
        body: `¿Novedades de ${nombre}? Si ya volvió, marcalo 🏠. Si no, renovalo para que vuelva arriba. 🐾`,
        url: `/r/${r.id}`, // al aviso, no al feed (igual que el recordatorio de "compartí")
      },
      { reporteId: r.id, tipo: 'recordatorio' },
    )
    await sb.from('reportes').update({ recordatorio_en: new Date().toISOString() }).eq('id', r.id)
    n++
  }
  return n
}

async function armarResumen() {
  const ahora = Date.now()
  const desde = new Date(ahora - 24 * 60 * 60 * 1000).toISOString()
  const corte7 = new Date(ahora - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Avisos nuevos en 24 h (por tipo).
  const { data: nuevos } = await sb
    .from('reportes')
    .select('tipo')
    .gte('creado_en', desde)
    .eq('oculto', false)
  const totalNuevos = nuevos?.length || 0
  const perdidos = (nuevos || []).filter((r: any) => r.tipo === 'perdido').length
  const encontrados = totalNuevos - perdidos

  // Reencuentros en 24 h (columna resuelto_en, la setea el trigger).
  let reencuentros = 0
  try {
    reencuentros = await contar(
      sb.from('reportes').select('*', { count: 'exact', head: true }).gte('resuelto_en', desde),
    )
  } catch (_e) {
    reencuentros = -1 // la columna todavía no existe: lo marcamos como desconocido
  }

  // Usuarios nuevos en 24 h.
  let usuariosNuevos = -1
  try {
    usuariosNuevos = await contar(
      sb.schema('auth').from('users').select('*', { count: 'exact', head: true }).gte('created_at', desde),
    )
  } catch (_e) {
    usuariosNuevos = -1
  }

  // Perdidos activos hace +7 días (los que necesitan empujón).
  const empujar = await contar(
    sb
      .from('reportes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo')
      .eq('tipo', 'perdido')
      .eq('oculto', false)
      .eq('bloqueado', false)
      .lt('creado_en', corte7),
  )

  return { totalNuevos, perdidos, encontrados, reencuentros, usuariosNuevos, empujar }
}

function textoResumen(r: any) {
  const partes: string[] = []
  partes.push(`${r.totalNuevos} aviso${r.totalNuevos === 1 ? '' : 's'} (${r.perdidos} perdidos, ${r.encontrados} encontrados)`)
  if (r.reencuentros > 0) partes.push(`${r.reencuentros} reencuentro${r.reencuentros === 1 ? '' : 's'} 🎉`)
  if (r.usuariosNuevos >= 0) partes.push(`${r.usuariosNuevos} usuario${r.usuariosNuevos === 1 ? '' : 's'} nuevo${r.usuariosNuevos === 1 ? '' : 's'}`)
  let cuerpo = 'Últimas 24 h: ' + partes.join(', ') + '.'
  if (r.empujar > 0) cuerpo += ` Ojo: ${r.empujar} perdido${r.empujar === 1 ? '' : 's'} +7 días sin novedad.`
  return cuerpo
}

async function avisarAdmin(titulo: string, cuerpo: string) {
  const { data: adminId } = await sb.rpc('admin_id')
  if (!adminId) return
  // Inbox (campanita) — persiste aunque no tenga push.
  try {
    await sb.from('notificaciones').insert({ user_id: adminId, titulo, cuerpo, tipo: 'resumen' })
  } catch (e) {
    console.error('inbox resumen:', e)
  }
  // Push.
  const { data: subs } = await sb.from('push_subs').select('*').eq('user_id', adminId)
  for (const s of subs || []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title: titulo, body: cuerpo, url: '/' }),
      )
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await sb.from('push_subs').delete().eq('endpoint', s.endpoint)
    }
  }
}

// Empujón temprano: al día siguiente de publicar un perdido, invitamos al dueño
// a compartir el aviso (difundir es lo que más rápido lo encuentra). Una sola
// vez por ciclo (compartir_en). Ventana 24-72 h para tolerar que el cron falte
// algún día (y no molestar a avisos viejos, que no reciben este push).
async function enviarRecordatorioCompartir(): Promise<number> {
  const ahora = Date.now()
  const min24 = new Date(ahora - 24 * 60 * 60 * 1000).toISOString()
  const max72 = new Date(ahora - 72 * 60 * 60 * 1000).toISOString()
  let recientes: any[] = []
  try {
    const { data } = await sb
      .from('reportes')
      .select('id, nombre, especie, user_id, creado_en, compartir_en')
      .eq('estado', 'activo')
      .eq('tipo', 'perdido')
      .eq('oculto', false)
      .eq('bloqueado', false)
      .lt('creado_en', min24) // publicado hace +24 h
      .gt('creado_en', max72) // ...pero no más de 72 h (recién publicado)
      .not('user_id', 'is', null)
    recientes = data || []
  } catch (_e) {
    return -1 // la columna compartir_en todavía no existe
  }
  let n = 0
  for (const r of recientes) {
    if (r.compartir_en && r.compartir_en >= r.creado_en) continue
    const nombre = r.nombre || (ESP[r.especie] || 'tu mascota')
    await pushAUsuario(
      r.user_id,
      {
        title: '📣 Ayudá a que vuelva a casa',
        body: `Compartí el aviso de ${nombre} con tus vecinos y en tus redes. Cuanta más gente lo vea, más rápido aparece. 🐾`,
        url: `/r/${r.id}`,
      },
      { reporteId: r.id, tipo: 'compartir' },
    )
    await sb.from('reportes').update({ compartir_en: new Date().toISOString() }).eq('id', r.id)
    n++
  }
  return n
}

// Pre-aviso de pausa: a un perdido activo hace +27 días le avisamos que, si no hay
// novedad, en unos días vamos a pausar el aviso. Una vez por ciclo (preaviso_en).
// La regla de oro del auto-archivar: nunca pausar de sorpresa.
async function preavisarPausa(): Promise<number> {
  const corte27 = new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString()
  let viejos: any[] = []
  try {
    const { data } = await sb
      .from('reportes')
      .select('id, nombre, especie, user_id, creado_en, preaviso_en')
      .eq('estado', 'activo')
      .eq('tipo', 'perdido')
      .eq('oculto', false)
      .eq('bloqueado', false)
      .lt('creado_en', corte27)
      .not('user_id', 'is', null)
    viejos = data || []
  } catch (_e) {
    return -1 // la columna preaviso_en todavía no existe (falta correr schema-pausar.sql)
  }
  let n = 0
  for (const r of viejos) {
    if (r.preaviso_en && r.preaviso_en >= r.creado_en) continue // ya avisado este ciclo
    const nombre = r.nombre || (ESP[r.especie] || 'tu mascota')
    await pushAUsuario(
      r.user_id,
      {
        title: `⏸️ ¿Seguimos buscando a ${nombre}?`,
        body: `Si no hay novedad, en unos días pausamos el aviso. Renovalo para que siga, o marcalo 🏠 si ya volvió. 🐾`,
        url: `/r/${r.id}`,
      },
      { reporteId: r.id, tipo: 'preaviso' },
    )
    await sb.from('reportes').update({ preaviso_en: new Date().toISOString() }).eq('id', r.id)
    n++
  }
  return n
}

// Pausar: perdido activo hace +30 días que YA recibió el pre-aviso (hace ≥2 días) y
// no renovó ni cerró. Pasa a 'pausado': sale del feed, queda en Mi cuenta con
// Reactivar. No se borra ni se marca "Ya en casa". Reversible siempre.
async function pausarInactivos(): Promise<number> {
  const corte30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const hace2d = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  let viejos: any[] = []
  try {
    const { data } = await sb
      .from('reportes')
      .select('id, nombre, especie, user_id, creado_en, preaviso_en')
      .eq('estado', 'activo')
      .eq('tipo', 'perdido')
      .eq('oculto', false)
      .eq('bloqueado', false)
      .lt('creado_en', corte30)
      .not('preaviso_en', 'is', null)
      .not('user_id', 'is', null)
    viejos = data || []
  } catch (_e) {
    return -1
  }
  let n = 0
  for (const r of viejos) {
    // Doble seguridad: pre-aviso de este ciclo Y que tenga al menos 2 días, para que
    // el dueño haya tenido tiempo de reaccionar aunque el cron se haya salteado un día.
    if (!r.preaviso_en || r.preaviso_en < r.creado_en) continue
    if (r.preaviso_en >= hace2d) continue
    const nombre = r.nombre || (ESP[r.especie] || 'tu mascota')
    await sb.from('reportes').update({ estado: 'pausado', pausado_en: new Date().toISOString() }).eq('id', r.id)
    await pushAUsuario(
      r.user_id,
      {
        title: `⏸️ Pausamos el aviso de ${nombre}`,
        body: `Estaba sin novedad hace tiempo. Está guardado: reactivalo cuando quieras desde Mi cuenta. 🐾`,
        url: `/r/${r.id}`,
      },
      { reporteId: r.id, tipo: 'pausado' },
    )
    n++
  }
  return n
}

Deno.serve(async () => {
  try {
    const r = await armarResumen()
    await avisarAdmin('📊 Resumen de Chicho', textoResumen(r))
    const recordatorios = await enviarRecordatorios()
    const compartir = await enviarRecordatorioCompartir()
    // El pre-aviso ANTES de pausar: si a alguien le toca el pre-aviso hoy, la guarda
    // de "≥2 días" evita que se pause en la misma corrida.
    const preaviso = await preavisarPausa()
    const pausados = await pausarInactivos()
    return new Response(
      JSON.stringify({ ok: true, ...r, recordatorios, compartir, preaviso, pausados }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    console.error('resumen-diario error:', e)
    return new Response('error', { status: 200 })
  }
})
