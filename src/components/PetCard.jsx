import { nombreMostrado, tiempoRelativo } from '../lib/formato.js'

export default function PetCard({ r, onClick }) {
  const perdido = r.tipo === 'perdido'
  const clr = perdido ? '#ff6b5e' : '#1f9d8f'
  return (
    <button className="card" onClick={onClick}>
      <div className={'ci' + (perdido ? '' : ' g')}>
        {r.foto ? <img src={r.foto} alt={nombreMostrado(r)} onError={(e) => (e.target.style.display = 'none')} /> : null}
        <span className={'badge ' + (perdido ? 'lost' : 'found')}>
          <span className="mi" style={{ fontSize: 16 }}>
            {perdido ? 'error_outline' : 'check_circle'}
          </span>
          {perdido ? 'Perdido' : 'Encontrado'}
        </span>
        <span className="time">{tiempoRelativo(r.creadoEn)}</span>
      </div>
      <div className="cbody">
        <div className="cname">{nombreMostrado(r)}</div>
        <div className="cmeta">
          <span className="mi" style={{ fontSize: 16, color: clr }}>
            location_on
          </span>
          {r.zona}
        </div>
        <div className="tags">
          <span className="tag">{r.especie === 'perro' ? 'Perro' : r.especie === 'gato' ? 'Gato' : 'Otro'}</span>
          {r.color ? <span className="tag">{r.color}</span> : null}
          {r.tamano ? <span className="tag">{r.tamano}</span> : null}
          {r.raza ? <span className="tag">{r.raza}</span> : null}
        </div>
      </div>
    </button>
  )
}
