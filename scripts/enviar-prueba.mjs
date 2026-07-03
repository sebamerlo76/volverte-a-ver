// Envío de PRUEBA de notificación push (Fase 1: probar que el caño llega al celu).
// Manda una notificación a TODAS las suscripciones guardadas en push_subs.
//
// Uso:
//   En el entorno seteá:
//     SUPABASE_URL           = https://<tu-proyecto>.supabase.co
//     SUPABASE_SERVICE_ROLE  = <service_role key>
//     VAPID_PUBLIC           = <clave pública VAPID>
//     VAPID_PRIVATE          = <clave privada VAPID>
//   Luego: node scripts/enviar-prueba.mjs
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE, VAPID_PUBLIC, VAPID_PRIVATE } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error('Faltan: SUPABASE_URL, SUPABASE_SERVICE_ROLE, VAPID_PUBLIC, VAPID_PRIVATE')
  process.exit(1)
}

webpush.setVapidDetails('mailto:sebamerlo76@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE)
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

const { data: subs, error } = await sb.from('push_subs').select('*')
if (error) throw error
console.log(`${subs.length} suscripción(es) guardada(s).`)

const payload = JSON.stringify({
  title: '🐾 Volverte a ver',
  body: '¡Las notificaciones funcionan! Esto es una prueba.',
  url: '/',
})

let ok = 0
for (const s of subs) {
  try {
    await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
    ok++
    console.log('✓ enviada a', s.endpoint.slice(0, 40) + '…')
  } catch (e) {
    console.warn('✗', e.statusCode || '', e.body || e.message)
    // Suscripción vencida/inexistente → la limpiamos.
    if (e.statusCode === 404 || e.statusCode === 410) {
      await sb.from('push_subs').delete().eq('endpoint', s.endpoint)
    }
  }
}
console.log(`Listo. ${ok}/${subs.length} enviadas.`)
