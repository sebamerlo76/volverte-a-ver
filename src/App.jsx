/* global __BUILD_ID__ */
import { useEffect, useRef, useState } from 'react'
import Feed from './components/Feed.jsx'
import Detalle from './components/Detalle.jsx'
import Publicar from './components/Publicar.jsx'
import Auth from './components/Auth.jsx'
import MiCuenta from './components/MiCuenta.jsx'
import MascotaForm from './components/MascotaForm.jsx'
import ChapitaQR from './components/ChapitaQR.jsx'
import IntentPublicar from './components/IntentPublicar.jsx'
import ElegirMascota from './components/ElegirMascota.jsx'
import EncontreWizard from './components/EncontreWizard.jsx'
import ReportarAvistamiento from './components/ReportarAvistamiento.jsx'
import MapaRecorrido from './components/MapaRecorrido.jsx'
import BuscadorOverlay from './components/BuscadorOverlay.jsx'
import BottomNav from './components/BottomNav.jsx'
import NotifPanel from './components/NotifPanel.jsx'
import MenuUsuario from './components/MenuUsuario.jsx'
import WelcomeGuide from './components/WelcomeGuide.jsx'
import Admin from './components/Admin.jsx'
import Moderacion from './components/Moderacion.jsx'
import Soporte from './components/Soporte.jsx'
import Lightbox from './components/Lightbox.jsx'
import NuevaPassword from './components/NuevaPassword.jsx'
import { getReportes, getReportePorId, marcarResuelto, reactivarReporte, eliminarReporte, seguirReporte, dejarDeSeguir, getSeguidos, getNotificaciones, marcarNotifLeida, marcarTodasLeidas, marcarLeidasDeReporte } from './data/store.js'
import { supabase, supabaseConfigurado } from './lib/supabase.js'
import { nombreMostrado } from './lib/formato.js'
import { localidadFeedGuardada } from './lib/localidades.js'

