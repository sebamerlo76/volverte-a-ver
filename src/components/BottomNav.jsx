// Barra inferior: Inicio · Perdí · Encontré · Mapa/Lista.
// - Perdí / Encontré publican directo.
// - El último botón es un toggle que muestra SIEMPRE lo contrario de lo que estás
//   viendo: en lista dice "Mapa" (te lleva al mapa); en mapa dice "Lista".
// - inicioPulse: destello breve al tocar Inicio, para que se note que hizo algo.
export default function BottomNav({ modo, onNav, inicioPulse }) {
  const enMapa = modo === 'mapa'
  return (
    <div className="nav">
      <button
        className={'ni' + (!enMapa ? ' on' : '') + (inicioPulse ? ' pulse' : '')}
        onClick={() => onNav('inicio')}
      >
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
      <button className="ni" onClick={() => onNav('mapa')} aria-label={enMapa ? 'Ver lista' : 'Ver mapa'}>
        <span className="mi" style={{ fontSize: 25 }}>
          {enMapa ? 'view_list' : 'map'}
        </span>
        {enMapa ? 'Lista' : 'Mapa'}
      </button>
    </div>
  )
}
