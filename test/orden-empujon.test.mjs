// Orden de "Perdidos que necesitan empujón" en el panel.
//
// Sebastián sube esos avisos a las historias de IG y necesita recorrerlos de arriba
// hacia abajo sin repetir ninguno. El orden es lo único de esa pantalla que se puede
// probar sin sesión de admin, y es justo donde un signo al revés pasa desapercibido:
// la lista igual se ve "ordenada", sólo que empezarías por los que ya subiste.
//
// Correr: node test/orden-empujon.test.mjs
import assert from 'node:assert'
import { ordenarEmpujon } from '../src/lib/empujon.js'

const nombres = (arr) => arr.map((x) => x.id).join(',')

// Caso principal: sin difundir primero, aunque sean más nuevos.
assert.strictEqual(
  nombres(
    ordenarEmpujon([
      { id: 'yaSubido', difusiones: 1, difundidoEn: '2026-08-01', creadoEn: '2026-07-01' },
      { id: 'virgen', difusiones: 0, creadoEn: '2026-07-20' },
    ])
  ),
  'virgen,yaSubido',
  'el que nunca se difundió tiene que ir arriba'
)

// Entre los ya difundidos: el que hace más que no se toca, primero.
assert.strictEqual(
  nombres(
    ordenarEmpujon([
      { id: 'ayer', difusiones: 1, difundidoEn: '2026-07-31', creadoEn: '2026-07-01' },
      { id: 'haceUnMes', difusiones: 3, difundidoEn: '2026-07-01', creadoEn: '2026-07-01' },
    ])
  ),
  'haceUnMes,ayer',
  'entre difundidos manda la fecha de difusión, no cuántas veces'
)

// Entre los vírgenes: el que lleva más tiempo perdido, primero.
assert.strictEqual(
  nombres(
    ordenarEmpujon([
      { id: 'reciente', difusiones: 0, creadoEn: '2026-07-25' },
      { id: 'viejo', difusiones: 0, creadoEn: '2026-06-01' },
    ])
  ),
  'viejo,reciente',
  'entre los que nunca se difundieron manda la antigüedad del aviso'
)

// Lista completa mezclada: los tres criterios a la vez.
assert.strictEqual(
  nombres(
    ordenarEmpujon([
      { id: 'd-ayer', difusiones: 2, difundidoEn: '2026-07-31', creadoEn: '2026-07-10' },
      { id: 'v-nuevo', difusiones: 0, creadoEn: '2026-07-25' },
      { id: 'd-viejo', difusiones: 1, difundidoEn: '2026-07-05', creadoEn: '2026-07-02' },
      { id: 'v-viejo', difusiones: 0, creadoEn: '2026-06-15' },
    ])
  ),
  'v-viejo,v-nuevo,d-viejo,d-ayer',
  'primero los sin difundir por antigüedad, después los difundidos por fecha'
)

// No romper con lo que puede venir de la base.
assert.deepStrictEqual(ordenarEmpujon(null), [], 'null (todavía cargando) tiene que dar lista vacía')
assert.deepStrictEqual(ordenarEmpujon([]), [], 'lista vacía')
assert.strictEqual(ordenarEmpujon([{ id: 'a' }, { id: 'b' }]).length, 2, 'sin campos de difusión no debe romper')

// No muta la lista original (React re-renderiza sobre el mismo array).
const original = [{ id: 'b', difusiones: 1, difundidoEn: '2026-07-31' }, { id: 'a', difusiones: 0 }]
ordenarEmpujon(original)
assert.strictEqual(original[0].id, 'b', 'ordenarEmpujon no puede mutar la lista que recibe')

console.log('✓ 7 casos de ordenarEmpujon OK')
