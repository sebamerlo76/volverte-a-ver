// Genera el "gráfico de funciones" de Google Play (banner 1024x500 de la ficha)
// desde public/logo.png, con la paleta de la marca. Sin nombrar ciudades: Chicho
// está en varias provincias ("en tu zona").
// Uso: node scripts/gen-banner-play.mjs [salida.png]
import sharp from 'sharp'

const W = 1024, H = 500
const NAVY = '#1f3852'
const CORAL = '#ff6b5e'
const CREMA = '#faf7f1'
const SALIDA = process.argv[2] || 'banner-play-1024x500.png'

const logoSize = 330
const logo = await sharp('public/logo.png')
  .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()

// Texto como SVG (librsvg usa fuentes del sistema; Segoe UI viene con Windows y es
// redondeada, en el espíritu Fredoka/Nunito de la marca).
const svg = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="470" y="235" font-family="Segoe UI, Arial, sans-serif" font-weight="800"
        font-size="120" fill="#ffffff">Chicho</text>
  <text x="474" y="298" font-family="Segoe UI, Arial, sans-serif" font-weight="700"
        font-size="32" fill="${CORAL}">Mascotas perdidas y encontradas</text>
  <text x="474" y="352" font-family="Segoe UI, Arial, sans-serif" font-weight="600"
        font-size="30" fill="${CREMA}" opacity="0.85">En tu zona · gratis</text>
</svg>`)

await sharp({ create: { width: W, height: H, channels: 4, background: NAVY } })
  .composite([
    { input: logo, left: 95, top: Math.round((H - logoSize) / 2) },
    { input: svg, left: 0, top: 0 },
  ])
  .png()
  .toFile(SALIDA)

console.log('Banner generado:', SALIDA)
