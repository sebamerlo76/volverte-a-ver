// Barra inferior: Inicio · Buscar · Publicar (centro) · Mapa/Lista (alterna)
export default function BottomNav({ modo, onNav }) {
  const enMapa = modo === 'mapa'
  return (
    <div className="nav">
      <button className="ni" onClick={() => onNav('inicio')}>
        <span className="mi" style={{ fontSize: 24 }}>
          home
        </span>
        Inicio
      </button>
      <button className="ni" onClick={() => onNav('buscar')}>
        <span className="mi" style={{ fontSize: 24 }}>
          search
        </span>
        Buscar
      </button>
      <button className="navc" onClick={() => onNav('post')} aria-label="Publicar reporte">
        <span className="mi fill" style={{ fontSize: 32 }}>
          pets
        </span>
      </button>
      <button className={'ni' + (enMapa ? ' on' : '')} onClick={() => onNav('toggle')}>
        <span className={'mi' + (enMapa ? ' fill' : '')} style={{ fontSize: 24 }}>
          {enMapa ? 'view_list' : 'map'}
        </span>
        {enMapa ? 'Lista' : 'Mapa'}
      </button>
    </div>
  )
}
