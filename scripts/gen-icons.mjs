// Genera los íconos PWA (patita blanca sobre coral) desde un SVG, con sharp.
// Uso: node scripts/gen-icons.mjs
import sharp from 'sharp'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#1f3852"/>
  <g fill="#fceed6">
    <ellipse cx="256" cy="320" rx="98" ry="80"/>
    <ellipse cx="146" cy="238" rx="40" ry="53"/>
    <ellipse cx="366" cy="238" rx="40" ry="53"/>
    <ellipse cx="205" cy="150" rx="37" ry="49"/>
    <ellipse cx="307" cy="150" rx="37" ry="49"/>
  </g>
</svg>`

const buf = Buffer.from(svg)
await sharp(buf).resize(512, 512).png().toFile('public/icon-512.png')
await sharp(buf).resize(192, 192).png().toFile('public/icon-192.png')
await sharp(buf).resize(180, 180).png().toFile('public/apple-touch-icon.png')
console.log('Íconos generados en public/')
