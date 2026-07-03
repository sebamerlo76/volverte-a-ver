// Genera una imagen (flyer) del aviso para compartir en WhatsApp/Facebook.
// 100% en el navegador con <canvas> — sin librerías ni servidor.
import { nombreMostrado } from './formato.js'

const NAVY = '#1f3852'
const CREMA = '#faf7f1'
const MUTED = '#647a86'
const ESPECIE_LBL = { perro: 'Perro', gato: 'Gato', otro: 'Otro' }

function cargarImagen(src, crossOrigin) {
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Dibuja la imagen recortada tipo "cover" dentro de un rect redondeado.
function drawCover(ctx, img, x, y, w, h, r) {
  const ir = img.width / img.height
  const dr = w / h
  let sw, sh, sx, sy
  if (ir > dr) {
    sh = img.height
    sw = sh * dr
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    sw = img.width
    sh = sw / dr
    sx = 0
    sy = (img.height - sh) / 2
  }
  ctx.save()
  roundRect(ctx, x, y, w, h, r)
  ctx.clip()
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
  ctx.restore()
}

function wrap(ctx, text, maxW, maxLines) {
  const words = String(text || '').split(/\s+/)
  const lines = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur)
      cur = w
      if (lines.length >= maxLines) break
    } else {
      cur = test
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur)
  const last = lines[lines.length - 1]
  if (lines.length === maxLines && last && ctx.measureText(last).width > maxW) {
    let l = last
    while (l.length && ctx.measureText(l + '…').width > maxW) l = l.slice(0, -1)
    lines[lines.length - 1] = l + '…'
  }
  return lines
}

export async function generarFlyer(r) {
  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  try {
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('600 80px Fredoka'),
        document.fonts.load('800 36px Nunito'),
        document.fonts.load('900 34px Nunito'),
      ])
      await document.fonts.ready
    }
  } catch (e) {
    /* si falla, se dibuja con la fuente de respaldo */
  }

  ctx.fillStyle = CREMA
  ctx.fillRect(0, 0, W, H)

  const resuelto = r.estado === 'resuelto'
  const perdido = r.tipo === 'perdido'
  const estadoColor = resuelto ? '#e0a300' : perdido ? '#ff5747' : '#17a06b'
  const estadoTxt = resuelto ? 'EN CASA' : perdido ? 'PERDIDO' : 'ENCONTRADO'

  // ---- Foto ----
  const fotoSrc = (r.fotos && r.fotos[0]) || r.foto
  const foto = await cargarImagen(fotoSrc, true)
  const px = 48
  const py = 48
  const pw = W - 96
  const ph = 632
  if (foto) {
    drawCover(ctx, foto, px, py, pw, ph, 36)
  } else {
    ctx.fillStyle = '#e7eaed'
    roundRect(ctx, px, py, pw, ph, 36)
    ctx.fill()
    ctx.fillStyle = '#b9c4cc'
    ctx.textAlign = 'center'
    ctx.font = '220px sans-serif'
    ctx.fillText('🐾', W / 2, py + ph / 2 + 80)
    ctx.textAlign = 'left'
  }

  // ---- Badge de estado sobre la foto ----
  ctx.font = '800 44px Nunito, sans-serif'
  const btw = ctx.measureText(estadoTxt).width
  const bx = px + 28
  const by = py + 28
  const bh = 74
  const bpad = 30
  ctx.fillStyle = estadoColor
  roundRect(ctx, bx, by, btw + bpad * 2, bh, 18)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(estadoTxt, bx + bpad, by + bh / 2 + 2)
  ctx.textBaseline = 'alphabetic'

  // ---- Contenido ----
  let y = py + ph + 96
  ctx.fillStyle = NAVY
  ctx.font = '600 80px Fredoka, sans-serif'
  ctx.fillText(nombreMostrado(r), 48, y)
  y += 58

  ctx.fillStyle = MUTED
  ctx.font = '800 36px Nunito, sans-serif'
  ctx.fillText(`${r.zona || ''}${r.localidad ? ' · ' + r.localidad : ''}`, 48, y)
  y += 66

  // Tags (chips)
  const tags = [
    ESPECIE_LBL[r.especie] || 'Otro',
    r.raza,
    r.color,
    r.tamano,
    r.sexo && r.sexo !== 'No sé' ? r.sexo : null,
    r.collar && r.collar !== 'No sé' ? r.collar : null,
  ].filter(Boolean)
  ctx.font = '800 32px Nunito, sans-serif'
  let tx = 48
  for (const t of tags) {
    const tw = ctx.measureText(t).width
    if (tx + tw + 56 > W - 48) break
    ctx.fillStyle = '#eef2f6'
    roundRect(ctx, tx, y - 44, tw + 40, 60, 14)
    ctx.fill()
    ctx.fillStyle = NAVY
    ctx.fillText(t, tx + 20, y)
    tx += tw + 56
  }
  y += 80

  if (r.recompensa) {
    ctx.fillStyle = '#fff3d6'
    roundRect(ctx, 48, y - 46, W - 96, 70, 14)
    ctx.fill()
    ctx.fillStyle = '#a97400'
    ctx.font = '900 34px Nunito, sans-serif'
    ctx.fillText(`💰 Recompensa: ${r.recompensa}`, 74, y)
    y += 92
  }

  if (r.descripcion) {
    ctx.fillStyle = '#3e5367'
    ctx.font = '700 36px Nunito, sans-serif'
    const limiteY = H - 200 // no invadir el pie
    for (const l of wrap(ctx, r.descripcion, W - 96, 3)) {
      if (y > limiteY) break
      ctx.fillText(l, 48, y)
      y += 50
    }
  }

  // ---- Pie: logo + chicho.ar ----
  const logo = await cargarImagen('/logo.png', false)
  const footY = H - 150
  ctx.strokeStyle = '#e7ded1'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(48, footY - 34)
  ctx.lineTo(W - 48, footY - 34)
  ctx.stroke()
  if (logo) ctx.drawImage(logo, 44, footY - 8, 100, 100)
  ctx.fillStyle = NAVY
  ctx.font = '600 48px Fredoka, sans-serif'
  ctx.fillText('chicho.ar', 160, footY + 42)
  ctx.fillStyle = MUTED
  ctx.font = '800 30px Nunito, sans-serif'
  ctx.fillText('Buscá y reportá mascotas perdidas', 160, footY + 84)

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('sin blob'))), 'image/png')
  })
}

// Genera el flyer y abre el menú de compartir (o lo descarga si no se puede).
export async function compartirFlyer(r, onToast) {
  try {
    onToast?.('Generando imagen…')
    const blob = await generarFlyer(r)
    const file = new File([blob], `chicho-${r.id || 'aviso'}.png`, { type: 'image/png' })
    const estado = r.estado === 'resuelto' ? 'apareció' : r.tipo === 'perdido' ? 'PERDIDO' : 'ENCONTRADO'
    const texto = `${nombreMostrado(r)} — ${estado} en ${r.zona || ''}, ${r.localidad || 'Paraná'}. Mirá y ayudá en chicho.ar 🐾`
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Chicho', text: texto })
        return
      } catch (e) {
        if (e && e.name === 'AbortError') return // el usuario canceló
        // si falló por otra razón, caemos a descargar
      }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    onToast?.('📷 Imagen descargada — compartila en tus grupos')
  } catch (e) {
    console.error('flyer', e)
    onToast?.('No se pudo generar la imagen 😕')
  }
}
