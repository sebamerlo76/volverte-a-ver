import { nombreMostrado, tiempoRelativo } from '../lib/formato.js'
import { ubicacionTexto } from '../lib/localidades.js'
import { badgeEstado, subLinea } from '../lib/estados.js'

export default function PetCard({ r, onClick, prioridad = false }) {
  const perdido = r.tipo === 'perdido'
  const resuelto = r.estado === 'resuelto'
  const clr = perdido ? '#ff6b5e' : '#2f7fed'
  return (
    <button className="card" onClick={onClick}>
      <div className={'ci' + (perdido ? '' : ' g')}>
        {r.foto ? (
          <img
            src={r.foto}
            alt={nombreMostrado(r)}
            // La 1ª tarjeta es casi siempre el LCP: la priorizamos. El resto,
            // lazy (así no compiten por ancho de banda con la primera foto).
            loading={prioridad ? 'eager' : 'lazy'}
            fetchPriority={prioridad ? 'high' : 'auto'}
            decoding="async"
            onError={(e) => (e.target.style.display = 'none')}
          />
        ) : (
          <span className="ph-pet mi fill" style={{ fontSize: 52 }}>
            pets
          </span>
        )}
        {(() => {
          const b = badgeEstado(r)
          return (
            <span className={'badge ' + b.clase}>
              <span className={'mi' + (b.fill ? ' fill' : '')} style={{ fontSize: 16 }}>
                {b.icono}
              </span>
              {b.t}
            </span>
          )
        })()}
        <span className="time">{tiempoRelativo(r.creadoEn)}</span>
      </div>
      <div className="cbody">
        <div className="cname">{nombreMostrado(r)}</div>
        {!resuelto && (
          <div className="cbusca" style={{ color: clr }}>
            <span className="mi fill" style={{ fontSize: 14 }}>
              {perdido ? 'search' : 'volunteer_activism'}
            </span>
            {subLinea(r)}
          </div>
        )}
        <div className="cmeta">
          <span className="mi" style={{ fontSize: 16, color: clr }}>
            location_on
          </span>
          {ubicacionTexto(r.localidad, r.zona)}
        </div>
        {(() => {
          const attrs = [r.tamano, r.color, r.raza, r.sexo && r.sexo !== 'No sé' ? r.sexo : null].filter(Boolean)
          if (!r.recompensa && !attrs.length) return null
          return (
            <div className="cfoot">
              {r.recompensa ? <span className="tag recompensa">💰 Recompensa</span> : null}
              {attrs.length ? <span className="cattrs">{attrs.join(' · ')}</span> : null}
            </div>
          )
        })()}
      </div>
    </button>
  )
}
