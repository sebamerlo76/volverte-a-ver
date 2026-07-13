// ---------------------------------------------------------------------------
// Capa de datos de "Volverte a ver".
//
// Funciona en DOS modos, automáticamente:
//   - Con claves de Supabase (.env) -> nube (compartido) + fotos en Storage.
//   - Sin claves                    -> localStorage (solo este navegador).
//
// Toda la app usa estas funciones y no sabe en qué modo está. Todas son async.
// ---------------------------------------------------------------------------
import { supabase, supabaseConfigurado } from '../lib/supabase.js'
import { provinciaDe } from '../lib/localidades.js'
import { SEED_REPORTES } from './seed.js'

const CLAVE = 'vav_reportes_v1'

// --- Mapeo entre el objeto de la app (camelCase) y la fila de la base ---
function desdeFila(row) {
  return {
    id: row.id,
    tipo: row.tipo,
    especie: row.especie,
    nombre: row.nombre,
    zona: row.zona,
    referencia: row.referencia,
    color: row.color,
    tamano: row.tamano,
    raza: row.raza,
    descripcion: row.descripcion,
    // foto = recorte del feed (columna foto); fotos = las completas (columna fotos)
    foto: row.foto || (row.fotos && row.fotos.length ? row.fotos[0] : '') || '',
    fotos: row.fotos && row.fotos.length ? row.fotos : row.foto ? [row.foto] : [],
    whatsapp: row.whatsapp,
    autor: row.autor,
    fechaEvento: row.fecha_evento,
    creadoEn: row.creado_en,
    estado: row.estado,
    userId: row.user_id, // dueño del aviso (para editar/borrar)
    mascotaId: row.mascota_id, // mascota del perfil vinculada (o null)
    sexo: row.sexo,
    edad: row.edad,
    collar: row.collar,
    recompensa: row.recompensa,
    lat: row.lat,
    lng: row.lng,
    enCustodia: row.en_custodia,
    embedding: row.embedding, // huella visual (para sugerir parecidos)
    localidad: row.localidad || 'Paraná',
    apoyos: row.apoyos || 0, // prueba social: cuánta gente se sumó a difundir
  }
}
function haciaFila(r) {
  // No incluye user_id: en altas lo pone la base (default auth.uid());
  // en ediciones no se toca el dueño.
  return {
    tipo: r.tipo,
    especie: r.especie,
    nombre: r.nombre,
    zona: r.zona,
    referencia: r.referencia,
    color: r.color,
    tamano: r.tamano,
    raza: r.raza,
    descripcion: r.descripcion,
    // foto = recorte del feed (lo setea el que publica); fotos = las completas
    foto: r.foto ?? (r.fotos && r.fotos.length ? r.fotos[0] : null),
    fotos: r.fotos && r.fotos.length ? r.fotos : r.foto ? [r.foto] : null,
    whatsapp: r.whatsapp,
    fecha_evento: r.fechaEvento,
    mascota_id: r.mascotaId ?? null,
    sexo: r.sexo ?? null,
    edad: r.edad ?? null,
    collar: r.collar ?? null,
    recompensa: r.recompensa ?? null,
    lat: r.lat ?? null,
    lng: r.lng ?? null,
    en_custodia: r.enCustodia ?? false,
    embedding: r.embedding ?? null,
    localidad: r.localidad ?? 'Paraná',
    provincia: provinciaDe(r.localidad ?? 'Paraná'), // para el matching por provincia
  }
}

// --- Fallback local (localStorage) ---
function leerLocal() {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('No se pudo leer el almacenamiento local:', e)
  }
  localStorage.setItem(CLAVE, JSON.stringify(SEED_REPORTES))
  return SEED_REPORTES
}
function guardarLocal(reportes) {
  localStorage.setItem(CLAVE, JSON.stringify(reportes))
}

// --- API pública ---

// Reportes activos (los resueltos/reencontrados no se muestran), más nuevo primero.
export async function getReportes() {
  if (supabaseConfigurado) {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .eq('estado', 'activo')
      .eq('oculto', false)
      .eq('bloqueado', false)
      .order('creado_en', { ascending: false })
    if (error) throw error
    return data.map(desdeFila)
  }
  return leerLocal()
    .filter((r) => r.estado !== 'resuelto')
    .sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1))
}

