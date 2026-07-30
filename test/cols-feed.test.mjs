// Las columnas del feed están en DOS lados: COLS_FEED (src/data/store.js) y el
// precargado de index.html, que pide el feed antes de que arranque React. Si se
// desincronizan, el feed podría quedar sin un dato y fallar mudo (una tarjeta sin
// zona, un aviso sin whatsapp). Este test las compara.
//   node test/cols-feed.test.mjs
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

// La del store (sin espacios, para comparar manzanas con manzanas)
const store = readFileSync(join(raiz, 'src/data/store.js'), 'utf8')
const mStore = store.match(/export const COLS_FEED\s*=\s*\n?\s*'([^']+)'/)
if (!mStore) {
  console.error('FALLA: no encontré COLS_FEED en src/data/store.js')
  process.exit(1)
}
const colsStore = mStore[1].split(',').map((c) => c.trim()).filter(Boolean)

// La del HTML
const html = readFileSync(join(raiz, 'index.html'), 'utf8')
const mHtml = html.match(/var cols\s*=\s*\n?\s*'([^']+)'/)
if (!mHtml) {
  console.error('FALLA: no encontré la lista de columnas del precargado en index.html')
  process.exit(1)
}
const colsHtml = mHtml[1].split(',').map((c) => c.trim()).filter(Boolean)

const faltanEnHtml = colsStore.filter((c) => !colsHtml.includes(c))
const sobranEnHtml = colsHtml.filter((c) => !colsStore.includes(c))

console.log(`store.js: ${colsStore.length} columnas · index.html: ${colsHtml.length} columnas`)
if (faltanEnHtml.length) console.error('FALTAN en index.html:', faltanEnHtml.join(', '))
if (sobranEnHtml.length) console.error('SOBRAN en index.html:', sobranEnHtml.join(', '))

if (faltanEnHtml.length || sobranEnHtml.length) {
  console.error('\nLas dos listas tienen que coincidir (ver el comentario en ambos archivos).')
  process.exit(1)
}
console.log('OK: las dos listas coinciden')
