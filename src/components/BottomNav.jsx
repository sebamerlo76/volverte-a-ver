// Barra inferior: Inicio · Perdí · Encontré · Mapa (Perdí/Encontré publican directo).
export default function BottomNav({ modo, onNav }) {
  const enMapa = modo === 'mapa'
  return (
    <div className="nav">
      <button className={'ni' + (!enMapa ? ' on' : '')} onClick={() => onNav('inicio')}>
        <span className="mi" style={{ fontSize: 25 }}>
          home
        </span>
        Inicio
      </button>
      <button className="ni ni-perdi" onClick={() => onNav('perdi')} aria-label="Se me perdió">
        <span className="mi fill" style={{ fontSize: 25 }}>
          pets
        </span>
        Perdí
      </button>
      <button className="ni ni-encontre" onClick={() => onNav('encontre')} aria-label="Encontré una mascota">
        <span className="mi fill" style={{ fontSize: 25 }}>
          visibility
        </span>
        Encontré
      </button>
      <button className={'ni' + (enMapa ? ' on' : '')} onClick={() => onNav('mapa')}>
        <span className={'mi' + (enMapa ? ' fill' : '')} style={{ fontSize: 25 }}>
          map
        </span>
        Mapa
      </button>
    </div>
  )
}
