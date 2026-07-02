// Barra inferior: Inicio · Publicar (centro) · Mapa
export default function BottomNav({ tab, onNav }) {
  return (
    <div className="nav">
      <button className={'ni' + (tab === 'feed' ? ' on' : '')} onClick={() => onNav('feed')}>
        <span className={'mi' + (tab === 'feed' ? ' fill' : '')} style={{ fontSize: 25 }}>
          home
        </span>
        Inicio
      </button>
      <button className="navc" onClick={() => onNav('post')} aria-label="Publicar reporte">
        <span className="mi fill" style={{ fontSize: 32 }}>
          pets
        </span>
      </button>
      <button className={'ni' + (tab === 'map' ? ' on' : '')} onClick={() => onNav('map')}>
        <span className={'mi' + (tab === 'map' ? ' fill' : '')} style={{ fontSize: 25 }}>
          map
        </span>
        Mapa
      </button>
    </div>
  )
}
