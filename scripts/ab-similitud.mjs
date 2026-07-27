// A/B de modelos de huella visual con los avisos REALES de Chicho.
// Benchmark: para cada aviso con 2+ fotos, usa la 2ª foto como "consulta" (como si
// alguien encontrara a ese animal y le sacara otra foto) y mide si el modelo
// encuentra el recorte del MISMO animal primero entre todos los de su especie.
// Solo lectura (anon key del .env, misma que viaja en el bundle). No toca la app.
// Uso: node scripts/ab-similitud.mjs
import { readFileSync } from 'fs'
import { pipeline, env as tenv } from '@xenova/transformers'

tenv.allowLocalModels = false

const envTxt = readFileSync('.env', 'utf8')
const lee = (k) => envTxt.match(new RegExp('^' + k + '=(.*)$', 'm'))?.[1]?.trim()
const SUPA = lee('VITE_SUPABASE_URL')
const KEY = lee('VITE_SUPABASE_ANON_KEY')
if (!SUPA || !KEY) {
  console.error('Falta VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env')
  process.exit(1)
}

const MODELOS = [
  { nombre: 'CLIP (actual)', id: 'Xenova/clip-vit-base-patch32' },
  // Candidatos DINOv2 en orden de preferencia (usa el primero que cargue).
  { nombre: 'DINOv2', id: ['Xenova/dinov2-small', 'Xenova/dinov2-base', 'Xenova/dino-vitb16'] },
]

async function traerAvisos() {
  const url =
    `${SUPA}/rest/v1/reportes?estado=eq.activo&oculto=eq.false&bloqueado=eq.false` +
    `&select=id,nombre,especie,tipo,foto,fotos&limit=200`
  const r = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
  if (!r.ok) throw new Error('supabase ' + r.status)
  return (await r.json()).filter((x) => x.foto)
}

// Embedding normalizado. dims [1,d] (CLIP) usa el vector directo; [1,tokens,d]
// (DINOv2) usa el token CLS (el primero).
async function huella(ext, src) {
  const out = await ext(src)
  let v
  if (out.dims.length === 3) v = Array.from(out.data.slice(0, out.dims[2]))
  else v = Array.from(out.data)
  let n = 0
  for (const x of v) n += x * x
  n = Math.sqrt(n) || 1
  return v.map((x) => x / n)
}
const cos = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0)

async function cargarModelo(ids) {
  const lista = Array.isArray(ids) ? ids : [ids]
  for (const id of lista) {
    try {
      const ext = await pipeline('image-feature-extraction', id, { quantized: true })
      return { ext, id }
    } catch (e) {
      console.log(`  (no se pudo cargar ${id}: ${String(e.message || e).slice(0, 80)})`)
    }
  }
  return null
}

const avisos = await traerAvisos()
const consultas = avisos.filter((a) => Array.isArray(a.fotos) && a.fotos.length >= 2)
console.log(`Avisos activos con foto: ${avisos.length} · con 2+ fotos (consultas): ${consultas.length}\n`)
if (!consultas.length) {
  console.log('No hay avisos con 2+ fotos para el benchmark.')
  process.exit(0)
}

for (const m of MODELOS) {
  console.log(`=== ${m.nombre} ===`)
  const cargado = await cargarModelo(m.id)
  if (!cargado) {
    console.log('  no disponible, salteado\n')
    continue
  }
  console.log(`  modelo: ${cargado.id}`)

  // Huellas de todos los recortes (candidatos).
  const emb = {}
  for (const a of avisos) {
    try {
      emb[a.id] = await huella(cargado.ext, a.foto)
    } catch (e) {
      /* foto rota: fuera del benchmark */
    }
  }

  let top1 = 0
  let total = 0
  const margenes = []
  for (const q of consultas) {
    if (!emb[q.id]) continue
    let hq
    try {
      hq = await huella(cargado.ext, q.fotos[1]) // la 2ª foto como consulta
    } catch (e) {
      continue
    }
    const rivales = avisos.filter((a) => a.especie === q.especie && emb[a.id])
    const puntajes = rivales.map((a) => ({ id: a.id, nombre: a.nombre || a.id.slice(0, 6), s: cos(hq, emb[a.id]) })).sort((x, y) => y.s - x.s)
    const pos = puntajes.findIndex((p) => p.id === q.id) + 1
    const propio = puntajes.find((p) => p.id === q.id)
    const mejorOtro = puntajes.find((p) => p.id !== q.id)
    const margen = propio && mejorOtro ? propio.s - mejorOtro.s : 0
    margenes.push(margen)
    total++
    if (pos === 1) top1++
    console.log(
      `  ${(q.nombre || q.id.slice(0, 8)).padEnd(20)} puesto ${pos}/${puntajes.length} · propio ${propio?.s.toFixed(3)} · mejor otro ${mejorOtro?.s.toFixed(3)} (${mejorOtro?.nombre}) · margen ${margen >= 0 ? '+' : ''}${margen.toFixed(3)}`
    )
  }
  const margenMedio = margenes.reduce((s, x) => s + x, 0) / (margenes.length || 1)
  console.log(`  ► top-1: ${top1}/${total} · margen medio sobre el mejor rival: ${margenMedio >= 0 ? '+' : ''}${margenMedio.toFixed(3)}\n`)
}
