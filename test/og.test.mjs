// Test del enriquecido OG de api/og.js. No necesita framework: corré
//   npm run build   (para tener dist/index.html)
//   node test/og.test.mjs
// Chequea que los tags OG salgan bien, que el nombre se escape (anti-XSS) y que el
// <script> de la app siga en el HTML (la SPA tiene que bootear igual para la gente).
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { enriquecer } from '../api/og.js'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const shell = readFileSync(join(raiz, 'dist/index.html'), 'utf8')

let fallos = 0
function ok(cond, msg) {
  console.log(`  ${cond ? 'ok  ' : 'FALLA'} ${msg}`)
  if (!cond) fallos++
}
function contenido(html, re) {
  const m = html.match(re)
  return m ? m[1] : null
}
const ogTitle = (h) => contenido(h, /property="og:title" content="([^"]*)"/)
const ogDesc = (h) => contenido(h, /property="og:description" content="([^"]*)"/)
const ogImg = (h) => contenido(h, /property="og:image" content="([^"]*)"/)
const twCard = (h) => contenido(h, /name="twitter:card" content="([^"]*)"/)
const tieneApp = (h) => /<script[^>]*src="[^"]*index-[^"]*\.js"/.test(h)

console.log('Perdido con foto y rasgos:')
let h = enriquecer(shell, {
  nombre: 'Firulais', tipo: 'perdido', especie: 'perro', estado: 'activo',
  localidad: 'Paraná', zona: 'Centro', tamano: 'Mediano', color: 'Marrón', raza: 'Galgo',
  foto: 'https://x.supabase.co/storage/v1/object/public/fotos/abc.jpg',
}, 'aviso-123')
ok(ogTitle(h) === '🔴 Perdido — Firulais', 'og:title')
ok(/Centro, Paraná · Mediano · Marrón · Galgo/.test(ogDesc(h)), 'og:description con lugar y rasgos')
ok(ogImg(h) === 'https://x.supabase.co/storage/v1/object/public/fotos/abc.jpg', 'og:image = foto del aviso')
ok(twCard(h) === 'summary_large_image', 'twitter:card grande')
ok(!/og:image:width/.test(h), 'sin og:image:width fijo')
ok(tieneApp(h), 'el script de la app sigue presente')

console.log('Nombre con intento de XSS + sin foto (usa fotos[0]):')
h = enriquecer(shell, {
  nombre: '"><script>alert(1)</script>', tipo: 'encontrado', especie: 'gato', estado: 'activo',
  en_custodia: true, localidad: 'Oro Verde', zona: '', foto: '',
  fotos: ['https://x.supabase.co/storage/v1/object/public/fotos/x.jpg'],
}, 'aviso-xss')
ok(!/<script>alert\(1\)<\/script>/.test(h), 'el nombre malicioso quedó escapado (no inyecta)')
ok(/En tránsito/.test(ogTitle(h)), 'estado "En tránsito" (encontrado + en custodia)')
ok(ogImg(h).endsWith('/x.jpg'), 'og:image cae a fotos[0] cuando foto está vacío')

console.log('Resuelto, sin nombre ni foto:')
h = enriquecer(shell, {
  nombre: '', tipo: 'perdido', especie: 'perro', sexo: 'Hembra', estado: 'resuelto',
  localidad: 'Paraná', zona: '', foto: '', fotos: [],
}, 'aviso-ok')
ok(ogTitle(h) === '🎉 Volvió a casa — Perrita sin nombre', 'og:title con fallback de nombre')
ok(ogImg(h) === 'https://chicho.ar/icon-512.png', 'og:image cae al icono por defecto')

console.log(fallos === 0 ? '\nTodo OK' : `\n${fallos} fallo(s)`)
process.exit(fallos === 0 ? 0 : 1)
