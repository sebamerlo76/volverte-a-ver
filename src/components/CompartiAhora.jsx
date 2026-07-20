import { nombreMostrado } from '../lib/formato.js'

// Aparece apenas se publica un aviso: invita a compartirlo YA (difundir temprano es
// lo que más rápido lo encuentra). Reemplaza al viejo toast de "publicado". Si toca
// compartir, se marca (marcarCompartido) y el recordatorio de las 24 h no le llega.
export default function CompartiAhora({ r, onCompartir, onCerrar }) {
  if (!r) return null
  const perdido = r.tipo === 'perdido'
  return (
    <div className="festejo-ov" onClick={onCerrar}>
      <div className="festejo-box" onClick={(e) => e.stopPropagation()}>
        <div className="festejo-emoji">📣</div>
        <div className="festejo-t">¡Listo! Ya está publicado</div>
        <div className="festejo-s">
          {perdido
            ? `Compartí el aviso de ${nombreMostrado(r)} ahora mismo. Cuanta más gente lo vea, más rápido vuelve a casa. 🐾`
            : 'Compartí el aviso ahora mismo. Cuanta más gente lo vea, más rápido aparece la familia. 🐾'}
        </div>
        <button className="festejo-btn" onClick={onCompartir}>
          <span className="mi fill" style={{ fontSize: 22 }}>
            ios_share
          </span>
          Compartir ahora
        </button>
        <button className="festejo-cerrar" onClick={onCerrar}>
          Ahora no
        </button>
      </div>
    </div>
  )
}
