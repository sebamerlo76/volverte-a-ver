// Notificaciones push web (cliente): registra el SW, pide permiso y suscribe.
import { guardarSuscripcion, borrarSuscripcion } from '../data/store.js'

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY

// ¿El navegador soporta push? (Chrome/Android sí; iOS solo como PWA instalada.)
export function soportado() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// 'default' | 'granted' | 'denied' | 'no-soportado'
export function estadoPermiso() {
  if (!('Notification' in window)) return 'no-soportado'
  return Notification.permission
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

async function swListo() {
  const reg = await navigator.serviceWorker.getRegistration()
  return reg || navigator.serviceWorker.register('/sw.js')
}

// ¿Este dispositivo ya está suscripto?
export async function yaSuscripto() {
  if (!soportado()) return false
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return false
  return !!(await reg.pushManager.getSubscription())
}

// Pide permiso, suscribe y guarda en Supabase. Devuelve true si quedó activo.
export async function activarPush() {
  if (!soportado()) throw new Error('Este navegador no soporta notificaciones.')
  if (!VAPID_PUBLIC) throw new Error('Falta configurar VITE_VAPID_PUBLIC_KEY.')
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') return false
  const reg = await swListo()
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })
  }
  const json = sub.toJSON()
  await guardarSuscripcion({
    endpoint: sub.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: navigator.userAgent,
  })
  return true
}

// Desuscribe el dispositivo y lo borra de Supabase.
export async function desactivarPush() {
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  const endpoint = sub.endpoint
  await sub.unsubscribe()
  try {
    await borrarSuscripcion(endpoint)
  } catch (e) {
    /* si falla el borrado remoto, no bloqueamos */
  }
}
