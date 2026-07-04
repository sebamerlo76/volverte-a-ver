import { useEffect, useMemo, useState } from 'react'
import PetCard from './PetCard.jsx'
import MapaLeaflet from './MapaLeaflet.jsx'
import { getReencontrados } from '../data/store.js'
import { avatarDe, nombreMostrado, tiempoRelativo, dentroDeRango } from '../lib/formato.js'
import { coordsDeBarrio, PARANA_CENTER, NOMBRES_BARRIOS } from '../lib/parana.js'

const ESPECIE_LBL = { perro: 'Perros', gato: 'Gatos', otro: 'Otros' }
const TIEMPOS = [
  { k: 'todos', t: 'Siempre' },
  { k: 'hoy', t: 'Hoy' },
  { k: 'semana', t: 'Esta semana' },
  { k: 'mes', t: 'Este mes' },
]
const TABS = [
  { k: 'todos', t: 'Todos' },
  { k: 'perdido', t: 'Perdidos' },
  { k: 'encontrado', t: 'Encontrados' },
  { k: 'finales', t: 'En casa', icono: 'home' },
]

// Desplazamiento determinístico para que no se superpongan los pines del barrio.
function jitter(base, id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000
  const dx = ((h % 100) - 50) / 11000
  const dy = ((Math.floor(h / 100) % 100) - 50) / 11000
  return [base[0] + dy, base[1] + dx]
}

