import { useEffect, useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import { puntoDeReporte } from '../lib/parana.js'
import { getAvistamientos } from '../data/store.js'
import { nombreMostrado, tiempoRelativo, fechaLegible, fechaHora, linkWhatsApp, linkWhatsAppAvist } from '../lib/formato.js'

// Escapa texto del usuario para meterlo seguro en el HTML del globito.
function esc(s = '') {
  return String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))
}
// Globito de un avistamiento.
export function popupAvist(a, n) {
  return `<div style="font-family:Nunito,system-ui,sans-serif;min-width:130px;line-height:1.45"><b style="font-size:13px;color:#1f9d8f">👀 Avistamiento ${n}</b><br><span style="font-size:12.5px;color:#2a2320">${esc(a.nota) || 'Sin detalle'}</span><br><span style="font-size:11.5px;color:#8a807a">${esc(a.autor) || 'Anónimo'} · ${fechaHora(a.creadoEn)}</span></div>`
}

export default function Detalle({ r, esMio, puedeSeguir, siguiendo, onSeguir, onVolver, onToast, onEditar, onBorrar, onResuelto, onReactivar, onAvistar, onMaximizar }) {
  const [avist, setAvist] = useState([])
  const [fotoActiva, setFotoActiva] = useState(0)

  useEffect(() => {
    if (!r?.id) return
    let vivo = true
    getAvistamientos(r.id)
      .then((a) => vivo && setAvist(a))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [r?.id])

  if (!r) return null
  const perdido = r.tipo === 'perdido'
  const resuelto = r.estado === 'resuelto'
  const clr = perdido ? '#ff6b5e' : '#1f9d8f'
  const fotos = r.fotos && r.fotos.length ? r.fotos : r.foto ? [r.foto] : []
  const centro = puntoDeReporte(r)

  // Marcadores del mapa: la zona del aviso + cada avistamiento numerado.
  const marcadores = [
    { id: 'zona', lat: centro[0], lng: centro[1], tipo: r.tipo, especie: r.especie },
    ...avist.map((a, i) => ({
      id: a.id,
      lat: a.lat,
      lng: a.lng,
      tipo: 'avistamiento',
      label: i + 1,
      popup: popupAvist(a, i + 1),
    })),
  ]
  const linea = [centro, ...avist.map((a) => [a.lat, a.lng])]

  return (
    <div className="view">
      <div className="body">
        <div className={'dhero' + (perdido ? '' : ' g')}>
          {fotos.length > 0 ? (
            <div
              className="dhero-carrusel"
              onScroll={(e) => {
                const el = e.currentTarget
                const i = Math.round(el.scrollLeft / el.clientWidth)
                if (i !== fotoActiva) setFotoActiva(i)
              }}
            >
              {fotos.map((u, i) => (
                <img key={i} src={u} alt={nombreMostrado(r)} onError={(e) => (e.target.style.display = 'none')} />
              ))}
            </div>
          ) : (
            <span className="ph-pet mi fill" style={{ fontSize: 96 }}>
              pets
            </span>
          )}
          {fotos.length > 1 && (
            <div className="dhero-dots">
              {fotos.map((_, i) => (
                <span key={i} className={'ddot' + (i === fotoActiva ? ' on' : '')} />
              ))}
            </div>
          )}
          <button className="dback" onClick={onVolver}>
            <span className="mi" style={{ fontSize: 23, color: '#2a2320' }}>
              arrow_back
            </span>
          </button>
          <span className={'badge ' + (resuelto ? 'encasa' : perdido ? 'lost' : 'found')} style={{ top: 16, left: 'auto', right: 16 }}>
            <span className="mi" style={{ fontSize: 16 }}>
              {resuelto ? 'celebration' : perdido ? 'error_outline' : 'check_circle'}
            </span>
            {resuelto ? 'En casa' : perdido ? 'Perdido' : 'Encontrado'} · {tiempoRelativo(r.creadoEn)}
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

          {puedeSeguir && r.estado !== 'resuelto' && (
            <button className={'btn-seguir' + (siguiendo ? ' on' : '')} onClick={onSeguir}>
              <span className="mi" style={{ fontSize: 20 }}>
                {siguiendo ? 'notifications_active' : 'notifications'}
              </span>
              {siguiendo ? 'Siguiendo esta búsqueda' : 'Seguir esta búsqueda'}
            </button>
          )}

          {r.enCustodia ? (
            <div className="en-custodia">
              <span className="mi" style={{ fontSize: 19, color: '#177f73' }}>
                volunteer_activism
              </span>
              En tránsito — quien la encontró la tiene a resguardo 🏠
            </div>
          ) : null}

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

          <div className="sec-t" style={{ marginTop: 18, color: 'var(--teal)' }}>
            {avist.length > 0 ? `Recorrido · ${avist.length} avistamiento${avist.length === 1 ? '' : 's'}` : 'Última zona conocida'}
          </div>
          <div className="minimap" style={{ height: 200 }}>
            <MapaLeaflet center={centro} zoom={14} interactivo={false} marcadores={marcadores} linea={linea} />
            <div className="lbl">
              <span className="mi" style={{ fontSize: 16, color: clr }}>
                location_on
              </span>
              {r.zona}
              {avist.length > 0 ? ` → ${avist.length} visto${avist.length === 1 ? '' : 's'}` : ''}
            </div>
            <button className="map-expand" onClick={() => onMaximizar(r)} aria-label="Ver el mapa completo">
              <span className="mi" style={{ fontSize: 20, color: '#2a2320' }}>
                open_in_full
              </span>
            </button>
          </div>
          <button className="ver-recorrido" onClick={() => onMaximizar(r)}>
            <span className="mi" style={{ fontSize: 19 }}>
              map
            </span>
            Ver el mapa completo (mover y hacer zoom)
          </button>

          {r.estado !== 'resuelto' && (
            <button className="btn-avistar" onClick={() => onAvistar(r)}>
              <span className="mi" style={{ fontSize: 22 }}>
                visibility
              </span>
              ¡Lo vi acá!
            </button>
          )}

          {avist.length > 0 && (
            <div className="avist-lista">
              {avist.map((a, i) => (
                <div className="avist-row" key={a.id}>
                  <div className="avist-num">{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="avist-nota">{a.nota || 'Avistamiento'}</div>
                    <div className="avist-meta">
                      {a.autor || 'Anónimo'} · {tiempoRelativo(a.creadoEn)}
                    </div>
                  </div>
                  {a.whatsapp ? (
                    <a
                      className="avist-wa"
                      href={linkWhatsAppAvist(a.whatsapp, r)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => onToast?.('Abriendo WhatsApp…')}
                    >
                      <span className="mi fill" style={{ fontSize: 17 }}>
                        chat
                      </span>
                      Escribirle
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
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
              const texto = `${nombreMostrado(r)} — ${r.tipo} en ${r.zona}, Paraná. Mirá en Chicho.`
              if (navigator.share) {
                try {
                  await navigator.share({ title: 'Chicho', text: texto, url })
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
