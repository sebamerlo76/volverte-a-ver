import { useEffect, useMemo, useRef, useState } from 'react'
import PetCard from './PetCard.jsx'
import MapaLeaflet from './MapaLazy.jsx'
import { getReencontrados } from '../data/store.js'
import { avatarDe, nombreMostrado, tiempoRelativo, dentroDeRango } from '../lib/formato.js'
import { NOMBRES_LOCALIDADES, LOCALIDAD_DEFECTO, centroDe, nombresBarriosDe, coordsDeBarrioEn, recordarLocalidad, recordarScopeFeed, provinciaDe, ubicacionTexto, enZonaDelFeed } from '../lib/localidades.js'
import SelectorCiudad from './SelectorCiudad.jsx'
import { puntoDeReporte } from '../lib/parana.js'
import { TABS_ESTADO, textoTipo } from '../lib/estados.js'
import { coincideBusqueda } from '../lib/buscar.js'
import ComoLlegarSheet from './ComoLlegarSheet.jsx'

const ESPECIE_LBL = { perro: 'Perros', gato: 'Gatos', otro: 'Otros' }
const TIEMPOS = [
  { k: 'todos', t: 'Siempre' },
  { k: 'hoy', t: 'Hoy' },
  { k: 'semana', t: 'Esta semana' },
  { k: 'mes', t: 'Este mes' },
]
const TABS = TABS_ESTADO

// Desplazamiento determinístico para que no se superpongan los pines del barrio.
function jitter(base, id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000
  const dx = ((h % 100) - 50) / 11000
  const dy = ((Math.floor(h / 100) % 100) - 50) / 11000
  return [base[0] + dy, base[1] + dx]
}

