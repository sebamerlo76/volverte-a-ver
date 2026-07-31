// Texto del reencuentro en la tarjeta ("Ya en casa").
//
// El caso que importa: tiempoRelativo deja de decir "hace ..." pasado un mes y devuelve
// una fecha suelta ("12 mar"). Ahí "volvió 12 mar" no se entiende y hay que meterle el
// "el". Es el borde que se rompería solo si alguien toca tiempoRelativo.
//
// Correr: node test/texto-reencuentro.test.mjs
import { textoReencuentro } from '../src/lib/formato.js'
import assert from 'node:assert'

const ahora = Date.now()
const hace = (ms) => new Date(ahora - ms).toISOString()
const MIN = 60000
const HORA = 60 * MIN
const DIA = 24 * HORA

const casos = [
  [hace(10 * MIN), 'volvió hace 10 min'],
  [hace(3 * HORA), 'volvió hace 3 h'],
  [hace(DIA), 'volvió ayer'],
  [hace(4 * DIA), 'volvió hace 4 días'],
  [hace(7 * DIA), 'volvió hace 1 semana'],
  [hace(21 * DIA), 'volvió hace 3 semanas'],
]

let ok = 0
for (const [iso, esperado] of casos) {
  const dio = textoReencuentro(iso)
  assert.strictEqual(dio, esperado, `${iso} → "${dio}" (se esperaba "${esperado}")`)
  ok++
}

// Más de un mes: tiempoRelativo devuelve una fecha, así que tiene que aparecer el "el".
const viejo = textoReencuentro(hace(120 * DIA))
assert.ok(viejo.startsWith('volvió el '), `pasado un mes falta el "el": "${viejo}"`)
assert.ok(!/volvió el (hace|ayer)/.test(viejo), `"el" mal puesto: "${viejo}"`)
ok++

// Sin fecha no inventamos nada: la tarjeta cae a la fecha de publicación.
assert.strictEqual(textoReencuentro(null), '', 'null tiene que dar vacío')
assert.strictEqual(textoReencuentro(undefined), '', 'undefined tiene que dar vacío')
assert.strictEqual(textoReencuentro('cualquier cosa'), '', 'una fecha inválida tiene que dar vacío')
ok += 3

console.log(`✓ ${ok} casos de textoReencuentro OK`)
