// Genera los íconos PWA desde public/logo.png, con MARGEN (zona segura) para que
// Android no recorte el logo al aplicar la máscara (maskable). El logo va al ~72%
// del cuadrado, centrado sobre la crema.
// Uso: node scripts/gen-icons.mjs
import sharp from 'sharp'

const CREMA = { r: 252, g: 238, b: 214, alpha: 1 } // #fceed6
const ESCALA = 0.72 // el logo ocupa el 72% → 14% de margen a cada lado

async function gen(size, salida) {
  const inner = Math.round(size * ESCALA)
  const logo = await sharp('public/logo.png')
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: CREMA } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(salida)
}

await gen(512, 'public/icon-512.png')
await gen(192, 'public/icon-192.png')
await gen(180, 'public/apple-touch-icon.png')
console.log('Íconos PWA generados con margen (safe zone para maskable)')