export default function Feed({ reportes, cargando, onOpen, onToast, authActivo, logueado, user, onLogin, onMenu, onNotifs, notifsNoLeidas = 0, hayNudge, modo, filtros, setFiltro, resetInicio, scrollRef }) {
  const avatar = avatarDe(user)
  const [finales, setFinales] = useState(null)
  const [sel, setSel] = useState(null)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [miUbi, setMiUbi] = useState(null)
  const [ciudadSheet, setCiudadSheet] = useState(false)
  const [irPunto, setIrPunto] = useState(null) // punto para "cómo llegar"
  const [qBarrio, setQBarrio] = useState('') // búsqueda de barrio en el filtro (ciudades grandes)
  const bodyRef = useRef(null) // contenedor scrolleable de la lista, para recordar la posición

  // Al volver de un aviso (el Feed se re-monta), restaurar dónde estaba el scroll.
  useEffect(() => {
    if (bodyRef.current && scrollRef) bodyRef.current.scrollTop = scrollRef.current || 0
  }, [])

  const loc = filtros.localidad // null = todas las localidades
  const prov = filtros.provincia // toda una provincia (localidad === null)
  function abrirCiudadSheet() {
    setCiudadSheet(true) // el drill-down (y en qué provincia abre) vive en SelectorCiudad
  }
  function elegirCiudad(l) {
    setFiltro('localidad', l)
    setFiltro('provincia', null)
    setFiltro('zona', null) // los barrios cambian según la ciudad
    setQBarrio('')
    recordarScopeFeed(l, null)
    // Ojo: acá NO se toca tu ciudad. Mirar no es mudarse — antes, curiosear otra
    // ciudad en el feed te cambiaba desde dónde publicabas. Tu ciudad sale de
    // "Mis ubicaciones" (ver App.jsx).
    setCiudadSheet(false)
  }
  function elegirProvincia(p) {
    setFiltro('localidad', null)
    setFiltro('provincia', p)
    setFiltro('zona', null)
    setQBarrio('')
    recordarScopeFeed(null, p)
    setCiudadSheet(false)
  }
  function elegirTodas() {
    setFiltro('localidad', null)
    setFiltro('provincia', null)
    setFiltro('zona', null)
    setQBarrio('')
    recordarScopeFeed(null, null)
    setCiudadSheet(false)
  }

  function ubicarme() {
    if (!navigator.geolocation) {
      onToast && onToast('Tu navegador no permite ubicación')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setMiUbi([p.coords.latitude, p.coords.longitude]),
      () => onToast && onToast('Activá la ubicación del navegador para verte en el mapa 📍'),
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
      if (prov && provinciaDe(r.localidad || 'Paraná') !== prov) return false
      if (loc && !enZonaDelFeed(r.localidad, loc)) return false // la localidad + sus vecinas del conurbano
      if (filtros.estado === 'perdido' || filtros.estado === 'encontrado') {
        if (r.tipo !== filtros.estado) return false
      }
      if (filtros.especie && r.especie !== filtros.especie) return false
      if (filtros.zona && r.zona !== filtros.zona) return false
      if (!dentroDeRango(r.creadoEn, filtros.tiempo)) return false
      if (texto && !coincideBusqueda(r, texto)) return false
      return true
    })
    return arr
  }, [reportes, finales, verFinales, filtros])

  const marcadores = useMemo(
    () =>
      filtrados.map((r) => {
        const exacto = r.lat != null && r.lng != null
        const [lat, lng] = exacto ? [r.lat, r.lng] : jitter(coordsDeBarrioEn(r.localidad || 'Paraná', r.zona), r.id)
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
        {/* Fila mini: menú (cara) · logo · campana */}
        <div className="hmini">
          <div className={'hmini-side' + (authActivo && !logueado ? ' hmini-side-auto' : '')}>
            {/* logueado incluye la demo (sin auth, logueado=true): mostramos el menú
                para poder llegar a Mis mascotas / Mis ubicaciones. */}
            {logueado ? (
              <button onClick={onMenu} aria-label="Menú">
                {avatar ? (
                  <img className="hd-av" src={avatar} alt="Menú" referrerPolicy="no-referrer" />
                ) : (
                  <span className="mi" style={{ fontSize: 27, color: 'var(--navy)' }}>menu</span>
                )}
              </button>
            ) : authActivo ? (
              <button className="hd-entrar" onClick={onLogin} aria-label="Iniciar sesión">
                <span className="mi" style={{ fontSize: 19 }}>login</span>
                Entrar
              </button>
            ) : null}
          </div>

          <button className="hmini-logo" onClick={resetInicio} aria-label="Ir al inicio">
            <img src="/logo.png" alt="" width="42" height="42" style={{ display: 'block' }} />
            Chicho
          </button>

          <div className={'hmini-side hmini-side-r' + (authActivo && !logueado ? ' hmini-side-auto' : '')}>
            {authActivo && logueado ? (
              <button className="hd-bell" onClick={onNotifs} aria-label="Notificaciones">
                <span className="mi" style={{ fontSize: 26, color: 'var(--navy)' }}>
                  notifications
                </span>
                {notifsNoLeidas > 0 ? (
                  <span className="hd-bell-badge">{notifsNoLeidas > 9 ? '9+' : notifsNoLeidas}</span>
                ) : hayNudge ? (
                  <span className="hd-bell-dot" />
                ) : null}
              </button>
            ) : authActivo && !logueado ? (
              // Espaciador invisible = mismo ancho que "Entrar", para centrar el logo.
              <span className="hd-entrar" aria-hidden="true" style={{ visibility: 'hidden' }}>
                <span className="mi" style={{ fontSize: 19 }}>login</span>
                Entrar
              </span>
            ) : !authActivo ? (
              // Demo: sin campana (no hay bandeja), pero un hueco del ancho del menú
              // para que el logo quede centrado igual.
              <span className="mi" aria-hidden="true" style={{ fontSize: 26, visibility: 'hidden' }}>menu</span>
            ) : null}
          </div>
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
          <button className="fbar-ciudad" onClick={abrirCiudadSheet}>
            <span className="mi" style={{ fontSize: 16 }}>place</span>
            {loc || prov || 'Todas'}
            <span className="mi" style={{ fontSize: 15 }}>expand_more</span>
          </button>
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
          {loc &&
            (() => {
              const barrios = nombresBarriosDe(loc)
              const grande = barrios.length > 30 // Córdoba (400+): buscador en vez de muro de chips
              const q = qBarrio.trim().toLowerCase()
              const mostrar = grande
                ? q
                  ? barrios.filter((b) => b.toLowerCase().includes(q)).slice(0, 40)
                  : filtros.zona
                    ? [filtros.zona]
                    : []
                : barrios
              return (
                <>
                  <div className="fp-label">Barrio</div>
                  {grande && (
                    <input
                      className="fp-buscar"
                      value={qBarrio}
                      onChange={(e) => setQBarrio(e.target.value)}
                      placeholder="Buscá tu barrio…"
                    />
                  )}
                  <div className="chipsel-wrap">
                    {mostrar.map((z) => (
                      <button key={z} className={'chip' + (filtros.zona === z ? ' on' : '')} onClick={() => setFiltro('zona', filtros.zona === z ? null : z)}>
                        {z}
                      </button>
                    ))}
                    {grande && q && mostrar.length === 0 && <span className="fp-vacio">Sin resultados</span>}
                  </div>
                </>
              )
            })()}
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
            center={centroDe(loc || LOCALIDAD_DEFECTO)}
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
                Ya en casa · {filtrados.length}
              </div>
            ) : (
              <>
                {filtros.estado !== 'encontrado' && (
                  <div className="l" style={{ background: '#ff5747' }}>
                    Perdidos · {perdidos}
                  </div>
                )}
                {filtros.estado !== 'perdido' && (
                  <div className="l" style={{ background: '#2f7fed' }}>
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
            <div className="mcard">
              <button className="mcard-info" onClick={() => onOpen(seleccionado)}>
                {seleccionado.foto ? (
                  <img src={seleccionado.foto} alt="" onError={(e) => (e.target.style.display = 'none')} />
                ) : (
                  <div className="noimg" />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: seleccionado.tipo === 'perdido' ? '#ff5747' : '#2f7fed' }} />
                    <span style={{ fontSize: 11, fontWeight: 900, color: seleccionado.tipo === 'perdido' ? '#ff5747' : '#2f7fed' }}>
                      {textoTipo(seleccionado.tipo, seleccionado.enCustodia).toUpperCase()} · {tiempoRelativo(seleccionado.creadoEn)}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 17, marginTop: 1 }}>
                    {nombreMostrado(seleccionado)}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#8a807a' }}>{ubicacionTexto(seleccionado.localidad, seleccionado.zona)}</div>
                </div>
              </button>
              <button className="mcard-ir" onClick={() => setIrPunto(puntoDeReporte(seleccionado))}>
                <span className="mi fill" style={{ fontSize: 19 }}>
                  directions
                </span>
                Cómo llegar
              </button>
            </div>
          ) : (
            <div className="map-hint">Tocá un pin para ver el aviso</div>
          )}
        </div>
      ) : (
        <div className="body" ref={bodyRef} onScroll={(e) => { if (scrollRef) scrollRef.current = e.currentTarget.scrollTop }}>
          {cargando && !verFinales ? (
            <div className="empty">Cargando avisos… 🐾</div>
          ) : verFinales && finales === null ? (
            <div className="empty">Cargando reencuentros…</div>
          ) : filtrados.length === 0 ? (
            <div className="empty">
              {verFinales ? (
                <>
                  🐾 Todavía no hay reencuentros publicados.
                  <br />
                  ¡Ojalá pronto haya muchos reencuentros!
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
            filtrados.map((r, i) => <PetCard key={r.id} r={r} onClick={() => onOpen(r)} posicion={i} />)
          )}
          <div style={{ height: 18 }} />
        </div>
      )}

      {ciudadSheet && (
        <SelectorCiudad
          titulo="¿Qué provincia querés ver?"
          ciudad={loc}
          provincia={prov}
          todas={!loc && !prov}
          onCiudad={elegirCiudad}
          onProvincia={elegirProvincia}
          onTodas={elegirTodas}
          onCerrar={() => setCiudadSheet(false)}
        />
      )}

      {irPunto && <ComoLlegarSheet punto={irPunto} onCerrar={() => setIrPunto(null)} />}
    </div>
  )
}
