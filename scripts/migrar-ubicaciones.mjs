// ⚠️ YA SE CORRIÓ Y NO SE PUEDE VOLVER A CORRER (2026-07-15, 13 ubicaciones).
// Queda como registro de cómo se migró. Hoy tira "column ubicaciones.lat does not
// exist": el PASO C borró lat/lng, que es justo lo que este script lee.
//
// Traduce las "Mis ubicaciones" viejas (lat/lng + radio) al vocabulario nuevo
// (ciudad + barrio). Era el PASO B de supabase/schema-ubicaciones-ciudad.sql.
//
// POR QUÉ UN SCRIPT Y NO SQL:
// - Importa el localidades.js REAL, así que usa los mismos centros de ciudad que
//   la app. Hardcodear los centros en el SQL sería un duplicado que se
//   desincroniza en cuanto sumemos una ciudad.
//
// QUÉ HACE:
// - Por cada ubicación, busca la ciudad cargada más cercana a su lat/lng.
// - El barrio NO se adivina: las coords de barrio son aproximadas y los nombres
//   se repiten entre ciudades. Queda vacío y lo completa el usuario si quiere.
// - Las que caen lejos de toda ciudad (> 60 km) NO se tocan: se listan al final
//   para mirarlas a mano. Mejor sin ciudad que con una ciudad mentida.
// - Es re-ejecutable: saltea las que ya tienen localidad.
//
// ANTES: correr el PASO A del SQL (agrega las columnas localidad/zona).
//
// USO (PowerShell, desde la raíz del proyecto):
//   $env:SUPABASE_URL="https://TU-REF.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"
//   node scripts/migrar-ubicaciones.mjs            <- SIMULACIÓN (no toca nada)
//   node scripts/migrar-ubicaciones.mjs --aplicar  <- escribe de verdad
import { createClient } from '@supabase/supabase-js'
import { ciudadMasCercana, distanciaKm, centroDe } from '../src/lib/localidades.js'

const URL_SB = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APLICAR = process.argv.includes('--aplicar')

if (!URL_SB || !KEY) {
  console.error('✗ Faltan las variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}
// Se pega la plantilla tal cual más seguido de lo que uno quisiera, y el error que
// sale (fetch failed) no ayuda en nada: parece un problema de red.
if (/TU-REF|TU_SERVICE|tu-ref/i.test(URL_SB) || /TU_SERVICE|TU-SERVICE/i.test(KEY)) {
  console.error('✗ Las variables tienen el texto de ejemplo, no tus datos reales.')
  console.error('  La URL sale de Supabase → Settings → API → Project URL.')
  process.exit(1)
}
const sb = createClient(URL_SB, KEY)

const { data: ubis, error } = await sb.from('ubicaciones').select('id, nombre, lat, lng, localidad').order('creado_en')
if (error) {
  console.error('✗ No se pudieron leer las ubicaciones:', error.message)
  if (/column .* does not exist/i.test(error.message)) {
    console.error('  ¿Corriste el PASO A de supabase/schema-ubicaciones-ciudad.sql?')
  }
  if (/fetch failed/i.test(error.message)) {
    console.error(`  No se pudo llegar a ${URL_SB} — es un problema de red, no de permisos.`)
    console.error('  Fijate que la URL sea la tuya (Supabase → Settings → API → Project URL).')
  }
  if (/JWT|Unauthorized|invalid/i.test(error.message)) {
    console.error('  La key no es la correcta: tiene que ser la service_role (un JWT largo que arranca con eyJ).')
  }
  process.exit(1)
}

console.log(APLICAR ? '── ESCRIBIENDO ──' : '── SIMULACIÓN (no escribe nada) ──')
console.log(`${ubis.length} ubicacion${ubis.length === 1 ? '' : 'es'} en total\n`)

const lejos = []
let migradas = 0
let saltadas = 0

for (const u of ubis) {
  if (u.localidad) {
    console.log(`  ·  ${u.nombre} — ya tiene ciudad (${u.localidad}), la salteo`)
    saltadas++
    continue
  }
  if (u.lat == null || u.lng == null) {
    console.log(`  ?  ${u.nombre} — sin coords, no hay de dónde sacar la ciudad`)
    lejos.push(u)
    continue
  }
  const ciudad = ciudadMasCercana(u.lat, u.lng)
  if (!ciudad) {
    console.log(`  !  ${u.nombre} (${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}) — lejos de toda ciudad cargada`)
    lejos.push(u)
    continue
  }
  const c = centroDe(ciudad)
  const km = distanciaKm(u.lat, u.lng, c[0], c[1]).toFixed(1)
  console.log(`  →  ${u.nombre} (${u.lat.toFixed(4)}, ${u.lng.toFixed(4)})  →  ${ciudad}  (a ${km} km del centro)`)
  if (APLICAR) {
    const { error: e } = await sb.from('ubicaciones').update({ localidad: ciudad }).eq('id', u.id)
    if (e) {
      console.error(`     ✗ no se pudo guardar: ${e.message}`)
      continue
    }
  }
  migradas++
}

console.log(`\n${migradas} ${APLICAR ? 'migradas' : 'a migrar'} · ${saltadas} ya estaban · ${lejos.length} sin resolver`)
if (lejos.length) {
  console.log('\nEstas quedaron SIN ciudad y hay que mirarlas a mano:')
  for (const u of lejos) console.log(`  - ${u.nombre} (id ${u.id})`)
  console.log('Ojo: el PASO C pone localidad NOT NULL, así que resolvelas antes de correrlo.')
}
if (!APLICAR && migradas > 0) {
  console.log('\nSi la lista de arriba está bien: node scripts/migrar-ubicaciones.mjs --aplicar')
}