export default function Feed({ reportes, onOpen, onToast, authActivo, logueado, user, onLogin, onCuenta, onNotifs, notifsNoLeidas = 0, modo, filtros, setFiltro, resetInicio }) {
  const avatar = avatarDe(user)
  const [finales, setFinales] = useState(null)
  const [sel, setSel] = useState(null)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [miUbi, setMiUbi] = useState(null)

  function ubicarme() {
    if (!navigator.geolocation) {
      onToast && onToast('Tu navegador no permite ubicación')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setMiUbi([p.coords.latitude, p.coords.longitude]),
      () => onToast && onToast('No pudimos acceder a tu ubicación 📍'),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const verFinales = filtros.estado === 'finales'
  const enMapa = modo === 'mapa'

  useEffect(() => {
    if (verFinales && finales === null) {
      getReencontrados().then(setFinales).catch(() => setFinales([]))
    }
  }, [verFinales, finales])

  const filtrados = useMemo(() => {
    const texto = (filtros.q || '').trim().toLowerCase()
    const fuente = verFinales ? finales || [] : reportes
    let arr = fuente.filter((r) => {
      if (filtros.estado === 'perdido' || filtros.estado === 'encontrado') {
        if (r.tipo !== filtros.estado) return false
      }
      if (filtros.especie && r.especie !== filtros.especie) return false
      if (filtros.zona && r.zona !== filtros.zona) return false
      if (!dentroDeRango(r.creadoEn, filtros.tiempo)) return false
      if (texto) {
        const hay = `${r.nombre || ''} ${r.raza || ''} ${r.color || ''} ${r.zona || ''} ${r.especie}`.toLowerCase()
        if (!hay.includes(texto)) return false
      }
      return true
    })
    return arr
  }, [reportes, finales, verFinales, filtros])

  const marcadores = useMemo(
    () =>
      filtrados.map((r) => {
        const exacto = r.lat != null && r.lng != null
        const [lat, lng] = exacto ? [r.lat, r.lng] : jitter(coordsDeBarrio(r.zona), r.id)
        return { id: r.id, lat, lng, tipo: r.estado === 'resuelto' ? 'encasa' : r.tipo, especie: r.especie }
      }),
    [filtrados]
  )

  const seleccionado = filtrados.find((r) => r.id === sel) || null
  const perdidos = filtrados.filter((r) => r.tipo === 'perdido').length
  const encontrados = filtrados.filter((r) => r.tipo === 'encontrado').length

  // Chips de filtros activos (breadcrumb removible)
  const chips = []
  if (filtros.q) chips.push({ key: 'q', label: `“${filtros.q}”`, clear: () => setFiltro('q', '') })
  if (filtros.especie) chips.push({ key: 'especie', label: ESPECIE_LBL[filtros.especie], clear: () => setFiltro('especie', null) })
  if (filtros.zona) chips.push({ key: 'zona', label: filtros.zona, clear: () => setFiltro('zona', null) })
  if (filtros.tiempo !== 'todos')
    chips.push({
      key: 'tiempo',
      label: filtros.tiempo === 'hoy' ? 'Hoy' : filtros.tiempo === 'semana' ? 'Esta semana' : 'Este mes',
      clear: () => setFiltro('tiempo', 'todos'),
    })

  return (
    <div className={'view home-' + filtros.estado}>
      <div className="home-top">
        {/* Fila mini: logo + avatar */}
        <div className="hmini">
          <button className="hmini-logo" onClick={resetInicio} aria-label="Ir al inicio">
            <img src="/logo.png" alt="" width="42" height="42" style={{ display: 'block' }} />
            Chicho
          </button>
          {authActivo ? (
            <div className="hmini-acc">
              {logueado ? (
                <button className="hd-bell" onClick={onNotifs} aria-label="Notificaciones">
                  <span className="mi" style={{ fontSize: 26, color: 'var(--navy)' }}>
                    notifications
                  </span>
                  {notifsNoLeidas > 0 ? (
                    <span className="hd-bell-badge">{notifsNoLeidas > 9 ? '9+' : notifsNoLeidas}</span>
                  ) : null}
                </button>
              ) : null}
              <button onClick={logueado ? onCuenta : onLogin} aria-label={logueado ? 'Mi cuenta' : 'Iniciar sesión'}>
                {logueado && avatar ? (
                  <img className="hd-av" src={avatar} alt="Mi cuenta" referrerPolicy="no-referrer" />
                ) : (
                  <span className={'mi' + (logueado ? ' fill' : '')} style={{ fontSize: 27, color: logueado ? 'var(--navy)' : '#c3b8b0' }}>
                    {logueado ? 'account_circle' : 'login'}
                  </span>
                )}
              </button>
            </div>
          ) : null}
        </div>

        {/* Pestañas de estado (con acento de color) */}
        <div className="tabs">
          {TABS.map((tab) => (
            <button key={tab.k} className={'tab' + (filtros.estado === tab.k ? ' on' : '')} onClick={() => setFiltro('estado', tab.k)}>
              {tab.icono ? (
                <span className={'mi' + (filtros.estado === tab.k ? ' fill' : '')} style={{ fontSize: 16, marginRight: 3, verticalAlign: '-3px' }}>
                  {tab.icono}
                </span>
              ) : null}
              {tab.t}
            </button>
          ))}
        </div>

        {/* Barra de filtros (breadcrumb) */}
        <div className="fbar">
          <button className={'fbar-tune' + (panelAbierto ? ' on' : '')} onClick={() => setPanelAbierto((v) => !v)}>
            <span className="mi" style={{ fontSize: 18 }}>
              tune
            </span>
            Filtrar
          </button>
          {chips.map((c) => (
            <button key={c.key} className="fchip" onClick={c.clear}>
              {c.label}
              <span className="mi" style={{ fontSize: 15 }}>
                close
              </span>
            </button>
          ))}
          <span className="fbar-count">
            {filtrados.length} {filtrados.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

      </div>

      {/* El panel de filtros tapa los resultados mientras está abierto; al cerrar, muestra los filtrados */}
      {panelAbierto ? (
        <div className="filtros-panel">
          <div className="fp-label">Especie</div>
          <div className="chipsel-wrap">
            {['perro', 'gato', 'otro'].map((e) => (
              <button key={e} className={'chip' + (filtros.especie === e ? ' on' : '')} onClick={() => setFiltro('especie', filtros.especie === e ? null : e)}>
                {ESPECIE_LBL[e]}
              </button>
            ))}
          </div>
          <div className="fp-label">Barrio</div>
          <div className="chipsel-wrap">
            {NOMBRES_BARRIOS.map((z) => (
              <button key={z} className={'chip' + (filtros.zona === z ? ' on' : '')} onClick={() => setFiltro('zona', filtros.zona === z ? null : z)}>
                {z}
              </button>
            ))}
          </div>
          <div className="fp-label">Cuándo</div>
          <div className="chipsel-wrap">
            {TIEMPOS.map((t) => (
              <button key={t.k} className={'chip' + (filtros.tiempo === t.k ? ' on' : '')} onClick={() => setFiltro('tiempo', t.k)}>
                {t.t}
              </button>
            ))}
          </div>
          <button className="fp-listo" onClick={() => setPanelAbierto(false)}>
            Ver resultados
          </button>
        </div>
      ) : enMapa ? (
        <div className="mapwrap">
          <MapaLeaflet
            center={PARANA_CENTER}
            zoom={13}
            marcadores={marcadores}
            ajustar
            miUbi={miUbi}
            onMarcadorClick={setSel}
            style={{ position: 'absolute', inset: 0 }}
          />
          <div className="mlegend">
            {verFinales ? (
              <div className="l" style={{ background: '#e0a300' }}>
                En casa · {filtrados.length}
              </div>
            ) : (
              <>
                {filtros.estado !== 'encontrado' && (
                  <div className="l" style={{ background: '#ff5747' }}>
                    Perdidos · {perdidos}
                  </div>
                )}
                {filtros.estado !== 'perdido' && (
                  <div className="l" style={{ background: '#17a06b' }}>
                    Encontrados · {encontrados}
                  </div>
                )}
              </>
            )}
          </div>
          <button className="mloc" onClick={ubicarme} aria-label="Mi ubicación">
            <span className="mi" style={{ fontSize: 24, color: '#2f80ed' }}>
              my_location
            </span>
          </button>
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
                  <div>
                    <button className="btn-limpiar" onClick={resetInicio}>
                      <span className="mi" style={{ fontSize: 18 }}>
                        filter_alt_off
                      </span>
                      Limpiar todo
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