export default function App() {
  const [vista, setVista] = useState('feed') // feed | detalle | post | auth | cuenta | avistamiento | recorrido
  const [homeModo, setHomeModo] = useState('lista') // lista | mapa (vista del inicio)
  const FILTROS_INI = { q: '', estado: 'todos', especie: null, zona: null, tiempo: 'todos', orden: 'recientes', localidad: localidadFeedGuardada() }
  const [filtros, setFiltros] = useState(FILTROS_INI) // filtros del inicio (se conservan entre vistas)
  const [buscadorAbierto, setBuscadorAbierto] = useState(false)
  const [selReporte, setSelReporte] = useState(null) // aviso abierto en el detalle
  const [detalleOrigen, setDetalleOrigen] = useState('feed') // a dónde volver al cerrar el detalle
  const [reportes, setReportes] = useState([])
  const [toast, setToast] = useState('')
  const [user, setUser] = useState(null)
  const [editando, setEditando] = useState(null) // aviso en edición, o null
  const [mascotaEditando, setMascotaEditando] = useState(null) // mascota en edición, o null (nueva)
  const [plantilla, setPlantilla] = useState(null) // mascota para prellenar un aviso nuevo
  const [ofrecerGuardar, setOfrecerGuardar] = useState(false) // ofrecer guardar la mascota al publicar
  const [authProximo, setAuthProximo] = useState('feed') // adónde ir tras iniciar sesión
  const [seguidos, setSeguidos] = useState([]) // ids de avisos que sigue el usuario
  const [seguirTrasAuth, setSeguirTrasAuth] = useState(null) // seguir este aviso al loguearse
  const [cartelReporte, setCartelReporte] = useState(null) // cartelito "seguí esta mascota"
  const [notifs, setNotifs] = useState([]) // notificaciones in-app del usuario
  const [notifsAbierto, setNotifsAbierto] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false) // menú de la cara
  const [cuentaSeccion, setCuentaSeccion] = useState('cuenta') // sección abierta de Mi cuenta
  const [guiaAbierta, setGuiaAbierta] = useState(false) // recorrido de bienvenida
  const [soporteAbierto, setSoporteAbierto] = useState(false) // hoja de ayuda/soporte
  const [hayUpdate, setHayUpdate] = useState(false) // hay una versión nueva desplegada
  const [fotosVer, setFotosVer] = useState(null) // foto(s) a pantalla completa: { fotos, i }
  const [recuperando, setRecuperando] = useState(false) // volvió del mail de recupero → elegir nueva pass

  const notifsNoLeidas = notifs.filter((n) => !n.leida).length

  const authActivo = supabaseConfigurado
  const logueado = !authActivo || !!user
  const esAdmin = user?.email === 'sebamerlo76@gmail.com'

  // --- Botón "atrás" del celu: cerrar la capa abierta en vez de cerrar la PWA ---
  // ¿Hay algo "abierto" sobre el feed? (una vista distinta, o un modal)
  const hayCapa =
    vista !== 'feed' || !!fotosVer || menuAbierto || buscadorAbierto || notifsAbierto || guiaAbierta || soporteAbierto || !!cartelReporte
  // Cuántos "atrás" hacen falta para llegar al feed desde la vista actual.
  const nivelVista = (v) => {
    switch (v) {
      case 'feed':
        return 0
      case 'avistamiento':
      case 'recorrido':
      case 'mascota':
      case 'perdido-pick':
      case 'post-encontre':
        return 2 // se abren desde otra vista (detalle / cuenta / post-intent)
      case 'qr':
        return 3 // cuenta → mascota → qr
      default:
        return 1 // detalle, cuenta, post, auth, post-intent, admin, moderacion
    }
  }
  const modalAbierto = menuAbierto || buscadorAbierto || notifsAbierto || guiaAbierta || soporteAbierto || !!cartelReporte
  // Profundidad = capas apiladas = cantidad de "atrás" hasta el feed.
  const profundidad = nivelVista(vista) + (fotosVer ? 1 : 0) + (modalAbierto ? 1 : 0)
  const backRef = useRef({ hayCapa: false })
  backRef.current.hayCapa = hayCapa
  const pushedRef = useRef(0) // cuántas entradas centinela metimos en el historial
  // Snapshot del estado para que el listener (registrado una vez) lea lo actual.
  const estadoRef = useRef({})
  estadoRef.current = { vista, detalleOrigen, fotosVer, menuAbierto, buscadorAbierto, notifsAbierto, guiaAbierta, soporteAbierto, cartelReporte }

  // Cierra la capa de más arriba (foto y modales primero, después vistas).
  function retroceder() {
    const s = estadoRef.current
    if (s.fotosVer) return setFotosVer(null)
    if (s.menuAbierto) return setMenuAbierto(false)
    if (s.buscadorAbierto) return setBuscadorAbierto(false)
    if (s.notifsAbierto) return setNotifsAbierto(false)
    if (s.guiaAbierta) return cerrarGuia()
    if (s.soporteAbierto) return setSoporteAbierto(false)
    if (s.cartelReporte) return setCartelReporte(null)
    switch (s.vista) {
      case 'detalle':
        return setVista(s.detalleOrigen)
      case 'avistamiento':
      case 'recorrido':
        return setVista('detalle')
      case 'perdido-pick':
      case 'post-encontre':
        return setVista('post-intent')
      case 'post':
        return cerrarPublicar()
      case 'mascota':
        return setVista('cuenta')
      case 'qr':
        return setVista('mascota')
      default:
        return setVista('feed') // post-intent, auth, cuenta, admin, moderacion → feed
    }
  }

  // Metemos una entrada "centinela" en el historial por CADA nivel que se abre,
  // así el botón atrás del celu tiene a dónde volver en cada paso (y no cierra la
  // app). Solo empujamos al bajar de nivel; si algo se cierra por UI dejamos las
  // entradas de más — el próximo "atrás" las consume sin efecto visible.
  useEffect(() => {
    while (pushedRef.current < profundidad) {
      pushedRef.current++
      window.history.pushState({ chicho: pushedRef.current }, '')
    }
  }, [profundidad])

  // Un solo listener de popstate: al apretar atrás, cerramos la capa de arriba.
  useEffect(() => {
    function onPop() {
      if (pushedRef.current > 0) pushedRef.current--
      if (backRef.current.hayCapa) retroceder()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cargar reportes al iniciar.
  useEffect(() => {
    cargar()
  }, [])

  // "Hay versión nueva": compara el build actual contra /version.json cada tanto.
  useEffect(() => {
    const actual = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : ''
    if (!actual) return
    let cancel = false
    async function chequear() {
      try {
        const r = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
        if (!r.ok) return
        const d = await r.json()
        if (!cancel && d.v && d.v !== actual) setHayUpdate(true)
      } catch (e) {
        /* sin conexión o dev: ignorar */
      }
    }
    chequear()
    const iv = setInterval(chequear, 5 * 60 * 1000)
    const onVis = () => document.visibilityState === 'visible' && chequear()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancel = true
      clearInterval(iv)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // Recorrido de bienvenida: la primera vez (salvo que entren por un link directo a un aviso).
  useEffect(() => {
    const yaVista = localStorage.getItem('chicho_guia_vista')
    const esLinkDirecto = /^\/r\//.test(window.location.pathname)
    if (!yaVista && !esLinkDirecto) setGuiaAbierta(true)
  }, [])

  // Link directo a un aviso: chicho.ar/r/<id> abre el detalle de ese aviso.
  useEffect(() => {
    const m = window.location.pathname.match(/^\/r\/([\w-]+)/)
    if (!m) return
    // Armamos el historial ANTES del fetch (sincrónico) para que el botón atrás
    // del celu tenga siempre el feed atrás y no cierre la app: entrada base '/'
    // (feed) + una entrada apilada para el detalle. No dependemos del efecto de
    // profundidad (que empuja async y deja una ventana de carrera).
    window.history.replaceState({}, '', '/')
    window.history.pushState({ chicho: 1 }, '', '/')
    pushedRef.current = 1 // el sistema ya sabe que hay 1 capa apilada
    getReportePorId(m[1])
      .then((r) => r && abrirDetalle(r, 'feed'))
      .catch(() => {})
  }, [])

  // Seguir el estado de la sesión (solo si hay Supabase).
  useEffect(() => {
    if (!authActivo) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((evento, session) => {
      setUser(session?.user ?? null)
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [authActivo])

  // Avisos que sigue el usuario (para el botón Seguir / Siguiendo).
  useEffect(() => {
    if (user?.id) getSeguidos(user.id).then(setSeguidos).catch(() => setSeguidos([]))
    else setSeguidos([])
  }, [user?.id])

  // Notificaciones in-app del usuario (para la campanita).
  useEffect(() => {
    if (user?.id) getNotificaciones(user.id).then(setNotifs).catch(() => setNotifs([]))
    else setNotifs([])
  }, [user?.id])

  // Refrescar al entrar a Mi cuenta, para que el chip "Novedad" esté al día.
  useEffect(() => {
    if (vista === 'cuenta' && user?.id) {
      getNotificaciones(user.id).then(setNotifs).catch(() => {})
    }
  }, [vista, user?.id])

  async function cargar() {
    try {
      setReportes(await getReportes())
    } catch (e) {
      console.error('No se pudieron cargar los reportes:', e)
      mostrarToast('No se pudieron cargar los reportes 😕')
    }
  }

  function mostrarToast(msg) {
    setToast(msg)
    window.clearTimeout(mostrarToast._t)
    mostrarToast._t = window.setTimeout(() => setToast(''), 2600)
  }

  function navegar(tab) {
    if (tab === 'post') {
      if (logueado) {
        setEditando(null)
        setPlantilla(null)
        setOfrecerGuardar(false)
        setVista('post-intent')
      } else {
        setAuthProximo('post')
        setVista('auth')
      }
      return
    }
    setVista(tab)
  }

  // --- Inicio / filtros ---
  function setFiltro(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }))
  }
  function resetInicio() {
    setFiltros(FILTROS_INI)
    setHomeModo('lista')
    setVista('feed')
    const b = document.querySelector('.body')
    if (b) b.scrollTop = 0
  }

  // Barra inferior: Inicio · Buscar · Publicar · Mapa/Lista
  function navBarra(accion) {
    if (accion === 'post') return navegar('post')
    if (accion === 'buscar') return setBuscadorAbierto(true)
    if (accion === 'inicio') return resetInicio()
    if (accion === 'toggle') return setHomeModo((m) => (m === 'mapa' ? 'lista' : 'mapa'))
  }

  function abrirDetalle(reporte, origen = 'feed') {
    setDetalleOrigen(origen)
    setSelReporte(reporte)
    setVista('detalle')
    // Al abrir un aviso, damos por leídas sus novedades.
    if (user?.id && reporte?.id && notifs.some((n) => !n.leida && n.reporteId === reporte.id)) {
      setNotifs((arr) => arr.map((x) => (x.reporteId === reporte.id ? { ...x, leida: true } : x)))
      marcarLeidasDeReporte(user.id, reporte.id).catch(() => {})
    }
  }

  // --- Menú de la cara ---
  function irSeccion(sec) {
    setMenuAbierto(false)
    if (sec === 'guia') {
      setGuiaAbierta(true)
      return
    }
    if (sec === 'ayuda') {
      setSoporteAbierto(true)
      return
    }
    if (sec === 'admin') {
      setVista('admin')
      return
    }
    if (sec === 'moderacion') {
      setVista('moderacion')
      return
    }
    setCuentaSeccion(sec)
    setVista('cuenta')
  }
  function cerrarGuia() {
    setGuiaAbierta(false)
    try {
      localStorage.setItem('chicho_guia_vista', '1')
    } catch (e) {
      /* storage bloqueado: no pasa nada */
    }
  }

  // --- Notificaciones (campanita) ---
  async function abrirNotifs() {
    setNotifsAbierto(true)
    if (user?.id) {
      try {
        setNotifs(await getNotificaciones(user.id))
      } catch (e) {
        /* dejamos las que ya teníamos */
      }
    }
  }
  function abrirDesdeNotif(n) {
    setNotifs((arr) => arr.map((x) => (x.id === n.id ? { ...x, leida: true } : x)))
    marcarNotifLeida(n.id).catch(() => {})
    setNotifsAbierto(false)
    if (n.reporteId) {
      getReportePorId(n.reporteId)
        .then((r) => r && abrirDetalle(r, 'feed'))
        .catch(() => {})
    }
  }
  function marcarTodasNotifs() {
    setNotifs((arr) => arr.map((x) => ({ ...x, leida: true })))
    if (user?.id) marcarTodasLeidas(user.id).catch(() => {})
  }

  function toggleSeguir(reporte) {
    if (!reporte) return
    if (!logueado) {
      setCartelReporte(reporte) // sin cuenta → ofrecer crearla y seguir
      return
    }
    const id = reporte.id
    if (seguidos.includes(id)) {
      dejarDeSeguir(id).catch(() => {})
      setSeguidos((s) => s.filter((x) => x !== id))
      mostrarToast('Dejaste de seguir')
    } else {
      seguirReporte(id).catch(() => {})
      setSeguidos((s) => (s.includes(id) ? s : [...s, id]))
      mostrarToast('🔔 Siguiendo — te aviso si hay novedades')
    }
  }

  async function alPublicar() {
    const eraEdicion = !!editando
    await cargar()
    setEditando(null)
    setPlantilla(null)
    setOfrecerGuardar(false)
    setVista('feed')
    mostrarToast(eraEdicion ? '✅ Aviso actualizado' : '✅ ¡Reporte publicado! Ya aparece en el inicio.')
  }

  // --- Sesión ---
  function pedirLogin() {
    setAuthProximo('feed')
    setVista('auth')
  }
  async function salir() {
    if (authActivo) await supabase.auth.signOut()
    setMenuAbierto(false) // cerrar la sidebar al salir (si no, queda mostrando "Cerrar sesión")
    setVista('feed')
    mostrarToast('Sesión cerrada')
  }
  function trasAuth() {
    if (seguirTrasAuth) {
      const id = seguirTrasAuth
      setSeguirTrasAuth(null)
      seguirReporte(id)
        .then(() => setSeguidos((s) => (s.includes(id) ? s : [...s, id])))
        .catch(() => {})
      setVista('detalle')
      mostrarToast('🔔 ¡Listo! Seguís esta búsqueda. Activá la campana en Mi cuenta para recibir los avisos.')
      return
    }
    mostrarToast('¡Bienvenido! 🐾')
    if (authProximo === 'post') {
      setEditando(null)
      setPlantilla(null)
      setOfrecerGuardar(false)
      setVista('post-intent')
    } else {
      setVista('feed')
    }
  }

  // --- Flujo de publicar (dos caminos) ---
  function elegirMascotaPerdida(m) {
    setPlantilla({ ...m, tipo: 'perdido', mascotaId: m.id })
    setOfrecerGuardar(false)
    setVista('post')
  }
  function perdidoNueva() {
    setPlantilla({ tipo: 'perdido' })
    setOfrecerGuardar(true) // ofrecer guardarla en el perfil
    setVista('post')
  }
  function cerrarPublicar() {
    setEditando(null)
    setPlantilla(null)
    setOfrecerGuardar(false)
    setVista('feed')
  }

  // --- Gestión de mis avisos ---
  function editar(reporte) {
    setEditando(reporte)
    setVista('post')
  }
  async function resolver(id) {
    try {
      await marcarResuelto(id)
      await cargar()
      setVista(detalleOrigen)
      mostrarToast('🎉 ¡Ya está en casa!')
    } catch (e) {
      console.error(e)
      mostrarToast('No se pudo actualizar 😕')
    }
  }
  async function reactivar(id) {
    try {
      await reactivarReporte(id)
      await cargar()
      setVista(detalleOrigen)
      mostrarToast('Aviso reactivado')
    } catch (e) {
      console.error(e)
      mostrarToast('No se pudo reactivar 😕')
    }
  }
  async function borrar(id) {
    if (!window.confirm('¿Seguro que querés borrar este aviso? No se puede deshacer.')) return
    try {
      await eliminarReporte(id)
      await cargar()
      setVista(detalleOrigen)
      mostrarToast('Aviso borrado')
    } catch (e) {
      console.error(e)
      mostrarToast('No se pudo borrar 😕')
    }
  }

  // --- Mis mascotas ---
  function nuevaMascota() {
    setMascotaEditando(null)
    setVista('mascota')
  }
  function editarMascota(m) {
    setMascotaEditando(m)
    setVista('mascota')
  }
  function mascotaGuardada() {
    setVista('cuenta')
    mostrarToast('🐾 Mascota guardada')
  }
  function publicarMascota(m) {
    // Prellena un aviso "perdido" con los datos de la mascota (y la deja vinculada).
    setPlantilla({ ...m, tipo: 'perdido', mascotaId: m.id })
    setEditando(null)
    setVista('post')
  }

  const seleccionado = selReporte
  const esMio = seleccionado ? !authActivo || (user && seleccionado.userId === user.id) : false

  return (
    <div className="app-shell">
      <div className="app">
        {hayUpdate && (
          <button className="update-banner" onClick={() => window.location.reload()}>
            <span className="mi" style={{ fontSize: 18 }}>
              rocket_launch
            </span>
            Hay una versión nueva — <b>&nbsp;Actualizar</b>
          </button>
        )}
        {vista === 'feed' && (
          <Feed
            reportes={reportes}
            onOpen={abrirDetalle}
            onToast={mostrarToast}
            authActivo={authActivo}
            logueado={logueado}
            user={user}
            onLogin={pedirLogin}
            onMenu={() => setMenuAbierto(true)}
            onNotifs={abrirNotifs}
            notifsNoLeidas={notifsNoLeidas}
            modo={homeModo}
            filtros={filtros}
            setFiltro={setFiltro}
            resetInicio={resetInicio}
          />
        )}
        {vista === 'detalle' && (
          <Detalle
            r={seleccionado}
            esMio={esMio}
            puedeSeguir={!esMio}
            siguiendo={seleccionado ? seguidos.includes(seleccionado.id) : false}
            onSeguir={() => toggleSeguir(seleccionado)}
            onVolver={() => setVista(detalleOrigen)}
            onToast={mostrarToast}
            onEditar={editar}
            onBorrar={borrar}
            onResuelto={resolver}
            onReactivar={reactivar}
            onAvistar={() => setVista('avistamiento')}
            onMaximizar={() => setVista('recorrido')}
            onVerFotos={(fotos, i) => setFotosVer({ fotos, i })}
          />
        )}
        {vista === 'avistamiento' && seleccionado && (
          <ReportarAvistamiento
            reporte={seleccionado}
            onCerrar={() => setVista('detalle')}
            onEnviado={() => {
              setVista('detalle')
              mostrarToast('👀 ¡Gracias! Tu avistamiento se sumó al recorrido')
              if (!logueado) setCartelReporte(seleccionado)
            }}
            onToast={mostrarToast}
          />
        )}
        {vista === 'recorrido' && seleccionado && (
          <MapaRecorrido reporte={seleccionado} onCerrar={() => setVista('detalle')} />
        )}
        {vista === 'post-intent' && (
          <IntentPublicar
            onPerdido={() => setVista('perdido-pick')}
            onEncontre={() => setVista('post-encontre')}
            onCerrar={() => setVista('feed')}
          />
        )}
        {vista === 'perdido-pick' && (
          <ElegirMascota
            user={user}
            onElegir={elegirMascotaPerdida}
            onOtra={perdidoNueva}
            onVolver={() => setVista('post-intent')}
          />
        )}
        {vista === 'post-encontre' && (
          <EncontreWizard
            reportes={reportes}
            telefonoGuardado={user?.user_metadata?.telefono || ''}
            onVerAviso={abrirDetalle}
            onCerrar={() => setVista('post-intent')}
            onPublicado={alPublicar}
            onToast={mostrarToast}
          />
        )}
        {vista === 'post' && (
          <Publicar
            inicial={editando}
            plantilla={plantilla}
            ofrecerGuardar={ofrecerGuardar}
            telefonoGuardado={user?.user_metadata?.telefono || ''}
            onCerrar={cerrarPublicar}
            onPublicado={alPublicar}
            onToast={mostrarToast}
          />
        )}
        {vista === 'auth' && <Auth onCerrar={() => setVista('feed')} onAuth={trasAuth} onToast={mostrarToast} />}
        {vista === 'cuenta' && (
          <MiCuenta
            user={user}
            seccion={cuentaSeccion}
            notifs={notifs}
            onVolver={() => setVista('feed')}
            onAbrir={(r) => abrirDetalle(r, 'cuenta')}
            onLogout={salir}
            onNuevaMascota={nuevaMascota}
            onEditarMascota={editarMascota}
            onPublicarMascota={publicarMascota}
            onToast={mostrarToast}
          />
        )}
        {vista === 'mascota' && (
          <MascotaForm
            inicial={mascotaEditando}
            onCerrar={() => setVista('cuenta')}
            onGuardado={mascotaGuardada}
            onToast={mostrarToast}
            onVerQR={(m) => {
              setMascotaEditando(m)
              setVista('qr')
            }}
          />
        )}
        {vista === 'qr' && mascotaEditando && (
          <ChapitaQR mascota={mascotaEditando} onCerrar={() => setVista('mascota')} onToast={mostrarToast} />
        )}
        {cartelReporte && (
          <div className="match-modal" onClick={() => setCartelReporte(null)}>
            <div className="match-card" onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 44, lineHeight: 1 }}>🐾</div>
              <div className="match-nombre" style={{ marginTop: 6 }}>¿Te aviso si hay novedades?</div>
              <div className="match-desc">
                Creá tu cuenta y seguí la búsqueda de <b>{nombreMostrado(cartelReporte)}</b>. Te aviso si
                alguien más lo ve o si aparece.
              </div>
              <button
                className="btn-wa"
                style={{ background: 'var(--teal)', width: '100%' }}
                onClick={() => {
                  setSeguirTrasAuth(cartelReporte.id)
                  setSelReporte(cartelReporte)
                  setCartelReporte(null)
                  setAuthProximo('feed')
                  setVista('auth')
                }}
              >
                <span className="mi fill" style={{ fontSize: 22 }}>
                  person_add
                </span>
                Crear cuenta y seguir
              </button>
              <button className="match-no" onClick={() => setCartelReporte(null)}>
                Ahora no
              </button>
            </div>
          </div>
        )}
        {vista === 'feed' && <BottomNav modo={homeModo} onNav={navBarra} />}

        {vista === 'admin' && esAdmin && <Admin onVolver={() => setVista('feed')} />}
        {vista === 'moderacion' && esAdmin && <Moderacion onVolver={() => setVista('feed')} />}

        {guiaAbierta && <WelcomeGuide onClose={cerrarGuia} />}

        {soporteAbierto && <Soporte onCerrar={() => setSoporteAbierto(false)} />}

        {menuAbierto && (
          <MenuUsuario user={user} esAdmin={esAdmin} onSeccion={irSeccion} onLogout={salir} onCerrar={() => setMenuAbierto(false)} />
        )}

        {notifsAbierto && (
          <NotifPanel
            notifs={notifs}
            onClose={() => setNotifsAbierto(false)}
            onAbrir={abrirDesdeNotif}
            onMarcarTodas={marcarTodasNotifs}
          />
        )}

        {buscadorAbierto && (
          <BuscadorOverlay
            reportes={reportes}
            q={filtros.q}
            onQ={(v) => setFiltro('q', v)}
            onOpen={(r) => {
              setBuscadorAbierto(false)
              abrirDetalle(r)
            }}
            onCerrar={() => setBuscadorAbierto(false)}
          />
        )}

        {recuperando && (
          <NuevaPassword
            onListo={() => {
              setRecuperando(false)
              setVista('feed')
            }}
            onToast={mostrarToast}
          />
        )}
      </div>

      {fotosVer && <Lightbox fotos={fotosVer.fotos} inicio={fotosVer.i} onCerrar={() => setFotosVer(null)} />}

      <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>
    </div>
  )
}
