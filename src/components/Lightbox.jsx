import { useEffect, useRef, useState } from 'react'

// Foto(s) a pantalla completa. Vive en App para que el botón "atrás" del celu la
// cierre (vuelve al aviso) en vez de cerrar toda la vista.
export default function Lightbox({ fotos, inicio = 0, onCerrar }) {
  const ref = useRef(null)
  const [activa, setActiva] = useState(inicio)

  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = inicio * ref.current.clientWidth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!fotos || !fotos.length) return null

  return (
    <div className="foto-lightbox" onClick={onCerrar}>
      <button className="lb-x" onClick={onCerrar} aria-label="Cerrar">
        <span className="mi" style={{ fontSize: 26 }}>
          close
        </span>
      </button>
      <div
        className="lb-carrusel"
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        onScroll={(e) => {
          const el = e.currentTarget
          const i = Math.round(el.scrollLeft / el.clientWidth)
          if (i !== activa) setActiva(i)
        }}
      >
        {fotos.map((u, i) => (
          <img key={i} src={u} alt="" />
        ))}
      </div>
      {fotos.length > 1 && (
        <div className="lb-dots">
          {fotos.map((_, i) => (
            <span key={i} className={'ddot' + (i === activa ? ' on' : '')} />
          ))}
        </div>
      )}
    </div>
  )
}
