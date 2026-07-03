// Backfill de huellas visuales (embeddings) para avisos con foto que todavía no
// la tienen. Corre UNA sola vez, local, con la service_role key (bypassa RLS).
//
// Uso:
//   1) npm install            (asegura @xenova/transformers y sharp)
//   2) En el entorno, seteá:
//        SUPABASE_URL           = https://<tu-proyecto>.supabase.co
//        SUPABASE_SERVICE_ROLE  = <service_role key>  (NUNCA la subas al repo)
//   3) node scripts/backfill-embeddings.mjs
//
// La huella se normaliza L2 igual que en src/lib/similar.js, para que el coseno
// (producto punto) sea comparable con las que calcula el navegador.
import { createClient } from '@supabase/supabase-js'
import { pipeline, env } from '@xenova/transformers'

env.allowLocalModels = false

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE
if (!URL || !KEY) {
  console.error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE en el entorno.')
  process.exit(1)
}
const sb = createClient(URL, KEY)

function normalizaL2(v) {
  let n = 0
  for (const x of v) n += x * x
  n = Math.sqrt(n) || 1
  return Array.from(v).map((x) => x / n)
}

console.log('Cargando el modelo (la primera vez baja ~90MB)…')
const ext = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32', { quantized: true })

const { data: reps, error } = await sb.from('reportes').select('id, foto, embedding').not('foto', 'is', null)
if (error) throw error

const pendientes = reps.filter((r) => r.foto && !(Array.isArray(r.embedding) && r.embedding.length))
console.log(`${pendientes.length} avisos con foto sin huella (de ${reps.length}).`)

let ok = 0
for (const r of pendientes) {
  try {
    const out = await ext(r.foto)
    const emb = normalizaL2(out.data)
    const { error: e2 } = await sb.from('reportes').update({ embedding: emb }).eq('id', r.id)
    if (e2) throw e2
    ok++
    console.log(`✓ ${ok}/${pendientes.length}  ${r.id}`)
  } catch (e) {
    console.warn(`✗ ${r.id}:`, e.message || e)
  }
}
console.log(`Listo. ${ok} huellas cargadas.`)
