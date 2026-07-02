import MapaLeaflet from './MapaLeaflet.jsx'
import { coordsDeBarrio } from '../lib/parana.js'
import { nombreMostrado, tiempoRelativo, fechaLegible, linkWhatsApp } from '../lib/formato.js'

export default function Detalle({ r, esMio, onVolver, onToast, onEditar, onBorrar, onResuelto, onReactivar }) {
  if (!r) return null
  const perdido = r.tipo === 'perdido'
  const clr = perdido ? '#ff6b5e' : '#1f9d8f'
  const centro = coordsDeBarrio(r.zona)

  return (
    <div className="view">
      <div className="body">
        <div className={'dhero' + (perdido ? '' : ' g')}>
          {r.foto ? (
            <img src={r.foto} alt={nombreMostrado(r)} onError={(e) => (e.target.style.display = 'none')} />
          ) : (
            <span className="ph-pet mi fill" style={{ fontSize: 96 }}>
              pets
            </span>
          )}
          <button className="dback" onClick={onVolver}>
            <span className="mi" style={{ fontSize: 23, color: '#2a2320' }}>
              arrow_back
            </span>
          </button>
          <span className={'badge ' + (perdido ? 'lost' : 'found')} style={{ top: 16, left: 'auto', right: 16 }}>
            <span className="mi" style={{ fontSize: 16 }}>
              {perdido ? 'error_outline' : 'check_circle'}
            </span>
            {perdido ? 'Perdido' : 'Encontrado'} · {tiempoRelativo(r.creadoEn)}
          </span>
        </div>

        <div className="dpad">
          <div className="dname">{nombreMostrado(r)}</div>
          <div className="cmeta" style={{ fontSize: 14, marginTop: 5 }}>
            <span className="mi" style={{ fontSize: 17, color: clr }}>
              location_on
            </span>
            {r.zona}
            {r.referencia ? ` · ${r.referencia}` : ''}
          </div>

          <div className="tags" style={{ marginTop: 14 }}>
            <span className="tag">{r.especie === 'perro' ? 'Perro' : r.especie === 'gato' ? 'Gato' : 'Otro'}</span>
            {r.sexo && r.sexo !== 'No sé' ? <span className="tag">{r.sexo}</span> : null}
            {r.color ? <span className="tag">{r.color}</span> : null}
            {r.tamano ? <span className="tag">{r.tamano}</span> : null}
            {r.raza ? <span className="tag">{r.raza}</span> : null}
            {r.edad ? <span className="tag">{r.edad}</span> : null}
            {r.collar ? <span className="tag">🦮 {r.collar}</span> : null}
          </div>

          {r.recompensa ? (
            <div className="recompensa-box">
              <div className="recompensa-top">
                <span className="mi fill" style={{ fontSize: 20 }}>
                  paid
                </span>
                Recompensa: {r.recompensa}
              </div>
              <div className="recompensa-nota">
                Nunca pagues por adelantado ni des datos sensibles. Cuidado con las estafas.
              </div>
            </div>
          ) : null}

          {r.descripcion ? (
            <div className="signs">
              <div className="sec-t">Señas particulares</div>
              <div className="tx">{r.descripcion}</div>
            </div>
          ) : null}

          <div className="facts">
            <div className="factbox">
              <div className="k">{perdido ? 'Se perdió' : 'Se encontró'}</div>
              <div className="v">{fechaLegible(r.fechaEvento || r.creadoEn)}</div>
            </div>
            <div className="factbox">
              <div className="k">Publicado por</div>
              <div className="v">{r.autor || 'Anónimo'}</div>
            </div>
          </div>

          <div className="minimap">
            <MapaLeaflet center={centro} zoom={15} interactivo={false} marcadores={[{ id: r.id, lat: centro[0], lng: centro[1], tipo: r.tipo }]} />
            <div className="lbl">
              <span className="mi" style={{ fontSize: 16, color: clr }}>
                location_on
              </span>
              Zona aproximada · {r.zona}
            </div>
          </div>
        </div>
        <div style={{ height: 18 }} />
      </div>

      {esMio ? (
        <div className="cta">
          {r.estado === 'resuelto' ? (
            <button className="btn-wa" style={{ background: 'var(--coral)' }} onClick={() => onReactivar(r.id)}>
              <span className="mi" style={{ fontSize: 24 }}>
                undo
              </span>
              Volver a activar
            </button>
          ) : (
            <button className="btn-wa" style={{ background: 'var(--green)' }} onClick={() => onResuelto(r.id)}>
              <span className="mi fill" style={{ fontSize: 24 }}>
                check_circle
              </span>
              {r.tipo === 'perdido' ? 'Marcar reencontrado' : 'Marcar resuelto'}
            </button>
          )}
          <button className="btn-share" onClick={() => onEditar(r)} aria-label="Editar aviso">
            <span className="mi" style={{ fontSize: 24 }}>
              edit
            </span>
          </button>
          <button className="btn-share" onClick={() => onBorrar(r.id)} aria-label="Borrar aviso">
            <span className="mi" style={{ fontSize: 24, color: '#d33' }}>
              delete
            </span>
          </button>
        </div>
      ) : (
        <div className="cta">
          <a
            className="btn-wa"
            href={linkWhatsApp(r)}
            target="_blank"
            rel="noreferrer"
            onClick={() => onToast('Abriendo WhatsApp…')}
          >
            <span className="mi fill" style={{ fontSize: 24 }}>
              chat
            </span>
            Contactar por WhatsApp
          </a>
          <button
            className="btn-share"
            onClick={async () => {
              const url = window.location.href
              const texto = `${nombreMostrado(r)} — ${r.tipo} en ${r.zona}, Paraná. Mirá en Volverte a ver.`
              if (navigator.share) {
                try {
                  await navigator.share({ title: 'Volverte a ver', text: texto, url })
                } catch (e) {
                  /* el usuario canceló */
                }
              } else {
                onToast('🔗 Compartir disponible en el celular')
              }
            }}
          >
            <span className="mi" style={{ fontSize: 24 }}>
              ios_share
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
