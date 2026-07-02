// Utilidades de presentación.

// Nombre a mostrar cuando la mascota no tiene nombre cargado.
export function nombreMostrado(r) {
  if (r.nombre) return r.nombre
  return r.especie === 'gato' ? 'Gato sin identificar' : 'Perro sin identificar'
}

// "hace 2 h", "ayer", "hace 5 días"... a partir de la fecha de creación.
export function tiempoRelativo(iso) {
  const ahora = new Date()
  const antes = new Date(iso)
  const min = Math.round((ahora - antes) / 60000)
  if (isNaN(min)) return ''
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const hs = Math.round(min / 60)
  if (hs < 24) return `hace ${hs} h`
  const dias = Math.round(hs / 24)
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  const sem = Math.round(dias / 7)
  if (sem === 1) return 'hace 1 semana'
  if (sem < 5) return `hace ${sem} semanas`
  return antes.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

// Fecha legible: "28 jun 2026".
export function fechaLegible(iso) {
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Fecha y hora corta: "28 jun · 21:30".
export function fechaHora(iso) {
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const f = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  const h = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  return `${f} · ${h}`
}

// Foto de perfil del usuario (Google la trae en user_metadata).
export function avatarDe(user) {
  return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ''
}

// Nombre del usuario si lo tenemos (Google), si no vacío.
export function nombreUsuario(user) {
  return user?.user_metadata?.full_name || user?.user_metadata?.name || ''
}

// Arma el link de WhatsApp con un mensaje ya escrito.
export function linkWhatsApp(r) {
  const nombre = nombreMostrado(r)
  const texto = `Hola! Vi el reporte de ${nombre} en Volverte a ver (${r.zona}, Paraná). ¿Tenés novedades?`
  const numero = (r.whatsapp || '').replace(/\D/g, '')
  const base = numero ? `https://wa.me/54${numero}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(texto)}`
}
