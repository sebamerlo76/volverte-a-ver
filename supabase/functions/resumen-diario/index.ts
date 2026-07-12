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

async function contar(query: any): Promise<number> {
  const { count } = await query
  return count || 0
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

Deno.serve(async () => {
  try {
    const r = await armarResumen()
    await avisarAdmin('📊 Resumen de Chicho', textoResumen(r))
    return new Response(JSON.stringify({ ok: true, ...r }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('resumen-diario error:', e)
    return new Response('error', { status: 200 })
  }
})
