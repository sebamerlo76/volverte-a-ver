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
    foto: row.foto,
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
    foto: r.foto,
    whatsapp: r.whatsapp,
    fecha_evento: r.fechaEvento,
    mascota_id: r.mascotaId ?? null,
    sexo: r.sexo ?? null,
    edad: r.edad ?? null,
    collar: r.collar ?? null,
    recompensa: r.recompensa ?? null,
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
      .order('creado_en', { ascending: false })
    if (error) throw error
    return data.map(desdeFila)
  }
  return leerLocal()
    .filter((r) => r.estado !== 'resuelto')
    .sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1))
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

// Reencontrados (finales felices): avisos ya resueltos, más nuevo primero.
export async function getReencontrados() {
  if (supabaseConfigurado) {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .eq('estado', 'resuelto')
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
    const { data, error } = await supabase.from('reportes').insert(haciaFila(datos)).select().single()
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
export async function marcarResuelto(id) {
  if (supabaseConfigurado) {
    const { error } = await supabase.from('reportes').update({ estado: 'resuelto' }).eq('id', id)
    if (error) throw error
    return
  }
  const reportes = leerLocal().map((r) => (r.id === id ? { ...r, estado: 'resuelto' } : r))
  guardarLocal(reportes)
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
    foto: m.foto,
    sexo: m.sexo ?? null,
    edad: m.edad ?? null,
    collar: m.collar ?? null,
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

export async function eliminarMascota(id) {
  if (supabaseConfigurado) {
    const { error } = await supabase.from('mascotas').delete().eq('id', id)
    if (error) throw error
    return
  }
  guardarMascotasLocal(leerMascotasLocal().filter((m) => m.id !== id))
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
