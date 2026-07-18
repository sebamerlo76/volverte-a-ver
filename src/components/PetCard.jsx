import { nombreMostrado, tiempoRelativo } from '../lib/formato.js'
import { ubicacionTexto } from '../lib/localidades.js'
import { badgeEstado, subLinea } from '../lib/estados.js'
import { useAplauso } from '../lib/useAplauso.js'

// posicion: lugar en la lista del feed. Sirve para decidir qué fotos cargar ya.
// Por defecto 99 = "no está arriba de todo" (así entra sin tocar quien no la pase).
export default function PetCard({ r, onClick, posicion = 99, zonaVecina = false }) {
  const perdido = r.tipo === 'perdido'
  const resuelto = r.estado === 'resuelto'
  const clr = perdido ? '#ff6b5e' : '#2f7fed'
  const { aplausos, aplaudido, aplaudir } = useAplauso(r) // 👏 en los "Ya en casa", sin entrar al aviso
  return (
    <button className="card" onClick={onClick}>
      <div className={'ci' + (perdido ? '' : ' g')}>
        {r.foto ? (
          <img
            src={r.foto}
            alt={nombreMostrado(r)}
            // Las 2 primeras entran en pantalla al abrir el feed: si esperan al
            // lazy-load aparecen tarde y se ve el flash. Van eager. De la 3ª en
            // adelante, lazy. La 1ª es casi siempre el LCP y encima va con
            // prioridad alta; la 2ª queda en auto para no robarle ancho de banda.
            loading={posicion < 2 ? 'eager' : 'lazy'}
            fetchpriority={posicion === 0 ? 'high' : 'auto'}
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
          {/* Este aviso es de una localidad vecina, no de la que estás mirando. */}
          {zonaVecina && <span className="tag-vecina">zona vecina</span>}
        </div>
        {resuelto && (
          // Aplaudir sin entrar al aviso. Es un span (no button) porque la tarjeta ya
          // es un <button>; stopPropagation evita que aplaudir abra el aviso.
          <span
            className={'card-aplauso' + (aplaudido ? ' on' : '')}
            role="button"
            tabIndex={0}
            aria-label={aplaudido ? 'Ya aplaudiste' : 'Aplaudir'}
            onClick={(e) => {
              e.stopPropagation()
              aplaudir()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                aplaudir()
              }
            }}
          >
            <span aria-hidden="true">👏</span>
            {aplaudido ? '¡Aplaudiste!' : 'Aplaudir'}
            {aplausos > 0 ? <b>{aplausos}</b> : null}
          </span>
        )}
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
