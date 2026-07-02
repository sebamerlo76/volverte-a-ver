import { useEffect, useMemo, useState } from 'react'
import PetCard from './PetCard.jsx'
import MapaLeaflet from './MapaLeaflet.jsx'
import { getReencontrados } from '../data/store.js'
import { avatarDe, nombreMostrado, tiempoRelativo } from '../lib/formato.js'
import { coordsDeBarrio, PARANA_CENTER, NOMBRES_BARRIOS } from '../lib/parana.js'

// Pequeño desplazamiento determinístico para que no se superpongan los pines
// del mismo barrio (no tenemos calle exacta, solo la zona).
function jitter(base, id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000
  const dx = ((h % 100) - 50) / 11000
  const dy = ((Math.floor(h / 100) % 100) - 50) / 11000
  return [base[0] + dy, base[1] + dx]
}

export default function Feed({ reportes, onOpen, authActivo, logueado, user, onLogin, onCuenta, modo = 'lista', onModo }) {
  const avatar = avatarDe(user)
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('todos') // todos | perdido | encontrado | finales
  const [especie, setEspecie] = useState(null)
  const [zona, setZona] = useState(null)
  const [finales, setFinales] = useState(null)
  const [sel, setSel] = useState(null) // pin seleccionado en el mapa
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  useEffect(() => {
    if (estado === 'finales' && finales === null) {
      getReencontrados().then(setFinales).catch(() => setFinales([]))
    }
  }, [estado, finales])

  const toggle = (valor, actual, setter) => setter(actual === valor ? null : valor)

  function irInicio() {
    setQ('')
    setEstado('todos')
    setEspecie(null)
    setZona(null)
    setFiltrosAbiertos(false)
    const b = document.querySelector('.body')
    if (b) b.scrollTop = 0
  }

  const secundariosActivos = (especie ? 1 : 0) + (zona ? 1 : 0)

  const verFinales = estado === 'finales'

  const filtrados = useMemo(() => {
    const texto = q.trim().toLowerCase()
    const fuente = verFinales ? finales || [] : reportes
    return fuente.filter((r) => {
      if (estado === 'perdido' || estado === 'encontrado') {
        if (r.tipo !== estado) return false
      }
      if (especie && r.especie !== especie) return false
      if (zona && r.zona !== zona) return false
      if (texto) {
        const hay = `${r.nombre || ''} ${r.raza || ''} ${r.color || ''} ${r.zona || ''} ${r.especie}`.toLowerCase()
        if (!hay.includes(texto)) return false
      }
      return true
    })
  }, [reportes, finales, verFinales, q, estado, especie, zona])

  const enMapa = modo === 'mapa'

  const marcadores = useMemo(
    () =>
      filtrados.map((r) => {
        const [lat, lng] = jitter(coordsDeBarrio(r.zona), r.id)
        return { id: r.id, lat, lng, tipo: r.estado === 'resuelto' ? 'avistamiento' : r.tipo }
      }),
    [filtrados]
  )

  const seleccionado = filtrados.find((r) => r.id === sel) || null
  const perdidos = filtrados.filter((r) => r.tipo === 'perdido').length
  const encontrados = filtrados.filter((r) => r.tipo === 'encontrado').length

  return (
    <div className="view">
      {/* ---- Cabecera fija: marca, buscador, filtros y modo ---- */}
      <div className="home-top">
        <div className="hd">
          <div className="brand">
            <button className="logo" onClick={irInicio} aria-label="Ir al inicio">
              <span className="mi fill" style={{ fontSize: 21 }}>
                pets
              </span>
            </button>
            <div style={{ flex: 1 }}>
              <div className="bname">Volverte a ver</div>
              <div className="bsub">Paraná · Entre Ríos</div>
            </div>
            {authActivo ? (
              <button onClick={logueado ? onCuenta : onLogin} aria-label={logueado ? 'Mi cuenta' : 'Iniciar sesión'}>
                {logueado && avatar ? (
                  <img className="hd-av" src={avatar} alt="Mi cuenta" referrerPolicy="no-referrer" />
                ) : (
                  <span className={'mi' + (logueado ? ' fill' : '')} style={{ fontSize: 28, color: logueado ? '#ff6b5e' : '#c3b8b0' }}>
                    {logueado ? 'account_circle' : 'login'}
                  </span>
                )}
              </button>
            ) : (
              <span className="mi" style={{ fontSize: 26, color: '#c3b8b0' }}>
                notifications
              </span>
            )}
          </div>
          <div className="search">
            <span className="mi" style={{ fontSize: 21, color: '#c9beb6' }}>
              search
            </span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, barrio o color…" />
          </div>
        </div>

        {/* Fila principal: estado (una sola fila que scrollea) + botón Filtros */}
        <div className="chips chips-row">
          <button className={'chip' + (estado === 'todos' ? ' on' : '')} onClick={() => setEstado('todos')}>
            Todos
          </button>
          <button className={'chip lost' + (estado === 'perdido' ? ' on' : '')} onClick={() => setEstado('perdido')}>
            Perdidos
          </button>
          <button className={'chip found' + (estado === 'encontrado' ? ' on' : '')} onClick={() => setEstado('encontrado')}>
            Encontrados
          </button>
          <button className={'chip finales' + (verFinales ? ' on' : '')} onClick={() => setEstado('finales')}>
            🎉 Reencontrados
          </button>
          <button
            className={'chip filtros-btn' + (filtrosAbiertos || secundariosActivos ? ' on' : '')}
            onClick={() => setFiltrosAbiertos((v) => !v)}
          >
            <span className="mi" style={{ fontSize: 17 }}>
              tune
            </span>
            Filtros{secundariosActivos ? ` (${secundariosActivos})` : ''}
          </button>
        </div>

        {/* Panel de filtros secundarios (se abre y cierra) */}
        {filtrosAbiertos && (
          <div className="filtros-panel">
            <div className="fp-label">Especie</div>
            <div className="chipsel-wrap">
              <button className={'chip' + (especie === 'perro' ? ' on' : '')} onClick={() => toggle('perro', especie, setEspecie)}>
                Perros
              </button>
              <button className={'chip' + (especie === 'gato' ? ' on' : '')} onClick={() => toggle('gato', especie, setEspecie)}>
                Gatos
              </button>
              <button className={'chip' + (especie === 'otro' ? ' on' : '')} onClick={() => toggle('otro', especie, setEspecie)}>
                Otros
              </button>
            </div>
            <div className="fp-label">Barrio</div>
            <div className="chipsel-wrap">
              {NOMBRES_BARRIOS.map((z) => (
                <button key={z} className={'chip' + (zona === z ? ' on' : '')} onClick={() => toggle(z, zona, setZona)}>
                  {z}
                </button>
              ))}
            </div>
            {secundariosActivos > 0 && (
              <button className="fp-limpiar" onClick={() => { setEspecie(null); setZona(null) }}>
                Quitar filtros de especie y barrio
              </button>
            )}
          </div>
        )}

        <div className="modo-toggle">
          <button className={'modo-btn' + (!enMapa ? ' on' : '')} onClick={() => onModo && onModo('lista')}>
            <span className="mi" style={{ fontSize: 18 }}>
              view_list
            </span>
            Lista
          </button>
          <button className={'modo-btn' + (enMapa ? ' on' : '')} onClick={() => onModo && onModo('mapa')}>
            <span className="mi" style={{ fontSize: 18 }}>
              map
            </span>
            Mapa
          </button>
          <span className="modo-count">
            {filtrados.length} {filtrados.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      </div>

      {/* ---- Contenido: lista o mapa (mismos filtros) ---- */}
      {enMapa ? (
        <div className="mapwrap">
          <MapaLeaflet
            center={PARANA_CENTER}
            zoom={13}
            marcadores={marcadores}
            onMarcadorClick={setSel}
            style={{ position: 'absolute', inset: 0 }}
          />
          <div className="mlegend">
            <div className="l" style={{ background: '#ff5747' }}>
              Perdidos · {perdidos}
            </div>
            <div className="l" style={{ background: '#17a06b' }}>
              Encontrados · {encontrados}
            </div>
          </div>
          {seleccionado ? (
            <button className="mcard" onClick={() => onOpen(seleccionado)}>
              {seleccionado.foto ? (
                <img src={seleccionado.foto} alt="" onError={(e) => (e.target.style.display = 'none')} />
              ) : (
                <div className="noimg" />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: seleccionado.tipo === 'perdido' ? '#ff5747' : '#17a06b' }} />
                  <span style={{ fontSize: 11, fontWeight: 900, color: seleccionado.tipo === 'perdido' ? '#ff5747' : '#17a06b' }}>
                    {seleccionado.tipo.toUpperCase()} · {tiempoRelativo(seleccionado.creadoEn)}
                  </span>
                </div>
                <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 17, marginTop: 1 }}>
                  {nombreMostrado(seleccionado)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#8a807a' }}>{seleccionado.zona}</div>
              </div>
            </button>
          ) : (
            <div className="map-hint">Tocá un pin para ver el aviso</div>
          )}
        </div>
      ) : (
        <div className="body">
          {verFinales && finales === null ? (
            <div className="empty">Cargando finales felices…</div>
          ) : filtrados.length === 0 ? (
            <div className="empty">
              {verFinales ? (
                <>
                  🐾 Todavía no hay reencuentros publicados.
                  <br />
                  ¡Ojalá pronto haya muchos finales felices!
                </>
              ) : (
                <>
                  🔍 No hay resultados con esos filtros.
                  <br />
                  Quizás tenés más de un filtro puesto.
                  <div>
                    <button className="btn-limpiar" onClick={irInicio}>
                      <span className="mi" style={{ fontSize: 18 }}>
                        filter_alt_off
                      </span>
                      Limpiar filtros
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            filtrados.map((r) => <PetCard key={r.id} r={r} onClick={() => onOpen(r)} />)
          )}
          <div style={{ height: 18 }} />
        </div>
      )}
    </div>
  )
}
