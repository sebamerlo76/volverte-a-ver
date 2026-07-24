// api/og.js — Preview rico del aviso en redes (Facebook, WhatsApp, etc.).
//
// Chicho es una SPA: el crawler de Facebook/WhatsApp NO ejecuta JS, así que sin
// esto todo link /r/<id> muestra la tarjeta genérica del sitio (el ícono, no la
// mascota). Esta function intercepta /r/<id> (ver el rewrite en vercel.json), lee
// el aviso de Supabase y reescribe los tags OG del index.html con la foto y los
// datos de ESA mascota.
//
// La persona igual recibe la SPA completa (el <script> sigue en el HTML) y el
// deep-link abre el aviso como siempre (App.jsx). No detectamos bots por
// User-Agent: todos reciben el mismo HTML y cada uno usa lo que necesita.
//
// Sin secretos nuevos: usa la anon key, la misma que ya viaja en el bundle del
// cliente. Si algo falla (env ausente, Supabase caído, aviso inexistente), sirve
// el shell sin tocar → la página nunca se rompe (falla al genérico, no en blanco).

const SUPA_URL = process.env.VITE_SUPABASE_URL
const SUPA_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SITIO = 'https://chicho.ar'

// El index.html construido es inmutable por deploy: lo cacheamos por la vida del
// lambda (se refresca solo en el próximo deploy, que estrena lambda).
let shellCache = null

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Reemplaza el content="" de un <meta> puntual. Usa función de reemplazo para no
// interpretar los $ del valor. Si el tag no está, devuelve el html igual.
function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, 'i')
  return html.replace(re, (m, a, b) => a + value + b)
}

// Nombre a mostrar (réplica de formato.js nombreMostrado; no se puede importar de
// src/ acá, mismo criterio que las Edge Functions que duplican helpers).
function nombreMostrado(r) {
  if (r.nombre) return r.nombre
  const hembra = r.sexo === 'Hembra'
  if (r.especie === 'gato') return hembra ? 'Gatita sin nombre' : 'Gato sin nombre'
  if (r.especie === 'otro') return 'Mascota sin nombre'
  return hembra ? 'Perrita sin nombre' : 'Perro sin nombre'
}

function estadoTxt(r) {
  if (r.estado === 'resuelto') return { emoji: '🎉', txt: 'Volvió a casa' }
  if (r.tipo === 'perdido') return { emoji: '🔴', txt: 'Perdido' }
  return { emoji: '🔵', txt: r.en_custodia ? 'En tránsito' : 'Visto' }
}

function lugarTexto(r) {
  return [r.zona, r.localidad]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(', ')
}

async function traerShell(host) {
  if (shellCache) return shellCache
  // /index.html es un archivo estático real (el rewrite catch-all sólo pega en
  // rutas que NO existen), así que esto trae el shell sin pasar por la function.
  const r = await fetch(`https://${host}/index.html`, { headers: { 'user-agent': 'chicho-og' } })
  if (!r.ok) throw new Error('shell ' + r.status)
  shellCache = await r.text()
  return shellCache
}

async function traerAviso(id) {
  if (!SUPA_URL || !SUPA_KEY) return null
  const cols = 'id,nombre,tipo,especie,estado,en_custodia,localidad,zona,foto,fotos,tamano,color,raza,sexo'
  const url =
    `${SUPA_URL}/rest/v1/reportes?id=eq.${encodeURIComponent(id)}` +
    `&oculto=eq.false&bloqueado=eq.false&select=${cols}&limit=1`
  const r = await fetch(url, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, Accept: 'application/json' },
  })
  if (!r.ok) throw new Error('supabase ' + r.status)
  const filas = await r.json()
  return Array.isArray(filas) && filas.length ? filas[0] : null
}

export default async function handler(req, res) {
  const host = req.headers.host || 'chicho.ar'
  const id = String(req.query.id || '')

  let shell
  try {
    shell = await traerShell(host)
  } catch (e) {
    // Sin shell no podemos bootear la SPA (su <script> está hasheado adentro). Es
    // casi imposible (es un estático). Mandamos al feed — '/' cae al catch-all,
    // no vuelve a esta function, así que no hay loop.
    console.error('[og] no se pudo traer el shell:', e)
    res.setHeader('Location', '/')
    res.status(302).end()
    return
  }

  // id inválido → shell genérico (nunca metemos algo raro en la query REST).
  if (!/^[\w-]{1,64}$/.test(id)) return servir(res, shell)

  let r = null
  try {
    r = await traerAviso(id)
  } catch (e) {
    console.error('[og] no se pudo leer el aviso', id, e) // grita en los logs, no rompe
  }
  if (!r) return servir(res, shell) // no existe / oculto / error → OG genérico

  return servir(res, enriquecer(shell, r, id))
}

// Reescribe los tags OG/Twitter/title del shell con los datos del aviso. Exportada
// aparte para poder testear el reemplazo sin levantar la function (test/og.test.mjs).
export function enriquecer(shell, r, id) {
  const { emoji, txt } = estadoTxt(r)
  const lugar = lugarTexto(r)
  const rasgos = [r.tamano, r.color, r.raza]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(' · ')
  const foto = r.foto || (Array.isArray(r.fotos) && r.fotos[0]) || `${SITIO}/icon-512.png`

  const titulo = esc(`${emoji} ${txt} — ${nombreMostrado(r)}`)
  const cta =
    r.estado === 'resuelto'
      ? 'Un reencuentro más en Chicho 🏠'
      : r.tipo === 'perdido'
        ? 'Mirá el aviso y ayudá a que vuelva a casa 🐾'
        : 'Mirá el aviso y ayudá a encontrar a su familia 🐾'
  const detalle = [lugar, rasgos].filter(Boolean).join(' · ')
  const desc = esc(detalle ? `${detalle}. ${cta}` : cta)
  const urlAviso = esc(`${SITIO}/r/${id}`)
  const img = esc(foto)

  let html = shell
  html = html.replace(/<title>[^<]*<\/title>/i, () => `<title>${titulo}</title>`)
  html = setMeta(html, 'name', 'description', desc)
  html = setMeta(html, 'property', 'og:type', 'article')
  html = setMeta(html, 'property', 'og:title', titulo)
  html = setMeta(html, 'property', 'og:description', desc)
  html = setMeta(html, 'property', 'og:url', urlAviso)
  html = setMeta(html, 'property', 'og:image', img)
  // La foto tiene dimensiones desconocidas → sacamos las fijas (512x512) para que
  // Facebook no reserve un recuadro cuadrado y recorte mal.
  html = html.replace(/\s*<meta property="og:image:(?:width|height)"[^>]*>/gi, '')
  html = setMeta(html, 'name', 'twitter:card', 'summary_large_image')
  html = setMeta(html, 'name', 'twitter:title', titulo)
  html = setMeta(html, 'name', 'twitter:description', desc)
  html = setMeta(html, 'name', 'twitter:image', img)
  return html
}

function servir(res, html) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // El CDN cachea 10 min y sirve stale mientras revalida: Facebook y las visitas
  // repetidas al mismo aviso lo reciben del edge, sin re-ejecutar la function.
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400')
  res.status(200).send(html)
}