// Suma 1 apoyo (prueba social) a un aviso. Devuelve el nuevo total, o null.
export async function sumarApoyo(reporteId) {
  if (!reporteId) return null
  if (supabaseConfigurado) {
    const { data, error } = await supabase.rpc('sumar_apoyo', { rid: reporteId })
    if (error) throw error
    return data
  }
  return null // modo local: el cliente ya muestra el +1 optimista
}

// ---------------------------------------------------------------------------
// Mis ubicaciones (lugares guardados + zonas de aviso)
// ---------------------------------------------------------------------------
function ubicDesdeFila(u) {
  return { id: u.id, nombre: u.nombre, lat: u.lat, lng: u.lng, radioKm: u.radio_km, avisar: u.avisar }
}

export async function getUbicaciones(userId) {
  if (!userId || !supabaseConfigurado) return []
  const { data, error } = await supabase.from('ubicaciones').select('*').eq('user_id', userId).order('creado_en', { ascending: true })
  if (error) throw error
  return (data || []).map(ubicDesdeFila)
}

export async function addUbicacion({ userId, nombre, lat, lng, radioKm, avisar }) {
  if (!supabaseConfigurado) return null
  const { data, error } = await supabase
    .from('ubicaciones')
    .insert({ user_id: userId, nombre, lat, lng, radio_km: radioKm, avisar })
    .select()
    .single()
  if (error) throw error
  return ubicDesdeFila(data)
}

export async function actualizarUbicacion(id, campos) {
  if (!id || !supabaseConfigurado) return
  const fila = {}
  if (campos.avisar != null) fila.avisar = campos.avisar
  if (campos.radioKm != null) fila.radio_km = campos.radioKm
  if (campos.nombre != null) fila.nombre = campos.nombre
  if (campos.lat != null) fila.lat = campos.lat
  if (campos.lng != null) fila.lng = campos.lng
  await supabase.from('ubicaciones').update(fila).eq('id', id)
}

export async function eliminarUbicacion(id) {
  if (!id || !supabaseConfigurado) return
  await supabase.from('ubicaciones').delete().eq('id', id)
}

// ---------------------------------------------------------------------------
// Desactivar / reactivar cuenta (reversible): oculta o muestra los avisos del usuario.
// ---------------------------------------------------------------------------
export async function desactivarCuenta(userId) {
  if (!supabaseConfigurado || !userId) return
  await supabase.from('reportes').update({ oculto: true }).eq('user_id', userId)
  await supabase.auth.updateUser({ data: { desactivada: true } })
}

export async function reactivarCuenta(userId) {
  if (!supabaseConfigurado || !userId) return
  await supabase.from('reportes').update({ oculto: false }).eq('user_id', userId)
  await supabase.auth.updateUser({ data: { desactivada: false } })
}

// ---------------------------------------------------------------------------
// Panel de administración (solo el dueño; la función SQL valida por email).
// ---------------------------------------------------------------------------
export async function getAdminStats() {
  if (!supabaseConfigurado) return null
  const { data, error } = await supabase.rpc('admin_stats')
  if (error) throw error
  return data
}

export async function getAdminStatsRango(desde, hasta) {
  if (!supabaseConfigurado) return null
  const { data, error } = await supabase.rpc('admin_stats_rango', { desde, hasta })
  if (error) throw error
  return data
}

// Últimos avisos subidos (para el "chequeo de qué entró"). Lee la tabla pública.
export async function getActividadReciente(limite = 15) {
  if (!supabaseConfigurado) return []
  const { data, error } = await supabase
    .from('reportes')
    .select('*')
    .eq('oculto', false)
    .eq('bloqueado', false)
    .order('creado_en', { ascending: false })
    .limit(limite)
  if (error) throw error
  return (data || []).map(desdeFila)
}

