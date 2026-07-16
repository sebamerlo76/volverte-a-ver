// Genera una imagen (flyer) del aviso para compartir en WhatsApp/Facebook.
// 100% en el navegador con <canvas> — sin librerías ni servidor.
import { nombreMostrado } from './formato.js'
import { ubicacionTexto } from './localidades.js'
import { textoEstado, textoTipo } from './estados.js'
import QRCode from 'qrcode'

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
  const estadoColor = resuelto ? '#e0a300' : perdido ? '#ff5747' : r.enCustodia ? '#1f9d8f' : '#2f7fed'
  const estadoTxt = textoEstado(r).toUpperCase()

  // ---- Foto (modo "contain": nunca recorta; se ve entera, centrada, y el fondo
  // crema rellena lo que sobra. Sirve igual para fotos verticales de celular que
  // para flyers ya armados que la gente sube como foto). ----
  const fotoSrc = (r.fotos && r.fotos[0]) || r.foto
  const foto = await cargarImagen(fotoSrc, true)
  const px = 48
  const py = 48
  const maxW = W - 96 // 984
  const maxH = 720 // alto máximo de la foto (deja lugar para el contenido)
  let pw = maxW
  let ph = 632
  let fx = px // x de la foto (se centra si queda más angosta que el recuadro)
  if (foto) {
    const ir = foto.width / foto.height
    pw = maxW
    ph = Math.round(pw / ir)
    if (ph > maxH) {
      ph = maxH
      pw = Math.round(ph * ir)
    }
    fx = Math.round(px + (maxW - pw) / 2)
    ctx.save()
    roundRect(ctx, fx, py, pw, ph, 36)
    ctx.clip()
    ctx.drawImage(foto, fx, py, pw, ph) // entera, sin recorte
    ctx.restore()
  } else {
    ctx.fillStyle = '#e7eaed'
    roundRect(ctx, px, py, maxW, ph, 36)
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
  const bx = fx + 28
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
  ctx.fillText(ubicacionTexto(r.localidad, r.zona), 48, y)
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

  // ---- Pie: logo + chicho.ar + QR del aviso ----
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

  // QR al link directo del aviso (para que quien vea la imagen llegue al aviso).
  const link = r.id ? `https://chicho.ar/r/${r.id}` : 'https://chicho.ar'
  try {
    const qrData = await QRCode.toDataURL(link, { margin: 1, width: 150, color: { dark: NAVY, light: '#ffffff' } })
    const qrImg = await cargarImagen(qrData, false)
    if (qrImg) {
      const qs = 146
      const qx = W - 48 - qs
      const qy = footY - 22
      ctx.fillStyle = '#fff'
      roundRect(ctx, qx - 8, qy - 8, qs + 16, qs + 16, 14)
      ctx.fill()
      ctx.drawImage(qrImg, qx, qy, qs, qs)
      ctx.fillStyle = MUTED
      ctx.font = '800 22px Nunito, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Escaneá el aviso', qx + qs / 2, qy + qs + 26)
      ctx.textAlign = 'left'
    }
  } catch (e) {
    /* si el QR falla, el flyer sale igual sin él */
  }

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('sin blob'))), 'image/png')
  })
}

// Genera el flyer y abre el menú de compartir (o lo descarga si no se puede).
export async function compartirFlyer(r, onToast) {
  try {
    const estado = r.estado === 'resuelto' ? 'apareció' : textoTipo(r.tipo, r.enCustodia)
    const link = r.id ? `https://chicho.ar/r/${r.id}` : 'https://chicho.ar'
    const texto = `${nombreMostrado(r)} — ${estado} en ${ubicacionTexto(r.localidad, r.zona)}. Mirá y ayudá 🐾\n${link}`

    // Copiamos el texto+link PRIMERO, antes de generar la imagen. Es clave que sea
    // acá: writeText necesita el "permiso del toque" (la activación transitoria), y
    // si copiáramos después de generarFlyer (canvas + QR, tarda) esa activación ya
    // venció y el navegador pide permiso de portapapeles — un cartel de Android que
    // encima dice "ver el texto copiado", alarmante, cuando sólo estamos escribiendo.
    // Acá arriba la activación está fresca, igual que los otros "Copiar link" de la
    // app, que nunca pidieron permiso. Es la red para Facebook: sus grupos descartan
    // el texto cuando va una imagen adjunta, así que el que comparte lo pega a mano.
    try {
      await navigator.clipboard?.writeText(texto)
    } catch (e) {
      /* sin portapapeles: seguimos igual, la imagen se comparte lo mismo */
    }

    onToast?.('Generando imagen…')
    const blob = await generarFlyer(r)
    const file = new File([blob], `chicho-${r.id || 'aviso'}.png`, { type: 'image/png' })
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
