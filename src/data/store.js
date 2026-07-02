// ---------------------------------------------------------------------------
// Capa de datos de "Volverte a ver".
//
// Funciona en DOS modos, automáticamente:
//   - Si hay claves de Supabase (.env)  -> guarda en la nube (compartido entre
//     todos los usuarios) y sube las fotos al Storage.
//   - Si NO hay claves                  -> guarda en localStorage (solo en este
//     navegador). Útil para desarrollo sin backend.
//
// Toda la app usa estas funciones y no sabe en qué modo está. Todas son async.
// ---------------------------------------------------------------------------
import { supabase, supabaseConfigurado } from '../lib/supabase.js'
import { SEED_REPORTES } from './seed.js'

const CLAVE = 'vav_reportes_v1'

// --- Mapeo entre el objeto de la app (camelCase) y la fila de la base (snake_case) ---
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
  }
}
function haciaFila(r) {
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
    autor: r.autor,
    fecha_evento: r.fechaEvento,
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

// Devuelve todos los reportes, del más nuevo al más viejo.
export async function getReportes() {
  if (supabaseConfigurado) {
    const { data, error } = await supabase
      .from('reportes')
      .select('*')
      .order('creado_en', { ascending: false })
    if (error) throw error
    return data.map(desdeFila)
  }
  return leerLocal().sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1))
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
    ...datos,
  }
  reportes.push(nuevo)
  guardarLocal(reportes)
  return nuevo
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
