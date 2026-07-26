import { useEffect, useMemo, useRef, useState } from 'react'
import PetCard from './PetCard.jsx'
import BannerInstalar from './BannerInstalar.jsx'
import MapaLeaflet from './MapaLazy.jsx'
import { getReencontrados } from '../data/store.js'
import { avatarDe, nombreMostrado, tiempoRelativo, dentroDeRango } from '../lib/formato.js'
import { NOMBRES_LOCALIDADES, LOCALIDAD_DEFECTO, centroDe, nombresBarriosDe, coordsDeBarrioEn, recordarLocalidad, recordarScopeFeed, provinciaDe, ubicacionTexto, avisoEnZona, vecinasDe } from '../lib/localidades.js'
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

export default function Feed({ reportes, cargando, onOpen, onToast, authActivo, logueado, user, onLogin, onMenu, onNotifs, onBuscar, notifsNoLeidas = 0, hayNudge, modo, filtros, setFiltro, resetInicio, scrollRef }) {
  const avatar = avatarDe(user)
  const [finales, setFinales] = useState(null)
  const [sel, setSel] = useState(null)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [miUbi, setMiUbi] = useState(null)
  const [ciudadSheet, setCiudadSheet] = useState(false)
  const [irPunto, setIrPunto] = useState(null) // punto para "cómo llegar"
  const [qBarrio, setQBarrio] = useState('') // búsqueda de barrio en el filtro (ciudades grandes)
  const bodyRef = useRef(null) // contenedor scrolleable de la lista, para recordar la posición
  const [dirSlide, setDirSlide] = useState(0) // de dónde entra el contenido al cambiar de pestaña: 1 = swipe a la izq, -1 = a la der, 0 = tap

  // Al volver de un aviso (el Feed se re-monta), restaurar dónde estaba el scroll.
  useEffect(() => {
    if (bodyRef.current && scrollRef) bodyRef.current.scrollTop = scrollRef.current || 0
  }, [])

  // Cambio de pestaña de estado (tap o swipe): mismo camino para los dos. Resetea el
  // scroll guardado — heredar la posición de otra pestaña era un bug de UX.
  function irAPestana(k, dir = 0) {
    if (k === filtros.estado) return
    setDirSlide(dir)
    setFiltro('estado', k)
    if (scrollRef) scrollRef.current = 0
  }

  // La pestaña activa siempre visible en la fila (en pantallas angostas .tabs scrollea).
  useEffect(() => {
    document.querySelector('.tabs .tab.on')?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [filtros.estado])

  // --- Swipe horizontal sobre la lista = cambiar de pestaña (estilo Instagram) ---
  // Detector puro (no bloquea el scroll nativo: los onTouch* de React son pasivos).
  // Vive en el .body, así el mapa (Leaflet arrastra) y el panel de filtros quedan
  // afuera solos: cuando están montados, el .body no existe.
  const sw = useRef({ activo: false, x0: 0, y0: 0, t0: 0, modo: null }) // modo: null | 'h' | 'v'
  const SW_BORDE = 28 // px: arranques pegados al borde son del sistema (atrás de Android / iOS)
  const SW_DECIDIR = 12 // px: a esta distancia se fija horizontal o vertical, sin vuelta atrás
  const SW_UMBRAL = 60 // px: desplazamiento mínimo para cambiar de pestaña
  const SW_RATIO = 1.5 // lo horizontal tiene que dominar por este factor (evita diagonales)
  const SW_MAX_MS = 600 // más lento que esto es un arrastre, no un swipe

  function swStart(e) {
    const t = e.touches[0]
    if (e.touches.length !== 1 || t.clientX < SW_BORDE || t.clientX > window.innerWidth - SW_BORDE) {
      sw.current.activo = false
      return
    }
    sw.current = { activo: true, x0: t.clientX, y0: t.clientY, t0: Date.now(), modo: null }
  }
  function swMove(e) {
    const s = sw.current
    if (!s.activo || s.modo) return // ya decidido: no se reconsidera en todo el gesto
    const t = e.touches[0]
    const dx = t.clientX - s.x0
    const dy = t.clientY - s.y0
    if (Math.abs(dy) > SW_DECIDIR && Math.abs(dy) >= Math.abs(dx)) s.modo = 'v' // scroll: swipe muerto
    else if (Math.abs(dx) > SW_DECIDIR && Math.abs(dx) > Math.abs(dy) * SW_RATIO) s.modo = 'h'
  }
  function swEnd(e) {
    // Copiar ANTES de apagar: sw.current es el mismo objeto, si apagáramos primero
    // el chequeo de abajo se leería a sí mismo y saldría siempre temprano.
    const { activo, modo, x0, y0, t0 } = sw.current
    sw.current.activo = false
    if (!activo || modo !== 'h' || Date.now() - t0 > SW_MAX_MS) return
    const t = e.changedTouches[0]
    const dx = t.clientX - x0
    const dy = t.clientY - y0
    // Re-chequeo con los totales: un arranque horizontal que degeneró en diagonal no pasa.
    if (Math.abs(dx) < SW_UMBRAL || Math.abs(dx) < Math.abs(dy) * SW_RATIO) return
    const i = TABS.findIndex((tab) => tab.k === filtros.estado)
    const j = dx < 0 ? i + 1 : i - 1 // a la izquierda = pestaña siguiente (como IG)
    if (j < 0 || j >= TABS.length) return // sin dar la vuelta en los extremos
    irAPestana(TABS[j].k, dx < 0 ? 1 : -1)
  }
  function swCancel() {
    sw.current.activo = false
  }

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
      // Localidad + lo que esté a <= 20 km; "solo esta localidad" apaga las vecinas.
      if (loc) {
        const entra = filtros.soloLocalidad ? (r.localidad || 'Paraná') === loc : avisoEnZona(r, loc)
        if (!entra) return false
      }
      if (filtros.estado === 'perdido' || filtros.estado === 'encontrado') {
        if (r.tipo !== filtros.estado) return false
      }
      if (filtros.especie && r.especie !== filtros.especie) return false
      if (filtros.zona && r.zona !== filtros.zona) return false
      if (!dentroDeRango(r.creadoEn, filtros.tiempo)) return false
      if (texto && !coincideBusqueda(r, texto)) return false
      return true
    })
    // La fuente ya viene más nuevos primero; "antiguos" la da vuelta (los que más
    // tiempo llevan buscando, arriba).
    if (filtros.orden === 'antiguos') arr.sort((a, b) => (a.creadoEn > b.creadoEn ? 1 : -1))
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

  // Vuelve todos los filtros del panel a su estado neutro (no toca la ciudad ni la
  // pestaña: eso es el "dónde" y el "qué", no el filtrado fino).
  function limpiarFiltros() {
    setFiltro('q', '')
    setFiltro('especie', null)
    setFiltro('zona', null)
    setFiltro('tiempo', 'todos')
    setFiltro('orden', 'recientes')
    setFiltro('soloLocalidad', false)
  }

  // Filtros activos (para el contador del botón Filtrar y el chip Limpiar)
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
  if (filtros.orden === 'antiguos') chips.push({ key: 'orden', label: 'Más antiguos', clear: () => setFiltro('orden', 'recientes') })
  if (filtros.soloLocalidad && loc) chips.push({ key: 'solo', label: `Solo ${loc}`, clear: () => setFiltro('soloLocalidad', false) })

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

          <div className="hmini-side hmini-side-r">
            <button className="hd-bell" onClick={onBuscar} aria-label="Buscar">
              <span className="mi" style={{ fontSize: 25, color: 'var(--navy)' }}>
                search
              </span>
            </button>
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
            ) : null}
          </div>
        </div>

        {/* Pestañas de estado (con acento de color) */}
        <div className="tabs">
          {TABS.map((tab) => (
            <button key={tab.k} className={'tab' + (filtros.estado === tab.k ? ' on' : '')} onClick={() => irAPestana(tab.k)}>
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
            {chips.length > 0 && <span className="fbar-badge">{chips.length}</span>}
          </button>
          {/* Un solo chip para soltar todo: el detalle de qué está filtrando vive en el
              panel (chips prendidos). Antes había un chip por filtro y la barra crecía
              a dos líneas. */}
          {chips.length > 0 && (
            <button className="fchip" onClick={limpiarFiltros}>
              Limpiar
            </button>
          )}
          <span className="fbar-count">
            {filtrados.length} {filtrados.length === 1 ? 'aviso' : 'avisos'}
          </span>
        </div>

      </div>

      {/* El panel de filtros tapa los resultados mientras está abierto; al cerrar, muestra los filtrados */}
      {panelAbierto ? (
        <div className="filtros-panel">
          {loc && vecinasDe(loc).length > 0 && (
            <>
              <div className="fp-label">Zona</div>
              <div className="chipsel-wrap">
                <button className={'chip' + (!filtros.soloLocalidad ? ' on' : '')} onClick={() => setFiltro('soloLocalidad', false)}>
                  {loc} y alrededores
                </button>
                <button className={'chip' + (filtros.soloLocalidad ? ' on' : '')} onClick={() => setFiltro('soloLocalidad', true)}>
                  Solo {loc}
                </button>
              </div>
            </>
          )}
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
          <div className="fp-label">Orden</div>
          <div className="chipsel-wrap">
            {[
              { k: 'recientes', t: 'Más recientes' },
              { k: 'antiguos', t: 'Más antiguos' },
            ].map((o) => (
              <button key={o.k} className={'chip' + (filtros.orden === o.k ? ' on' : '')} onClick={() => setFiltro('orden', o.k)}>
                {o.t}
              </button>
            ))}
          </div>
          {/* Sin "Limpiar" acá: la barra de arriba queda visible con el panel abierto
              y ya tiene el suyo. */}
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
        <div
          className="body body-feed"
          key={filtros.estado} /* re-monta al cambiar de pestaña: re-dispara la animación y el scroll nace en 0 */
          data-slide={dirSlide === 0 ? undefined : dirSlide === 1 ? 'der' : 'izq'}
          ref={bodyRef}
          onScroll={(e) => { if (scrollRef) scrollRef.current = e.currentTarget.scrollTop }}
          onTouchStart={swStart}
          onTouchMove={swMove}
          onTouchEnd={swEnd}
          onTouchCancel={swCancel}
        >
          {!verFinales && <BannerInstalar />}
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
            filtrados.map((r, i) => (
              <PetCard
                key={r.id}
                r={r}
                onClick={() => onOpen(r)}
                posicion={i}
                zonaVecina={!!loc && !filtros.soloLocalidad && (r.localidad || 'Paraná') !== loc}
              />
            ))
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
