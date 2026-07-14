import { useEffect, useRef, useState } from 'react'

// Encuadre para el FEED. La foto se publica COMPLETA (para el detalle); acá el
// usuario elige qué franja horizontal se muestra en el feed (mismo formato que
// la tarjeta). Devuelve { full, thumb }: la imagen entera + el recorte del feed.
const RATIO = 2 // feed 2:1 (ancho:alto)
const THUMB_W = 800 // recorte del feed: la tarjeta se ve a ~360px, con 800 alcanza y pesa menos (LCP)
const FULL_MAX = 1440

export default function ImageCropper({ file, onConfirm, onCancel }) {
  const [src, setSrc] = useState('')
  const [nat, setNat] = useState({ w: 0, h: 0 })
  const [disp, setDisp] = useState({ w: 0, h: 0 }) // tamaño mostrado (contain)
  const [bandY, setBandY] = useState(0) // offset vertical de la banda (px display)
  const wrapRef = useRef(null)
  const imgRef = useRef(null)
  const drag = useRef(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Imagen más ancha que 2:1 → entra casi entera; si no, la banda es una franja.
  const wide = nat.w && nat.h ? nat.w / nat.h >= RATIO : false
  const bandW = wide ? disp.h * RATIO : disp.w
  const bandH = wide ? disp.h : disp.w / RATIO
  const bandX = (disp.w - bandW) / 2
  const maxBandY = Math.max(0, disp.h - bandH)

  function medir() {
    const wrap = wrapRef.current
    if (!wrap || !nat.w) return
    const scale = Math.min(wrap.clientWidth / nat.w, wrap.clientHeight / nat.h)
    setDisp({ w: nat.w * scale, h: nat.h * scale })
  }
  useEffect(() => {
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nat])

  // Al conocer el tamaño mostrado, centro la banda.
  useEffect(() => {
    setBandY(Math.max(0, (disp.h - bandH) / 2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disp.h])

  function onImgLoad(e) {
    setNat({ w: e.target.naturalWidth, h: e.target.naturalHeight })
  }

  function onDown(e) {
    const pt = e.touches ? e.touches[0] : e
    drag.current = { sy: pt.clientY, oy: bandY }
  }
  function onMove(e) {
    if (!drag.current) return
    const pt = e.touches ? e.touches[0] : e
    const y = drag.current.oy + (pt.clientY - drag.current.sy)
    setBandY(Math.max(0, Math.min(maxBandY, y)))
  }
  function onUp() {
    drag.current = null
  }

  function confirmar() {
    const img = imgRef.current
    if (!img || !nat.w) return
    const d2n = nat.h / disp.h // px mostrados → px fuente (escala uniforme)

    // Región de la banda en coordenadas de la imagen fuente.
    const sY = wide ? 0 : bandY * d2n
    const sH = wide ? nat.h : bandH * d2n
    const sW = wide ? nat.h * RATIO : nat.w
    const sX = wide ? (nat.w - sW) / 2 : 0

    // Recorte del feed (2:1)
    const tW = THUMB_W
    const tH = Math.round(THUMB_W / RATIO)
    const c1 = document.createElement('canvas')
    c1.width = tW
    c1.height = tH
    c1.getContext('2d').drawImage(img, sX, sY, sW, sH, 0, 0, tW, tH)

    // Foto completa (lado mayor <= FULL_MAX)
    const fScale = Math.min(1, FULL_MAX / Math.max(nat.w, nat.h))
    const fW = Math.round(nat.w * fScale)
    const fH = Math.round(nat.h * fScale)
    const c2 = document.createElement('canvas')
    c2.width = fW
    c2.height = fH
    c2.getContext('2d').drawImage(img, 0, 0, fW, fH)

    c1.toBlob((thumb) => {
      c2.toBlob((full) => {
        if (thumb && full) onConfirm({ full, thumb })
      }, 'image/jpeg', 0.85)
    }, 'image/jpeg', 0.8) // el recorte del feed va un poco más comprimido (se ve chico)
  }

  return (
    <div className="crop-overlay">
      <div className="crop-card">
        <div className="crop-titulo">¿Qué se ve en el feed?</div>
        <div className="crop-sub">Movés el recuadro para elegir. La foto se publica completa 👇</div>

        <div className="crop-stage" ref={wrapRef}>
          {src ? (
            <div style={{ position: 'relative', width: disp.w || 'auto', height: disp.h || 'auto' }}>
              <img
                ref={imgRef}
                src={src}
                alt=""
                onLoad={onImgLoad}
                draggable={false}
                style={{ width: disp.w ? disp.w + 'px' : 'auto', height: disp.h ? disp.h + 'px' : 'auto', display: 'block', userSelect: 'none' }}
              />
              {disp.h ? (
                <div
                  className="crop-band"
                  style={{ left: bandX + 'px', top: bandY + 'px', width: bandW + 'px', height: bandH + 'px' }}
                  onMouseDown={onDown}
                  onMouseMove={onMove}
                  onMouseUp={onUp}
                  onMouseLeave={onUp}
                  onTouchStart={onDown}
                  onTouchMove={onMove}
                  onTouchEnd={onUp}
                >
                  <span className="crop-band-lbl">Feed</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="crop-acciones">
          <button className="crop-cancelar" onClick={onCancel}>
            Cancelar
          </button>
          <button className="crop-listo" onClick={confirmar}>
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
