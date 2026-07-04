import { nombreMostrado, tiempoRelativo } from '../lib/formato.js'

export default function PetCard({ r, onClick }) {
  const perdido = r.tipo === 'perdido'
  const resuelto = r.estado === 'resuelto'
  const clr = perdido ? '#ff6b5e' : '#2f7fed'
  return (
    <button className="card" onClick={onClick}>
      <div className={'ci' + (perdido ? '' : ' g')}>
        {r.foto ? (
          <img src={r.foto} alt={nombreMostrado(r)} onError={(e) => (e.target.style.display = 'none')} />
        ) : (
          <span className="ph-pet mi fill" style={{ fontSize: 52 }}>
            pets
          </span>
        )}
        {resuelto ? (
          <span className="badge encasa">
            <span className="mi fill" style={{ fontSize: 16 }}>
              celebration
            </span>
            En casa
          </span>
        ) : (
          <span className={'badge ' + (perdido ? 'lost' : 'found')}>
            <span className={'mi' + (perdido ? '' : ' fill')} style={{ fontSize: 16 }}>
              {perdido ? 'error_outline' : 'pets'}
            </span>
            {perdido ? 'Perdido' : 'En la calle'}
          </span>
        )}
        <span className="time">{tiempoRelativo(r.creadoEn)}</span>
      </div>
      <div className="cbody">
        <div className="cname">{nombreMostrado(r)}</div>
        {!resuelto && (
          <div className="cbusca" style={{ color: clr }}>
            <span className="mi fill" style={{ fontSize: 14 }}>
              {perdido ? 'search' : 'volunteer_activism'}
            </span>
            {perdido ? 'Su familia lo busca' : 'Busca a su familia'}
          </div>
        )}
        <div className="cmeta">
          <span className="mi" style={{ fontSize: 16, color: clr }}>
            location_on
          </span>
          {r.zona}
        </div>
        <div className="tags">
          {r.recompensa ? <span className="tag recompensa">💰 Recompensa</span> : null}
          <span className="tag">{r.especie === 'perro' ? 'Perro' : r.especie === 'gato' ? 'Gato' : 'Otro'}</span>
          {r.sexo && r.sexo !== 'No sé' ? <span className="tag">{r.sexo}</span> : null}
          {r.color ? <span className="tag">{r.color}</span> : null}
          {r.tamano ? <span className="tag">{r.tamano}</span> : null}
          {r.raza ? <span className="tag">{r.raza}</span> : null}
        </div>
      </div>
    </button>
  )
}
