// Optimiza los thumbnails del FEED que ya están subidos (los avisos viejos se
// subieron a 1080px; los nuevos ya salen a 800). Baja el peso ~60% → mejor LCP y
// menos consumo de Storage/egress.
//
// CÓMO FUNCIONA (y por qué es seguro):
// - Baja el thumbnail ACTUAL (que ya tiene el recorte que eligió el usuario) y
//   solo lo achica → el encuadre se respeta.
// - Pisa el MISMO archivo en Storage (misma URL). NO toca la base de datos, así
//   que NO se dispara el webhook de "notificar" (si actualizáramos la columna
//   foto, les llegaría un push "la familia actualizó el aviso" a todos los
//   seguidores). Cero escrituras en la DB = cero notificaciones.
// - Nunca toca fotos[] (las completas del detalle quedan intactas).
// - SALTA los avisos donde la foto del feed ES la foto completa (foto === fotos[0]):
//   achicarlas degradaría también el detalle.
// - Es re-ejecutable: si una imagen ya mide <= 800px, la saltea.
//
// USO (PowerShell, desde la raíz del proyecto):
//   $env:SUPABASE_URL="https://TU-REF.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"
//   node scripts/optimizar-fotos.mjs            <- SIMULACIÓN (no toca nada)
//   node scripts/optimizar-fotos.mjs --aplicar  <- aplica de verdad
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const URL_SB = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APLICAR = process.argv.includes('--aplicar')
const ANCHO = 800
const CALIDAD = 80

if (!URL_SB || !KEY) {
  console.error('✗ Faltan las variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
const sb = createClient(URL_SB, KEY)

// Saca el path dentro del bucket a partir de la URL pública.
function pathDe(url) {
  const m = String(url).match(/\/storage\/v1\/object\/public\/fotos\/(.+)$/)
  return m ? decodeURIComponent(m[1]) : null
}
const kb = (b) => Math.round(b / 1024)

const { data: reportes, error } = await sb.from('reportes').select('id, nombre, foto, fotos').not('foto', 'is', null)
if (error) throw error

console.log(`${APLICAR ? '▶ APLICANDO' : '● SIMULACIÓN (sin --aplicar no se toca nada)'} — ${reportes.length} avisos con foto\n`)

let optimizadas = 0
let saltadas = 0
let ahorroKB = 0

for (const r of reportes) {
  const quien = r.nombre || r.id.slice(0, 8)

  if (Array.isArray(r.fotos) && r.fotos[0] === r.foto) {
    console.log(`⏭  ${quien}: la foto del feed ES la completa → se salta (achicarla rompería el detalle)`)
    saltadas++
    continue
  }
  const path = pathDe(r.foto)
  if (!path) {
    console.log(`⏭  ${quien}: URL no reconocida → se salta`)
    saltadas++
    continue
  }

  let orig
  try {
    const res = await fetch(r.foto)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    orig = Buffer.from(await res.arrayBuffer())
  } catch (e) {
    console.log(`⏭  ${quien}: no se pudo bajar (${e.message}) → se salta`)
    saltadas++
    continue
  }

  const meta = await sharp(orig).metadata()
  if ((meta.width || 0) <= ANCHO) {
    console.log(`✓  ${quien}: ya mide ${meta.width}px → nada que hacer`)
    saltadas++
    continue
  }

  const nueva = await sharp(orig).resize({ width: ANCHO }).jpeg({ quality: CALIDAD }).toBuffer()
  ahorroKB += kb(orig.length) - kb(nueva.length)
  console.log(`${APLICAR ? '↓' : '·'}  ${quien}: ${meta.width}px ${kb(orig.length)}KB → ${ANCHO}px ${kb(nueva.length)}KB`)

  if (APLICAR) {
    const { error: e } = await sb.storage.from('fotos').upload(path, nueva, { contentType: 'image/jpeg', upsert: true })
    if (e) {
      console.error(`   ✗ error subiendo: ${e.message}`)
      continue
    }
    optimizadas++
  }
}

console.log(
  `\n${APLICAR ? '✅ Listo' : '● Fin de la simulación'} — optimizadas: ${APLICAR ? optimizadas : 0}, saltadas: ${saltadas}, ahorro${APLICAR ? '' : ' estimado'}: ~${ahorroKB}KB`,
)
if (!APLICAR) console.log('   Si el informe te cierra, corré de nuevo con  --aplicar')
