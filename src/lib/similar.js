// Similitud visual de mascotas — 100% en el navegador (gratis, privado).
// Genera una "huella" (embedding) de una foto con un modelo que corre en el
// dispositivo del usuario, y compara huellas por coseno. Sirve para sugerir
// avisos parecidos (perdido <-> encontrado) sin subir la foto a ningún servicio.
import { pipeline, env } from '@xenova/transformers'

// No buscamos modelos locales: se bajan del CDN de Hugging Face y quedan cacheados.
env.allowLocalModels = false

// Modelo de embeddings de imágenes. Swappable por uno más liviano si hace falta.
const MODELO = 'Xenova/clip-vit-base-patch32'

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
    const v = Array.from(out.data)
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
