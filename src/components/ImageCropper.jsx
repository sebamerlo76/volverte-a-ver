import { useEffect, useRef, useState } from 'react'

// Encuadre de foto: cuadrado, con arrastrar (pan) + zoom. Sin librerías.
// Devuelve un Blob JPEG recortado (1080x1080).
const SALIDA = 1080

export default function ImageCropper({ file, onConfirm, onCancel }) {
  const [src, setSrc] = useState('')
  const [nat, setNat] = useState({ w: 0, h: 0 })
  const [z, setZ] = useState(1) // zoom (>= 1)
  const [pos, setPos] = useState({ x: 0, y: 0 }) // pan en px de pantalla
  const [frame, setFrame] = useState(300) // lado del marco cuadrado en px
  const marcoRef = useRef(null)
  const drag = useRef(null)
  const imgRef = useRef(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    function medir() {
      if (marcoRef.current) setFrame(marcoRef.current.clientWidth)
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  // Escala base para que la imagen "cubra" el marco a z=1.
  const coverScale = nat.w && nat.h ? frame / Math.min(nat.w, nat.h) : 1
  const dispW = nat.w * coverScale * z
  const dispH = nat.h * coverScale * z

  // Limita el pan para que la imagen siempre cubra el marco.
  function clamp(p) {
    const maxX = Math.max(0, (dispW - frame) / 2)
    const maxY = Math.max(0, (dispH - frame) / 2)
    return { x: Math.max(-maxX, Math.min(maxX, p.x)), y: Math.max(-maxY, Math.min(maxY, p.y)) }
  }

  useEffect(() => {
    setPos((p) => clamp(p))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [z, frame, nat.w, nat.h])

  function onImgLoad(e) {
    setNat({ w: e.target.naturalWidth, h: e.target.naturalHeight })
    setPos({ x: 0, y: 0 })
    setZ(1)
  }

  function onDown(e) {
    const pt = e.touches ? e.touches[0] : e
    drag.current = { sx: pt.clientX, sy: pt.clientY, ox: pos.x, oy: pos.y }
  }
  function onMove(e) {
    if (!drag.current) return
    const pt = e.touches ? e.touches[0] : e
    setPos(clamp({ x: drag.current.ox + (pt.clientX - drag.current.sx), y: drag.current.oy + (pt.clientY - drag.current.sy) }))
  }
  function onUp() {
    drag.current = null
  }

  function confirmar() {
    const img = imgRef.current
    if (!img || !nat.w) return
    // El marco (0..frame) mapea a un cuadrado en coordenadas de la imagen fuente.
    const srcPerDisp = nat.w / dispW
    const cropDispX = dispW / 2 - frame / 2 - pos.x
    const cropDispY = dispH / 2 - frame / 2 - pos.y
    const sx = cropDispX * srcPerDisp
    const sy = cropDispY * srcPerDisp
    const sSize = frame * srcPerDisp

    const canvas = document.createElement('canvas')
    canvas.width = SALIDA
    canvas.height = SALIDA
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, SALIDA, SALIDA)
    canvas.toBlob((blob) => blob && onConfirm(blob), 'image/jpeg', 0.9)
  }

  return (
    <div className="crop-overlay">
      <div className="crop-card">
        <div className="crop-titulo">Encuadrá la foto</div>
        <div className="crop-sub">Arrastrá y usá el zoom para elegir qué parte se ve.</div>

        <div
          className="crop-marco"
          ref={marcoRef}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        >
          {src ? (
            <img
              ref={imgRef}
              src={src}
              alt=""
              onLoad={onImgLoad}
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: dispW ? dispW + 'px' : 'auto',
                height: dispH ? dispH + 'px' : 'auto',
                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px)`,
                userSelect: 'none',
                touchAction: 'none',
              }}
            />
          ) : null}
        </div>

        <div className="crop-zoom">
          <span className="mi" style={{ fontSize: 19, color: 'var(--muted)' }}>
            zoom_out
          </span>
          <input type="range" min="1" max="3" step="0.01" value={z} onChange={(e) => setZ(parseFloat(e.target.value))} />
          <span className="mi" style={{ fontSize: 19, color: 'var(--muted)' }}>
            zoom_in
          </span>
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
