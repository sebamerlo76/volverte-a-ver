// Casos reales de cómo la gente escribe su WhatsApp. Correr con:
//   node test/numero-wa.test.mjs
import { numeroWa } from '../src/lib/formato.js'
const OK = '5493434054998'
const casos = [
  ['343 405 4998', OK, 'como pide el placeholder'],
  ['3434054998', OK, 'sin espacios'],
  ['+54 9 343 405 4998', OK, 'copiado de WhatsApp (el bug de hoy)'],
  ['5493434054998', OK, 'todo junto con pais'],
  ['54 343 405 4998', OK, 'pais sin el 9'],
  ['0343 15 405 4998', OK, 'como se marca desde un fijo'],
  ['0343154054998', OK, 'idem sin espacios'],
  ['(0343) 15-4054998', OK, 'con parentesis y guion'],
  ['00549 343 4054998', OK, 'prefijo internacional 00'],
  ['11 5555 4444', '5491155554444', 'Buenos Aires (area 2)'],
  ['', '', 'vacio'],
  ['no tengo', '', 'texto sin numeros'],
]
let fallos = 0
for (const [entrada, esperado, desc] of casos) {
  const r = numeroWa(entrada)
  const ok = r === esperado
  if (!ok) fallos++
  console.log(`${ok ? 'ok   ' : 'FALLA'} ${JSON.stringify(entrada).padEnd(22)} → ${r || '(vacio)'}  ${ok ? '' : '(esperaba ' + esperado + ')'}  · ${desc}`)
}
console.log(fallos === 0 ? '\nTodos los casos OK' : `\n${fallos} fallo(s)`)
process.exit(fallos ? 1 : 0)
