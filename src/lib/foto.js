// Servir las fotos de Supabase Storage optimizadas (CDN de transformación).
//
// Por qué: PageSpeed (30-jul-2026) mostró 1211 KB de fotos en el feed —una sola de
// 479 KB— con el LCP en 6,1 s. El LCP en sí estaba bien configurado (eager +
// fetchpriority=high + visible en el HTML): el problema era el PESO. Muchos avisos
// viejos tienen el recorte en JPEG (el WebP del cropper es posterior) y alguno subió
// la foto completa como recorte.
//
// La transformación de Supabase (/render/image/public/) recomprime y NEGOCIA EL
// FORMATO: al navegador que acepta WebP le manda WebP. Medido con una foto real del
// feed: 83 KB (jpeg) → 20-22 KB (webp), o sea -75%, sin tocar la base ni re-subir nada.
//
// OJO con el costo: Supabase factura las transformaciones por "origin image" (imagen
// original distinta transformada en el mes), no por request. Con las decenas de avisos
// activos de hoy entra en el plan; si algún día hay miles de fotos NUEVAS por mes, hay
// que mirar la factura. Ver ESCALA.md.
const MARCA = '/storage/v1/object/public/'
const TRANSFORMA = '/storage/v1/render/image/public/'

// Ancho por defecto: la tarjeta del feed mide ~333 px CSS; 800 cubre pantallas
// retina (DPR 2-2.4) y a calidad 62 pesa ~20 KB.
//
// resize=contain NO es opcional: el modo por defecto de Supabase es `cover`, y como sólo
// le mandamos `width`, toma la ALTURA ORIGINAL como destino y recorta en vez de escalar.
// Con una foto de 800x400 (el recorte del feed), pedirle 300 devolvía 300x400 — una
// franja vertical del centro. En el feed no se notaba porque 800 coincide con el
// original, pero las miniaturas de 300 (coincidencias de "Encontré" y el buscador)
// mostraban un pedazo de piso en vez de la mascota. Verificado midiendo la misma foto:
// width=800 → 800x400 · width=300 → 300x400 (mal) · con contain → 300x150 (bien).
export function fotoOptimizada(url, ancho = 800, calidad = 62) {
  if (!url || typeof url !== 'string') return url
  if (!url.includes(MARCA)) return url // data URL (modo local), otra CDN, o ya transformada
  return `${url.replace(MARCA, TRANSFORMA)}?width=${ancho}&quality=${calidad}&resize=contain`
}
