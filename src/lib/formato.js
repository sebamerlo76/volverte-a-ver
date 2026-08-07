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
  // Sin el corte de arriba, un null se colaba: new Date(null) NO es fecha inválida, es
  // el 1/1/1970, así que pasaba el isNaN y la tarjeta terminaba diciendo "31 dic" (1969).
  // Lo encontró el test de textoReencuentro; nunca se vio en la app porque quien llama
  // ya chequeaba el dato, pero era una bomba silenciosa para el próximo que lo usara.
  if (!iso) return ''
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

// "volvió hace 3 días" / "volvió ayer" / "volvió el 12 mar".
//
// En la pestaña "Ya en casa" un "hace 6 días" pelado se lee como si fuera cuándo se
// perdió, que es lo contrario de lo que esa pantalla cuenta. Con el verbo adelante el
// dato se explica solo. El "el" va únicamente cuando tiempoRelativo devuelve una fecha
// (pasado un mes deja de decir "hace ..."): "volvió 12 mar" no se entiende.
export function textoReencuentro(iso) {
  const t = tiempoRelativo(iso)
  if (!t) return ''
  return /^(hace|ayer|recién)/.test(t) ? `volvió ${t}` : `volvió el ${t}`
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

// Número argentino listo para wa.me / tel:, a partir de lo que sea que escribió la
// persona. Antes pegábamos '54' + los dígitos tal cual, y el link se rompía en los
// casos MÁS comunes: si copiaba su número de WhatsApp con el +54 quedaba 5454…, y el
// 0 del área (0343) y el 15 (343 15 405…) también lo rompían. Un aviso con el
// contacto roto es un aviso inútil: nadie puede avisarle a la familia.
//
// Formato que quiere WhatsApp para móviles argentinos: 54 + 9 + área (sin 0) +
// abonado (sin 15). Devuelve '' si no hay nada usable.
export function numeroWa(whatsapp) {
  let n = (whatsapp || '').replace(/\D/g, '')
  if (!n) return ''
  n = n.replace(/^00/, '') // prefijo internacional escrito a mano
  // País: ningún código de área argentino empieza con 54, así que si está adelante es el país.
  if (n.startsWith('54')) n = n.slice(2)
  if (n.startsWith('9')) n = n.slice(1) // el 9 de móvil: lo ponemos nosotros al final
  if (n.startsWith('0')) n = n.slice(1) // 0343 → 343
  // El 15 va entre el área (2 a 4 dígitos) y el abonado. Un nacional válido tiene 10
  // dígitos; si hay 12, sobra un 15 en medio.
  if (n.length === 12) {
    for (const largoArea of [2, 3, 4]) {
      if (n.slice(largoArea, largoArea + 2) === '15') {
        n = n.slice(0, largoArea) + n.slice(largoArea + 2)
        break
      }
    }
  }
  return n ? '549' + n : ''
}

// Arma el link de WhatsApp con un mensaje ya escrito.
export function linkWhatsApp(r) {
  const nombre = nombreMostrado(r)
  const lugar = [r.zona, r.localidad].filter(Boolean).join(', ')
  const texto = `Hola! Vi el reporte de ${nombre} en Chicho${lugar ? ` (${lugar})` : ''}. ¿Tenés novedades?`
  const numero = numeroWa(r.whatsapp)
  const base = numero ? `https://wa.me/${numero}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(texto)}`
}

// Link de WhatsApp para el admin: pedir permiso de publicar el reencuentro en el IG
// (+ invitar a contar la experiencia). Mismo manejo del número que linkWhatsApp.
// Dos mensajes, según si la familia ya subió la foto del reencuentro. Antes era uno solo
// que pedía permiso para Instagram y de paso preguntaba "cómo fue tu experiencia": pedir
// dos cosas a la vez suele conseguir ninguna, y el testimonio vale mucho menos que la
// foto. La foto es la prueba social que sostiene el muro de "Ya en casa" — es lo que ve
// el que todavía está buscando.
//
// Al que NO la subió se le pide la foto (el festejo ya se la ofreció al marcar el
// reencuentro: esta es la segunda oportunidad, y sin culpa). Al que SÍ, no tiene sentido
// pedírsela de nuevo: se le agradece y se le pide sólo el permiso para Instagram.
export function linkWhatsAppReencuentro(r) {
  const nombre = nombreMostrado(r)
  const texto = r?.fotoReencuentro
    ? `¡Hola! Te escribo de Chicho 🐾 Vi que ${nombre} volvió a casa, ¡qué alegría! Y gracias por subir la foto 💛 ¿Nos das permiso para compartirla en el Instagram de Chicho (@chicho.ar)?`
    : `¡Hola! Te escribo de Chicho 🐾 Vi que ${nombre} volvió a casa, ¡qué alegría! ¿Nos mandás una foto de ${nombre} ya en casa? La sumamos al muro de reencuentros de la app: es lo que le da esperanza a la gente que todavía está buscando a la suya 💛`
  const numero = numeroWa(r.whatsapp)
  const base = numero ? `https://wa.me/${numero}` : 'https://wa.me/'
  return `${base}?text=${encodeURIComponent(texto)}`
}

// Link para llamar por teléfono (usa el mismo número que el WhatsApp).
export function linkTel(whatsapp) {
  const numero = numeroWa(whatsapp)
  return numero ? `tel:+${numero}` : null
}

// Link para que la familia le escriba a quien dejó un avistamiento.
export function linkWhatsAppAvist(whatsapp, reporte) {
  const numero = numeroWa(whatsapp)
  if (!numero) return null
  const nombre = reporte ? nombreMostrado(reporte) : 'mi mascota'
  const texto = `Hola! Soy la familia de ${nombre} (Chicho). Vi que dejaste un avistamiento, ¿me podés contar más? 🙏`
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

// Cómo llegar: abren la navegación hasta un punto. Links universales (abren la
// app si está instalada, si no la web). Andan en Android e iOS.
export function linkGoogleMaps(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}
export function linkWaze(lat, lng) {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
}
