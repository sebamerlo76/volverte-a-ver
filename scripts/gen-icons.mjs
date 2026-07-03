// Genera los íconos PWA a partir del logo de Chicho (public/logo.png).
// Uso: node scripts/gen-icons.mjs
import sharp from 'sharp'

const CREMA = { r: 252, g: 238, b: 214, alpha: 1 } // #fceed6, fondo del logo

async function gen(size, salida) {
  await sharp('public/logo.png')
    .resize(size, size, { fit: 'contain', background: CREMA })
    .flatten({ background: CREMA })
    .png()
    .toFile(salida)
}

await gen(512, 'public/icon-512.png')
await gen(192, 'public/icon-192.png')
await gen(180, 'public/apple-touch-icon.png')
console.log('Íconos PWA generados desde public/logo.png')
