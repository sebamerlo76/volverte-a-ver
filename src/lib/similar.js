// Similitud visual de mascotas — 100% en el navegador (gratis, privado).
// Genera una "huella" (embedding) de una foto con un modelo que corre en el
// dispositivo del usuario, y compara huellas por coseno. Sirve para sugerir
// avisos parecidos (perdido <-> encontrado) sin subir la foto a ningún servicio.
import { pipeline, env } from '@xenova/transformers'

// No buscamos modelos locales: se bajan del CDN de Hugging Face y quedan cacheados.
env.allowLocalModels = false

// Modelo de embeddings de imágenes. DINOv2 desde el 28-jul-2026: en el A/B con los
// avisos reales (scripts/ab-similitud.mjs) le ganó a CLIP 11/13 vs 8/13 en encontrar
// al mismo animal, con MUCHA más separación del resto (margen +0.155 vs -0.005), y
// encima pesa 24MB contra 85MB. Ojo: cambiar de modelo cambia el largo de la huella
// → hay que correr "Recalcular huellas visuales" (Admin) después de deployar (las
// huellas de distinto largo dan similitud 0, no rompen ni mienten).
const MODELO = 'Xenova/dinov2-small'

let _extractor = null
let _cargando = null

// Carga perezosa del modelo (una sola vez).
async function extractor() {
  if (_extractor) return _extractor
  if (!_cargando) {
    _cargando = pipeline('image-feature-extraction', MODELO, { quantized: true })
      .then((e) => {
        _extractor = e
        return e
      })
      .catch((e) => {
        _cargando = null // permitir reintentar si falló la carga
        throw e
      })
  }
  return _cargando
}

// ¿Ya está cargado el modelo? (para mostrar/ocultar estados sin forzar la descarga)
export function modeloListo() {
  return !!_extractor
}

// Precarga el modelo en segundo plano (ej. al abrir el asistente).
export function precargarModelo() {
  extractor().catch(() => {})
}

// Calcula la huella normalizada de una imagen (url same-origin, dataURL o blob URL).
// Devuelve Array<number> (guardable como JSON) o null si falla.
export async function huellaDeImagen(src) {
  if (!src) return null
  try {
    const ext = await extractor()
    const out = await ext(src)
    // CLIP devuelve el vector ya agrupado ([1, d]); DINOv2 devuelve un vector por
    // token ([1, tokens, d]) → nos quedamos con el CLS (el primero), que es el
    // resumen global de la imagen. Mismo criterio que scripts/ab-similitud.mjs.
    const v = out.dims?.length === 3 ? Array.from(out.data.slice(0, out.dims[2])) : Array.from(out.data)
    // L2-normalizamos para que el coseno sea un simple producto punto.
    let norm = 0
    for (const x of v) norm += x * x
    norm = Math.sqrt(norm) || 1
    return v.map((x) => x / norm)
  } catch (e) {
    console.warn('No se pudo calcular la huella de la imagen:', e)
    return null
  }
}

// La comparación (similitud) vive en ./vector.js — liviana, para importar sin el modelo.
