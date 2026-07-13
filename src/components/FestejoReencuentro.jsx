import { nombreMostrado } from '../lib/formato.js'

// Cartelito que aparece al marcar un aviso como "volvió a casa": festeja e invita
// a compartir la buena noticia (prueba social + anima a otras familias).
export default function FestejoReencuentro({ r, onCompartir, onCerrar }) {
  if (!r) return null
  return (
    <div className="festejo-ov" onClick={onCerrar}>
      <div className="festejo-box" onClick={(e) => e.stopPropagation()}>
        <div className="festejo-emoji">🎉</div>
        <div className="festejo-t">¡{nombreMostrado(r)} volvió a casa!</div>
        <div className="festejo-s">
          Qué alegría 🐾 ¿Compartís la buena noticia? Anima a otras familias a no bajar los brazos.
        </div>
        <button className="festejo-btn" onClick={onCompartir}>
          <span className="mi fill" style={{ fontSize: 22 }}>
            ios_share
          </span>
          Compartir el reencuentro
        </button>
        <button className="festejo-cerrar" onClick={onCerrar}>
          Ahora no
        </button>
      </div>
    </div>
  )
}