// Actividad (avisos activos) agrupada por provincia: dónde prende la app.
export async function getActivosPorProvincia() {
  if (!supabaseConfigurado) return []
  const { data, error } = await supabase
    .from('reportes')
    .select('localidad, tipo')
    .eq('estado', 'activo')
    .eq('oculto', false)
    .eq('bloqueado', false)
  if (error) throw error
  const map = new Map()
  for (const r of data || []) {
    const p = provinciaDe(r.localidad || 'Paraná')
    const g = map.get(p) || { provincia: p, total: 0, perdidos: 0, encontrados: 0 }
    g.total++
    if (r.tipo === 'perdido') g.perdidos++
    else g.encontrados++
    map.set(p, g)
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
}

// Perdidos activos hace más de `dias` días: los que necesitan un empujón (difundir o cerrar).
export async function getPerdidosParaEmpujar(dias = 7, limite = 20) {
  if (!supabaseConfigurado) return []
  const corte = new Date(Date.now() - dias * 86400000).toISOString()
  const { data, error } = await supabase
    .from('reportes')
    .select('*')
    .eq('estado', 'activo')
    .eq('tipo', 'perdido')
    .eq('oculto', false)
    .eq('bloqueado', false)
    .lt('creado_en', corte)
    .order('creado_en', { ascending: true })
    .limit(limite)
  if (error) throw error
  return (data || []).map(desdeFila)
}

// ---------------------------------------------------------------------------
// Moderación: reportar avisos (sin login) + acciones de admin.
// ---------------------------------------------------------------------------
function deviceId() {
  try {
    let d = localStorage.getItem('chicho_device')
    if (!d) {
      d = (window.crypto && crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random()}`
      localStorage.setItem('chicho_device', d)
    }
    return d
  } catch (e) {
    return 'anon'
  }
}

export async function denunciarReporte(reporteId, motivo) {
  if (!reporteId || !supabaseConfigurado) return null
  const { data, error } = await supabase.rpc('denunciar_reporte', { rid: reporteId, dev: deviceId(), motivo: motivo || null })
  if (error) throw error
  return data
}

// --- Anti-estafa: números de WhatsApp sospechosos ---
// Normaliza a solo dígitos, últimos 10 (así +54 9 343..., 0343..., 343... matchean).
function normalizarNumero(w) {
  const d = String(w || '').replace(/\D/g, '')
  return d.slice(-10)
}
// Reporta un número. Devuelve cuántos dispositivos distintos lo reportaron.
export async function reportarNumero(whatsapp, motivo) {
  const num = normalizarNumero(whatsapp)
  if (!num || !supabaseConfigurado) return 0
  const { data, error } = await supabase.rpc('reportar_numero', { num, dev: deviceId(), motivo: motivo || null })
  if (error) throw error
  return data || 0
}
// Cuántos reportaron ese número (para la advertencia). Falla silencioso → 0.
export async function reportesDeNumero(whatsapp) {
  const num = normalizarNumero(whatsapp)
  if (!num || !supabaseConfigurado) return 0
  try {
    const { data, error } = await supabase.rpc('reportes_de_numero', { num })
    if (error) return 0
    return data || 0
  } catch (e) {
    return 0
  }
}

export async function getModeracion() {
  if (!supabaseConfigurado) return null
  const { data, error } = await supabase.rpc('admin_moderacion')
  if (error) throw error
  return data
}
export async function desbloquearReporte(id) {
  if (supabaseConfigurado) await supabase.rpc('desbloquear_reporte', { rid: id })
}
export async function borrarReporteAdmin(id) {
  if (supabaseConfigurado) await supabase.rpc('borrar_reporte_admin', { rid: id })
}
export async function banearUsuario(uid) {
  if (supabaseConfigurado) await supabase.rpc('banear_usuario', { uid })
}
export async function desbanearUsuario(uid) {
  if (supabaseConfigurado) await supabase.rpc('desbanear_usuario', { uid })
}

// ---------------------------------------------------------------------------
// Centro de notificaciones in-app (la campanita)
// ---------------------------------------------------------------------------
function notifDesdeFila(n) {
  return { id: n.id, titulo: n.titulo, cuerpo: n.cuerpo, reporteId: n.reporte_id, tipo: n.tipo, leida: n.leida, creadoEn: n.creado_en }
}

export async function getNotificaciones(userId) {
  if (!userId || !supabaseConfigurado) return []
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('user_id', userId)
    .order('creado_en', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data || []).map(notifDesdeFila)
}

export async function marcarNotifLeida(id) {
  if (!id || !supabaseConfigurado) return
  await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
}

export async function marcarTodasLeidas(userId) {
  if (!userId || !supabaseConfigurado) return
  await supabase.from('notificaciones').update({ leida: true }).eq('user_id', userId).eq('leida', false)
}

export async function marcarLeidasDeReporte(userId, reporteId) {
  if (!userId || !reporteId || !supabaseConfigurado) return
  await supabase.from('notificaciones').update({ leida: true }).eq('user_id', userId).eq('reporte_id', reporteId).eq('leida', false)
}

// Trae un aviso puntual por id (activo o resuelto), para abrir un link directo.
export async function getReportePorId(id) {
  if (!id) return null
  if (supabaseConfigurado) {
    const { data, error } = await supabase.from('reportes').select('*').eq('id', id).eq('oculto', false).eq('bloqueado', false).maybeSingle()
    if (error) throw error
    return data ? desdeFila(data) : null
  }
  return leerLocal().find((r) => r.id === id) || null
}

// Trae SOLO los avisos de un usuario (activos y resueltos), más nuevo primero.
export async function getMisReportes(userId) {
  if (!userId) return []
  if (supabaseConfigurado) {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .eq('user_id', userId)
      .order('creado_en', { ascending: false })
    if (error) throw error
    return data.map(desdeFila)
  }
  return leerLocal()
    .filter((r) => r.userId === userId)
    .sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1))
}

// Reencontrados (reencuentros): avisos ya resueltos, más nuevo primero.
export async function getReencontrados() {
  if (supabaseConfigurado) {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .eq('estado', 'resuelto')
      .eq('oculto', false)
      .eq('bloqueado', false)
      .order('creado_en', { ascending: false })
      .limit(50)
    if (error) throw error
    return data.map(desdeFila)
  }
  return leerLocal()
    .filter((r) => r.estado === 'resuelto')
    .sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1))
}

// Crea un reporte nuevo. Devuelve el reporte creado.
export async function addReporte(datos) {
  if (supabaseConfigurado) {
    const fila = haciaFila(datos)
    // "Publicado por": nombre de pila del que publica (si está logueado). Si no
    // hay sesión (ej. "Encontré" sin cuenta), queda 'Anónimo' por el default de la base.
    try {
      const { data: auth } = await supabase.auth.getUser()
      const full = auth?.user?.user_metadata?.full_name || auth?.user?.user_metadata?.name || ''
      const pila = full.trim().split(/\s+/)[0]
      if (pila) fila.autor = pila
    } catch (e) {
      /* sin nombre: queda Anónimo */
    }
    const { data, error } = await supabase.from('reportes').insert(fila).select().single()
    if (error) throw error
    return desdeFila(data)
  }
  const reportes = leerLocal()
  const nuevo = {
    id: 'r-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000),
    estado: 'activo',
    creadoEn: new Date().toISOString(),
    autor: 'Vos',
    userId: 'local',
    ...datos,
  }
  reportes.push(nuevo)
  guardarLocal(reportes)
  return nuevo
}

// Edita un aviso existente (solo el dueño, por las políticas de Supabase).
export async function actualizarReporte(id, datos) {
  if (supabaseConfigurado) {
    const { data, error } = await supabase.from('reportes').update(haciaFila(datos)).eq('id', id).select().single()
    if (error) throw error
    return desdeFila(data)
  }
  let actualizado = null
  const reportes = leerLocal().map((r) => {
    if (r.id === id) {
      actualizado = { ...r, ...datos }
      return actualizado
    }
    return r
  })
  guardarLocal(reportes)
  return actualizado
}

// Marca un aviso como reencontrado/resuelto (sale del listado).
// Guarda SOLO la huella visual de un aviso (se calcula en segundo plano tras publicar).
export async function guardarEmbedding(id, embedding) {
  if (!supabaseConfigurado || !id || !embedding) return
  const { error } = await supabase.from('reportes').update({ embedding }).eq('id', id)
  if (error) console.warn('No se pudo guardar la huella:', error)
}

export async function marcarResuelto(id) {
  if (supabaseConfigurado) {
    const { error } = await supabase.from('reportes').update({ estado: 'resuelto' }).eq('id', id)
    if (error) throw error
    return
  }
  const reportes = leerLocal().map((r) => (r.id === id ? { ...r, estado: 'resuelto' } : r))
  guardarLocal(reportes)
}

// Renueva un aviso: lo "re-publica" (actualiza creado_en a ahora) para que
// vuelva arriba en el feed. La fecha en que se perdió (fecha_evento) no se toca.
export async function renovarReporte(id) {
  if (supabaseConfigurado) {
    const { data, error } = await supabase
      .from('reportes')
      .update({ creado_en: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) throw error
    return data ? desdeFila(data) : null
  }
  const reportes = leerLocal().map((r) => (r.id === id ? { ...r, creadoEn: new Date().toISOString() } : r))
  guardarLocal(reportes)
  return reportes.find((r) => r.id === id) || null
}

// Vuelve a activar un aviso que estaba resuelto.
export async function reactivarReporte(id) {
  if (supabaseConfigurado) {
    const { error } = await supabase.from('reportes').update({ estado: 'activo' }).eq('id', id)
    if (error) throw error
    return
  }
  const reportes = leerLocal().map((r) => (r.id === id ? { ...r, estado: 'activo' } : r))
  guardarLocal(reportes)
}

// --- Gestión de avisos sin cuenta (token secreto → chicho.ar/g/<token>) ---
export function nuevoTokenGestion() {
  try {
    return (window.crypto && crypto.randomUUID && crypto.randomUUID()) || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  } catch (e) {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  }
}
// Registra el token del aviso recién creado. Devuelve true si se guardó.
export async function publicarGestion(reporteId, token) {
  if (!supabaseConfigurado || !reporteId || !token) return false
  const { data, error } = await supabase.rpc('publicar_gestion', { rid: reporteId, tok: token })
  if (error) throw error
  return !!data
}
export async function getReportePorToken(token) {
  if (!supabaseConfigurado || !token) return null
  const { data, error } = await supabase.rpc('reporte_por_token', { tok: token })
  if (error) throw error
  return (data && data[0]) || null
}
export async function resolverPorToken(token) {
  if (!supabaseConfigurado || !token) return false
  const { data, error } = await supabase.rpc('resolver_gestion', { tok: token })
  if (error) throw error
  return !!data
}
export async function borrarPorToken(token) {
  if (!supabaseConfigurado || !token) return false
  const { data, error } = await supabase.rpc('borrar_gestion', { tok: token })
  if (error) throw error
  return !!data
}

// Borra un aviso (solo el dueño).
export async function eliminarReporte(id) {
  if (supabaseConfigurado) {
    const { error } = await supabase.from('reportes').delete().eq('id', id)
    if (error) throw error
    return
  }
  guardarLocal(leerLocal().filter((r) => r.id !== id))
}

// ---------------------------------------------------------------------------
// Mis mascotas (perfiles guardados para publicar rápido si se pierden)
// ---------------------------------------------------------------------------
const CLAVE_MASCOTAS = 'vav_mascotas_v1'

function mascotaDesdeFila(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    especie: row.especie,
    color: row.color,
    tamano: row.tamano,
    raza: row.raza,
    descripcion: row.descripcion,
    foto: row.foto,
    sexo: row.sexo,
    edad: row.edad,
    collar: row.collar,
    whatsapp: row.whatsapp,
    relacion: row.relacion || 'propia',
  }
}
function mascotaHaciaFila(m) {
  return {
    nombre: m.nombre,
    especie: m.especie,
    color: m.color,
    tamano: m.tamano,
    raza: m.raza,
    descripcion: m.descripcion,
    whatsapp: m.whatsapp ?? null,
    foto: m.foto,
    sexo: m.sexo ?? null,
    edad: m.edad ?? null,
    collar: m.collar ?? null,
    relacion: m.relacion ?? 'propia',
  }
}
function leerMascotasLocal() {
  try {
    const raw = localStorage.getItem(CLAVE_MASCOTAS)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    /* ignore */
  }
  return []
}
function guardarMascotasLocal(m) {
  localStorage.setItem(CLAVE_MASCOTAS, JSON.stringify(m))
}

export async function getMisMascotas(userId) {
  if (!userId) return []
  if (supabaseConfigurado) {
    const { data, error } = await supabase
      .from('mascotas')
      .select('*')
      .eq('user_id', userId)
      .order('creado_en', { ascending: false })
    if (error) throw error
    return data.map(mascotaDesdeFila)
  }
  return leerMascotasLocal()
}

export async function addMascota(datos) {
  if (supabaseConfigurado) {
    const { data, error } = await supabase.from('mascotas').insert(mascotaHaciaFila(datos)).select().single()
    if (error) throw error
    return mascotaDesdeFila(data)
  }
  const ms = leerMascotasLocal()
  const nueva = { id: 'm-' + Date.now().toString(36), ...datos }
  ms.push(nueva)
  guardarMascotasLocal(ms)
  return nueva
}

export async function actualizarMascota(id, datos) {
  if (supabaseConfigurado) {
    const { data, error } = await supabase.from('mascotas').update(mascotaHaciaFila(datos)).eq('id', id).select().single()
    if (error) throw error
    return mascotaDesdeFila(data)
  }
  let out = null
  const ms = leerMascotasLocal().map((m) => {
    if (m.id === id) {
      out = { ...m, ...datos }
      return out
    }
    return m
  })
  guardarMascotasLocal(ms)
  return out
}

// Perfil público de una mascota (para el QR del collar, sin login).
export async function getPerfilPublico(id) {
  if (!id) return null
  if (supabaseConfigurado) {
    const { data, error } = await supabase.rpc('perfil_publico', { m_id: id })
    if (error) throw error
    return (data && data[0]) || null
  }
  const m = leerMascotasLocal().find((x) => x.id === id)
  return m ? { ...m, perdido: false } : null
}

export async function eliminarMascota(id) {
  if (supabaseConfigurado) {
    const { error } = await supabase.from('mascotas').delete().eq('id', id)
    if (error) throw error
    return
  }
  guardarMascotasLocal(leerMascotasLocal().filter((m) => m.id !== id))
}

// ---------------------------------------------------------------------------
// Avistamientos ("¡Lo vi acá!") — sin login, cualquiera puede dejar uno
// ---------------------------------------------------------------------------
const CLAVE_AVIST = 'vav_avistamientos_v1'

function avistDesdeFila(a) {
  return { id: a.id, reporteId: a.reporte_id, lat: a.lat, lng: a.lng, nota: a.nota, autor: a.autor, whatsapp: a.whatsapp, foto: a.foto, creadoEn: a.creado_en }
}

// Avistamientos de un aviso, del más viejo al más nuevo (para ver el recorrido).
export async function getAvistamientos(reporteId) {
  if (!reporteId) return []
  if (supabaseConfigurado) {
    const { data, error } = await supabase
      .from('avistamientos')
      .select('*')
      .eq('reporte_id', reporteId)
      .order('creado_en', { ascending: true })
    if (error) throw error
    return data.map(avistDesdeFila)
  }
  const all = JSON.parse(localStorage.getItem(CLAVE_AVIST) || '[]')
  return all.filter((a) => a.reporteId === reporteId).sort((a, b) => (a.creadoEn < b.creadoEn ? -1 : 1))
}

export async function addAvistamiento({ reporteId, lat, lng, nota, autor, whatsapp, foto }) {
  if (supabaseConfigurado) {
    const base = { reporte_id: reporteId, lat, lng, nota, autor }
    const fila = { ...base }
    if (whatsapp) fila.whatsapp = whatsapp
    if (foto) fila.foto = foto
    let { data, error } = await supabase.from('avistamientos').insert(fila).select().single()
    // A prueba de balas: si falla por una columna opcional (whatsapp/foto),
    // reintentamos con lo esencial — jamás perdemos un avistamiento.
    if (error && (whatsapp || foto)) {
      console.warn('Avistamiento: reintento sin extras por error:', error.message)
      ;({ data, error } = await supabase.from('avistamientos').insert(base).select().single())
    }
    if (error) throw error
    return avistDesdeFila(data)
  }
  const all = JSON.parse(localStorage.getItem(CLAVE_AVIST) || '[]')
  const nuevo = { id: 'a-' + Date.now().toString(36), reporteId, lat, lng, nota, autor, whatsapp: whatsapp || '', foto: foto || '', creadoEn: new Date().toISOString() }
  all.push(nuevo)
  localStorage.setItem(CLAVE_AVIST, JSON.stringify(all))
  return nuevo
}

// ---------------------------------------------------------------------------
// Notificaciones push (suscripciones de dispositivos + preferencias)
// ---------------------------------------------------------------------------
export async function guardarSuscripcion(sub) {
  if (!supabaseConfigurado) return null
  const { data, error } = await supabase.from('push_subs').upsert(sub, { onConflict: 'endpoint' }).select().single()
  if (error) throw error
  return data
}

export async function borrarSuscripcion(endpoint) {
  if (!supabaseConfigurado) return
  const { error } = await supabase.from('push_subs').delete().eq('endpoint', endpoint)
  if (error) throw error
}

export async function getNotifPrefs(userId) {
  if (!supabaseConfigurado || !userId) return null
  const { data, error } = await supabase.from('notif_prefs').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function guardarNotifPrefs(prefs) {
  if (!supabaseConfigurado) return null
  let { data, error } = await supabase.from('notif_prefs').upsert(prefs, { onConflict: 'user_id' }).select().single()
  // A prueba de balas: si la columna "provincias" todavía no existe, guardá sin ella.
  if (error && prefs.provincias) {
    const { provincias, ...resto } = prefs
    const r = await supabase.from('notif_prefs').upsert(resto, { onConflict: 'user_id' }).select().single()
    data = r.data
    error = r.error
  }
  // Idem "localidades".
  if (error && prefs.localidades) {
    const { localidades, ...resto } = prefs
    const r = await supabase.from('notif_prefs').upsert(resto, { onConflict: 'user_id' }).select().single()
    data = r.data
    error = r.error
  }
  if (error) throw error
  return data
}

// --- Seguir avisos (novedades de una mascota puntual) ---
export async function seguirReporte(reporteId) {
  if (!supabaseConfigurado) return
  const { error } = await supabase.from('seguidores').insert({ reporte_id: reporteId })
  if (error && error.code !== '23505') throw error // 23505 = ya lo seguía
}
export async function dejarDeSeguir(reporteId) {
  if (!supabaseConfigurado) return
  // RLS asegura que solo borra la fila propia.
  const { error } = await supabase.from('seguidores').delete().eq('reporte_id', reporteId)
  if (error) throw error
}
export async function getSeguidos(userId) {
  if (!supabaseConfigurado || !userId) return []
  const { data, error } = await supabase.from('seguidores').select('reporte_id').eq('user_id', userId)
  if (error) throw error
  return (data || []).map((s) => s.reporte_id)
}

// Sube una lista de fotos [{ url, file }] y devuelve las URLs finales.
// Las que ya tienen url remota se conservan; las nuevas (con file) se suben.
export async function subirFotos(items) {
  const urls = []
  for (const it of items || []) {
    if (it.file) urls.push(await subirFoto(it.file))
    else if (it.url) urls.push(it.url)
  }
  return urls
}

// Sube el recorte para el FEED (el de la 1ª foto) y devuelve su URL. Si esa foto
// no tiene recorte (p. ej. una edición con foto ya subida), cae al fallback.
export async function subirFotoFeed(items, fallbackUrl = '') {
  const it = (items || [])[0]
  if (it && it.thumb) return await subirFoto(it.thumb)
  return fallbackUrl
}

// Sube una foto y devuelve su URL. En la nube va al Storage; en local, un data URL.
export async function subirFoto(file) {
  if (!file) return ''
  if (supabaseConfigurado) {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`
    const { error } = await supabase.storage.from('fotos').upload(path, file, { upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('fotos').getPublicUrl(path)
    return data.publicUrl
  }
  return fileADataUrl(file)
}

function fileADataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
