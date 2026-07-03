import { useEffect, useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import { puntoDeReporte } from '../lib/parana.js'
import { getAvistamientos, sumarApoyo } from '../data/store.js'
import { nombreMostrado, tiempoRelativo, fechaLegible, fechaHora, linkWhatsApp, linkWhatsAppAvist, linkTel } from '../lib/formato.js'
import { compartirFlyer } from '../lib/flyer.js'

// Escapa texto del usuario para meterlo seguro en el HTML del globito.
function esc(s = '') {
  return String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))
}
// Globito de un avistamiento.
export function popupAvist(a, n) {
  const foto = a.foto ? `<br><img src="${esc(a.foto)}" style="margin-top:6px;width:150px;height:96px;object-fit:cover;border-radius:8px" />` : ''
  return `<div style="font-family:Nunito,system-ui,sans-serif;min-width:130px;line-height:1.45"><b style="font-size:13px;color:#1f9d8f">👀 Avistamiento ${n}</b><br><span style="font-size:12.5px;color:#2a2320">${esc(a.nota) || 'Sin detalle'}</span><br><span style="font-size:11.5px;color:#8a807a">${esc(a.autor) || 'Anónimo'} · ${fechaHora(a.creadoEn)}</span>${foto}</div>`
}

// ¿Este dispositivo ya apoyó este aviso? (para no contar dos veces)
function yaApoyado(id) {
  try {
    return JSON.parse(localStorage.getItem('chicho_apoyos') || '[]').includes(id)
  } catch (e) {
    return false
  }
}
function marcarApoyado(id) {
  try {
    const a = JSON.parse(localStorage.getItem('chicho_apoyos') || '[]')
    if (!a.includes(id)) {
      a.push(id)
      localStorage.setItem('chicho_apoyos', JSON.stringify(a))
    }
  } catch (e) {
    /* ignore */
  }
}

export default function Detalle({ r, esMio, puedeSeguir, siguiendo, onSeguir, onVolver, onToast, onEditar, onBorrar, onResuelto, onReactivar, onAvistar, onMaximizar }) {
  const [avist, setAvist] = useState([])
  const [fotoActiva, setFotoActiva] = useState(0)
  const [apoyos, setApoyos] = useState(r?.apoyos || 0)
  const [apoyado, setApoyado] = useState(false)

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

  // Sincronizar el contador de apoyos al cambiar de aviso.
  useEffect(() => {
    setApoyos(r?.apoyos || 0)
    setApoyado(yaApoyado(r?.id))
  }, [r?.id, r?.apoyos])

  async function sumarme() {
    if (apoyado || !r?.id) return
    setApoyado(true)
    setApoyos((n) => n + 1)
    marcarApoyado(r.id)
    onToast?.('💛 ¡Gracias! Compartilo para llegar a más gente')
    try {
      const total = await sumarApoyo(r.id)
      if (typeof total === 'number') setApoyos(total)
    } catch (e) {
      console.error(e)
    }
  }

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

          <button className="btn-compartir" onClick={() => compartirFlyer(r, onToast)}>
            <span className="mi" style={{ fontSize: 20 }}>
              share
            </span>
            Compartir para ayudar
          </button>

          <div className="apoyo-box">
            <span className="mi fill apoyo-ico">volunteer_activism</span>
            <div className="apoyo-txt">
              {apoyos > 0 ? (
                <>
                  <b>{apoyos}</b> {apoyos === 1 ? 'persona' : 'personas'} ayudando a difundir
                </>
              ) : (
                <>Sumate a difundir a {nombreMostrado(r)}</>
              )}
            </div>
            {r.estado !== 'resuelto' && (
              <button className={'apoyo-btn' + (apoyado ? ' on' : '')} onClick={sumarme} disabled={apoyado}>
                {apoyado ? '¡Gracias! 💛' : 'Me sumo'}
              </button>
            )}
          </div>

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
                  {a.foto ? (
                    <a href={a.foto} target="_blank" rel="noreferrer" className="avist-thumb" aria-label="Ver la foto del avistamiento">
                      <img src={a.foto} alt="Foto del avistamiento" loading="lazy" />
                    </a>
                  ) : null}
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
          {r.whatsapp ? (
            <a className="btn-share" href={linkTel(r.whatsapp)} aria-label="Llamar por teléfono">
              <span className="mi fill" style={{ fontSize: 24, color: 'var(--teal)' }}>
                call
              </span>
            </a>
          ) : null}
          <button className="btn-share" onClick={() => compartirFlyer(r, onToast)} aria-label="Compartir aviso">
            <span className="mi" style={{ fontSize: 24 }}>
              share
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
