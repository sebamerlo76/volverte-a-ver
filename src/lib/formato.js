// Utilidades de presentación.

// Nombre a mostrar cuando la mascota no tiene nombre cargado.
export function nombreMostrado(r) {
  if (r.nombre) return r.nombre
  const hembra = r.sexo === 'Hembra'
  if (r.especie === 'gato') return hembra ? 'Gatita sin nombre' : 'Gato sin nombre'
  if (r.especie === 'otro') return 'Mascota sin nombre'
  return hembra ? 'Perrita sin nombre' : 'Perro sin nombre'
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

// ¿La fecha está dentro del rango? ('todos' | 'semana' | 'mes')
export function dentroDeRango(iso, rango) {
  if (!rango || rango === 'todos') return true
  const d = new Date(iso)
  if (isNaN(d)) return true
  if (rango === 'hoy') {
    const h = new Date()
    return d.getFullYear() === h.getFullYear() && d.getMonth() === h.getMonth() && d.getDate() === h.getDate()
  }
  const dias = (Date.now() - d.getTime()) / 86400000
  if (rango === 'semana') return dias <= 7
  if (rango === 'mes') return dias <= 31
  return true
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
  const lugar = [r.zona, r.localidad].filter(Boolean).join(', ')
  const texto = `Hola! Vi el reporte de ${nombre} en Chicho${lugar ? ` (${lugar})` : ''}. ¿Tenés novedades?`
  const numero = (r.whatsapp || '').replace(/\D/g, '')
  const base = numero ? `https://wa.me/54${numero}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(texto)}`
}

// Link para llamar por teléfono (usa el mismo número que el WhatsApp).
export function linkTel(whatsapp) {
  const numero = (whatsapp || '').replace(/\D/g, '')
  return numero ? `tel:+54${numero}` : null
}

// Link para que la familia le escriba a quien dejó un avistamiento.
export function linkWhatsAppAvist(whatsapp, reporte) {
  const numero = (whatsapp || '').replace(/\D/g, '')
  if (!numero) return null
  const nombre = reporte ? nombreMostrado(reporte) : 'mi mascota'
  const texto = `Hola! Soy la familia de ${nombre} (Chicho). Vi que dejaste un avistamiento, ¿me podés contar más? 🙏`
  return `https://wa.me/54${numero}?text=${encodeURIComponent(texto)}`
}

// Cómo llegar: abren la navegación hasta un punto. Links universales (abren la
// app si está instalada, si no la web). Andan en Android e iOS.
export function linkGoogleMaps(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}
export function linkWaze(lat, lng) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
}
