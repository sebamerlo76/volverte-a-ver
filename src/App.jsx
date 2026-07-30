/* global __BUILD_ID__ */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
// De arranque va SOLO lo que se ve al abrir la app: el feed, su tarjeta y la barra.
// Todo lo demás se baja cuando se usa (code splitting).
//
// Por qué: el bundle inicial pesaba 655 KB y PageSpeed móvil (que simula 4G lenta +
// CPU 4x más lenta) daba 58 de rendimiento con el LCP en 11,5 s de laboratorio: las
// fotos son el último eslabón de la cadena, el cuello era bajar y ejecutar todo ese
// JS. Y el público de Chicho entra desde un celu modesto con datos móviles, muchas
// veces en la calle buscando a su mascota.
import Feed from './components/Feed.jsx'
import BottomNav from './components/BottomNav.jsx'
import Detalle from './components/Detalle.jsx' // se abre en cada toque del feed: va de arranque

// Vistas (reemplazan la pantalla): segundas pantallas, nadie las ve en la 1ª carga.
const Publicar = lazy(() => import('./components/Publicar.jsx'))
const Auth = lazy(() => import('./components/Auth.jsx'))
const MiCuenta = lazy(() => import('./components/MiCuenta.jsx'))
const MascotaForm = lazy(() => import('./components/MascotaForm.jsx'))
const ChapitaQR = lazy(() => import('./components/ChapitaQR.jsx'))
const IntentPublicar = lazy(() => import('./components/IntentPublicar.jsx'))
const ElegirMascota = lazy(() => import('./components/ElegirMascota.jsx'))
const EncontreWizard = lazy(() => import('./components/EncontreWizard.jsx'))
const ReportarAvistamiento = lazy(() => import('./components/ReportarAvistamiento.jsx'))
const MapaRecorrido = lazy(() => import('./components/MapaRecorrido.jsx'))
const Admin = lazy(() => import('./components/Admin.jsx'))
const Moderacion = lazy(() => import('./components/Moderacion.jsx'))
const NuevaPassword = lazy(() => import('./components/NuevaPassword.jsx'))
const Novedades = lazy(() => import('./components/Novedades.jsx'))

// Modales y hojas (se abren encima): van con fallback null, aparecen al instante
// siguiente sin tapar lo que se está viendo.
const BuscadorOverlay = lazy(() => import('./components/BuscadorOverlay.jsx'))
const NotifPanel = lazy(() => import('./components/NotifPanel.jsx'))
const MenuUsuario = lazy(() => import('./components/MenuUsuario.jsx'))
const WelcomeGuide = lazy(() => import('./components/WelcomeGuide.jsx'))
const Soporte = lazy(() => import('./components/Soporte.jsx'))
const Lightbox = lazy(() => import('./components/Lightbox.jsx'))
import { getReportes, getReportePorId, marcarResuelto, reactivarReporte, eliminarReporte, borrarReporteAdmin, seguirReporte, dejarDeSeguir, getSeguidos, getNotificaciones, marcarNotifLeida, marcarTodasLeidas, marcarLeidasDeReporte, getUbicaciones, marcarCompartido } from './data/store.js'
import { supabase, supabaseConfigurado } from './lib/supabase.js'
import { contarLogin, logins, pasosOk } from './lib/pasos.js'
import { nombreMostrado } from './lib/formato.js'
import { scopeFeedGuardado, provinciaDe, recordarLocalidad, avisoEnZona } from './lib/localidades.js'
import { confirmar } from './lib/confirmar.js'
import { compartirFlyer } from './lib/flyer.js'
import { decidirModo as decidirModoAvisos } from './lib/avisos-push.js'
const FestejoReencuentro = lazy(() => import('./components/FestejoReencuentro.jsx'))
const PedirAvisos = lazy(() => import('./components/PedirAvisos.jsx'))
const CompartiAhora = lazy(() => import('./components/CompartiAhora.jsx'))

// Pantalla de espera mientras baja el código de una vista (una sola vez por vista;
// después queda en la caché del navegador).
function CargandoVista() {
  return (
    <div className="view">
      <div className="body">
        <div className="empty" style={{ padding: '40px 30px' }}>Cargando…</div>
      </div>
    </div>
  )
}

export default function App() {
  const [vista, setVista] = useState('feed') // feed | detalle | post | auth | cuenta | avistamiento | recorrido
  const [homeModo, setHomeModo] = useState('lista') // lista | mapa (vista del inicio)
  const SCOPE_INI = scopeFeedGuardado()
  const FILTROS_INI = { q: '', estado: 'todos', especie: null, zona: null, tiempo: 'todos', orden: 'recientes', localidad: SCOPE_INI.localidad, provincia: SCOPE_INI.provincia, soloLocalidad: false }
  const [filtros, setFiltros] = useState(FILTROS_INI) // filtros del inicio (se conservan entre vistas)
  const [buscadorAbierto, setBuscadorAbierto] = useState(false)
  // El panel de filtros del feed vive acá (no en Feed) para que el botón atrás del
  // celu lo cierre en vez de sacarte de la app.
  const [filtrosAbierto, setFiltrosAbierto] = useState(false)
  // Pasos apilados del wizard de Encontré (paso - 1): cada paso cuenta como capa,
  // así el atrás del celu retrocede de a un paso en vez de volver al feed de una.
  const [wizPasos, setWizPasos] = useState(0)
  const wizAtrasRef = useRef(null) // función del wizard para retroceder un paso
  const [selReporte, setSelReporte] = useState(null) // aviso abierto en el detalle
  const [detalleOrigen, setDetalleOrigen] = useState('feed') // a dónde volver al cerrar el detalle
  const [reportes, setReportes] = useState([])
  const [cargandoReportes, setCargandoReportes] = useState(true) // 1ª carga: distinguir "cargando" de "vacío"
  const [toast, setToast] = useState('')
  // En el Chicho demo (sin Supabase) no hay login, pero las pantallas de cuenta
  // (Mis mascotas, Mis ubicaciones) necesitan un usuario para tener un id. Le damos
  // uno falso, fijo. En producción esto es null y manda la sesión real de abajo.
  // id 'local': tiene que coincidir con el userId que addReporte le pone a los avisos
  // en modo local, si no "Mis avisos" queda vacío (filtra por userId).
  const [user, setUser] = useState(supabaseConfigurado ? null : { id: 'local', email: '', user_metadata: { nombre: 'Vos' } })
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
  const [nudge, setNudge] = useState(false) // avisar "primeros pasos" (desde el 2º login, si falta algo)
  const contadoRef = useRef(false)
  const feedScrollRef = useRef(0) // recuerda el scroll del feed al entrar a un aviso
  const [festejo, setFestejo] = useState(null) // aviso recién resuelto, para ofrecer compartir el reencuentro
  // Recién siguió un aviso: momento de máxima intención para ofrecerle los avisos
  // push. Guarda el MODO ('activar' | 'instalar') y solo se levanta si hay algo que
  // ofrecer — decidirlo antes evita abrir y cerrar la capa al vuelo (el sistema del
  // botón atrás se comería un toque empujando y sacando un centinela).
  const [pedirAvisos, setPedirAvisos] = useState(null)
  const [compartiNuevo, setCompartiNuevo] = useState(null) // aviso recién publicado, para ofrecer compartirlo ya

  const notifsNoLeidas = notifs.filter((n) => !n.leida).length

  const authActivo = supabaseConfigurado
  const logueado = !authActivo || !!user
  const esAdmin = user?.email === 'sebamerlo76@gmail.com'

  // --- Botón "atrás" del celu: cerrar la capa abierta en vez de cerrar la PWA ---
  // ¿Hay algo "abierto" sobre el feed? (una vista distinta, o un modal)
  const hayCapa =
    vista !== 'feed' || homeModo === 'mapa' || !!fotosVer || menuAbierto || buscadorAbierto || filtrosAbierto || notifsAbierto || guiaAbierta || soporteAbierto || !!cartelReporte || !!festejo || !!compartiNuevo || !!pedirAvisos
  // Cuántos "atrás" hacen falta para llegar al feed desde la vista actual.
  const nivelVista = (v) => {
    switch (v) {
      case 'feed':
        return 0
      case 'avistamiento':
      case 'recorrido':
      case 'mascota':
        return 2 // se abren desde otra vista (detalle / cuenta)
      case 'qr':
        return 3 // cuenta → mascota → qr
      default:
        return 1 // detalle, cuenta, post, perdido-pick, post-encontre, auth, admin
    }
  }
  // El festejo cuenta como capa: si no, el "atrás" del celu te saca de la pantalla
  // en vez de cerrarlo. Antes salía sólo desde el aviso; ahora también en Mi cuenta.
  const modalAbierto = menuAbierto || buscadorAbierto || filtrosAbierto || notifsAbierto || guiaAbierta || soporteAbierto || !!cartelReporte || !!festejo || !!compartiNuevo || !!pedirAvisos
  // Profundidad = capas apiladas = cantidad de "atrás" hasta el feed.
  // El mapa cuenta como capa: el atrás vuelve a la lista, no saca de la app.
  const profundidad =
    nivelVista(vista) +
    (vista === 'feed' && homeModo === 'mapa' ? 1 : 0) +
    (vista === 'post-encontre' || vista === 'avistamiento' ? wizPasos : 0) +
    (fotosVer ? 1 : 0) +
    (modalAbierto ? 1 : 0)
  const backRef = useRef({ hayCapa: false })
  backRef.current.hayCapa = hayCapa
  const pushedRef = useRef(0) // cuántas entradas centinela metimos en el historial
  const aRemover = useRef(0) // centinelas de más por sacar del historial (cierre por UI)
  const removiendo = useRef(false) // estamos sacando centinelas nosotros (ignorar esos popstate)
  // Snapshot del estado para que el listener (registrado una vez) lea lo actual.
  const estadoRef = useRef({})
  estadoRef.current = { vista, homeModo, wizPasos, detalleOrigen, fotosVer, menuAbierto, buscadorAbierto, filtrosAbierto, notifsAbierto, guiaAbierta, soporteAbierto, cartelReporte, festejo, compartiNuevo, pedirAvisos }

  // Cierra la capa de más arriba (foto y modales primero, después vistas).
  function retroceder() {
    const s = estadoRef.current
    if (s.fotosVer) return setFotosVer(null)
    if (s.pedirAvisos) return setPedirAvisos(null)
    if (s.festejo) return setFestejo(null)
    if (s.compartiNuevo) return setCompartiNuevo(null)
    if (s.menuAbierto) return setMenuAbierto(false)
    if (s.buscadorAbierto) return setBuscadorAbierto(false)
    if (s.filtrosAbierto) return setFiltrosAbierto(false)
    if (s.notifsAbierto) return setNotifsAbierto(false)
    if (s.guiaAbierta) return cerrarGuia()
    if (s.soporteAbierto) return setSoporteAbierto(false)
    if (s.cartelReporte) return setCartelReporte(null)
    if (s.vista === 'feed' && s.homeModo === 'mapa') return setHomeModo('lista') // del mapa, atrás = lista
    switch (s.vista) {
      case 'detalle':
        return setVista(s.detalleOrigen)
      case 'avistamiento':
        // Dentro del aporte, atrás vuelve a elegir el tipo (no cierra todo).
        if (s.wizPasos > 0 && wizAtrasRef.current) return wizAtrasRef.current()
        return setVista('detalle')
      case 'recorrido':
        return setVista('detalle')
      case 'post-encontre':
        // Dentro del wizard, atrás retrocede de a un paso; recién desde el paso 1 sale.
        if (s.wizPasos > 0 && wizAtrasRef.current) return wizAtrasRef.current()
        return setVista('feed')
      case 'perdido-pick':
        return setVista('feed')
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
    // Subir: empujar centinelas hasta igualar la profundidad.
    while (pushedRef.current < profundidad) {
      pushedRef.current++
      window.history.pushState({ chicho: pushedRef.current }, '')
    }
    // Bajar (capa cerrada por UI): sacar los centinelas de más del historial, uno
    // por uno, marcándolos como remoción propia para no disparar "retroceder".
    // Así, al volver al feed, el "atrás" del celu sale de la app (no queda colgado).
    if (pushedRef.current > profundidad) {
      aRemover.current += pushedRef.current - profundidad
      pushedRef.current = profundidad
      if (!removiendo.current) {
        removiendo.current = true
        window.history.back()
      }
    }
  }, [profundidad])

  // Un solo listener de popstate: al apretar atrás, cerramos la capa de arriba.
  useEffect(() => {
    function onPop() {
      // ¿Es un popstate nuestro (estamos sacando centinelas de más)? Lo ignoramos.
      if (removiendo.current) {
        aRemover.current--
        if (aRemover.current > 0) window.history.back() // seguir sacando el siguiente
        else removiendo.current = false
        return
      }
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

  // El push de una novedad lleva a /novedades: abrimos esa pantalla al entrar.
  useEffect(() => {
    if (!/^\/novedades\/?$/.test(window.location.pathname)) return
    window.history.replaceState({}, '', '/')
    window.history.pushState({ chicho: 1 }, '', '/')
    pushedRef.current = 1
    setVista('novedades')
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

  // Contá una sesión por carga con usuario y decidí si mostrar el aviso de
  // "primeros pasos" (recién desde el 2º login, y solo si no completó todo).
  useEffect(() => {
    if (user && !contadoRef.current) {
      contadoRef.current = true
      contarLogin()
    }
    setNudge(!!user && logins() >= 2 && !pasosOk())
  }, [user])

  // Prefetch del mapa en segundo plano: no viaja en el bundle inicial (para que
  // la app abra rápido), pero apenas el navegador queda libre lo bajamos, así
  // cuando el usuario toca "Mapa" o abre un aviso ya está listo, sin espera.
  useEffect(() => {
    const bajarMapa = () => import('./components/MapaLeaflet.jsx').catch(() => {})
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(bajarMapa, { timeout: 3000 })
      return () => cancelIdleCallback(id)
    }
    const t = setTimeout(bajarMapa, 1500)
    return () => clearTimeout(t)
  }, [])

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

  // Tu ciudad sale de tu primer lugar guardado (tu "Casa"): es lo único que
  // declaraste a propósito. Antes salía del último toque en cualquier lado —
  // incluso de mirar otra ciudad en el feed— y terminabas publicando desde una
  // ciudad en la que nunca estuviste.
  // La cacheamos en chicho_localidad (en vez de pasarla por props) para que los
  // seis lugares que la leen la sigan leyendo sync, sin esperar a la base.
  useEffect(() => {
    if (!user?.id) return
    getUbicaciones(user.id)
      .then((us) => {
        const casa = us.find((u) => u.localidad)
        if (casa) recordarLocalidad(casa.localidad)
      })
      .catch(() => {}) // si falla, queda la última que elegiste: como antes
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
    } finally {
      setCargandoReportes(false)
    }
  }

  function mostrarToast(msg) {
    setToast(msg)
    window.clearTimeout(mostrarToast._t)
    mostrarToast._t = window.setTimeout(() => setToast(''), 2600)
  }

  function navegar(tab) {
    // Atajos de publicar de la barra: 'perdi' y 'encontre' van directo (sin el
    // chooser); 'post' abre el chooser. Todos piden cuenta primero.
    const dest = { post: 'post-intent', perdi: 'perdido-pick', encontre: 'post-encontre' }[tab]
    if (dest) {
      if (logueado) {
        setEditando(null)
        setPlantilla(null)
        setOfrecerGuardar(false)
        setVista(dest)
      } else {
        setAuthProximo(tab)
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

  // El buscador (lupa) respeta el scope del feed: busca solo dentro de la
  // provincia/localidad elegida, no en toda la base.
  const reportesEnScope = useMemo(() => {
    const loc = filtros.localidad
    const prov = filtros.provincia
    if (!loc && !prov) return reportes
    return reportes.filter((r) => {
      if (prov && provinciaDe(r.localidad || 'Paraná') !== prov) return false
      if (loc && !avisoEnZona(r, loc)) return false // misma localidad o a <= 20 km
      return true
    })
  }, [reportes, filtros.localidad, filtros.provincia])
  const ambitoBusqueda = filtros.localidad || filtros.provincia || null
  // Destello breve del botón Inicio al tocarlo, para que se note que hizo algo
  // (el reset es instantáneo, si no no se percibe nada).
  const [inicioPulse, setInicioPulse] = useState(false)
  const pulseTimer = useRef(null)
  function resetInicio() {
    setFiltros(FILTROS_INI)
    setFiltrosAbierto(false)
    setHomeModo('lista')
    setVista('feed')
    feedScrollRef.current = 0
    const b = document.querySelector('.body')
    if (b) b.scrollTop = 0
  }

  // Barra inferior: Inicio · Perdí · Encontré · Mapa/Lista
  function navBarra(accion) {
    if (accion === 'inicio') {
      resetInicio()
      if (pulseTimer.current) clearTimeout(pulseTimer.current)
      setInicioPulse(true)
      pulseTimer.current = setTimeout(() => setInicioPulse(false), 600)
      return
    }
    if (accion === 'mapa') {
      setFiltrosAbierto(false) // si el panel de filtros tapaba la lista, que el toque se vea
      return setHomeModo((m) => (m === 'mapa' ? 'lista' : 'mapa')) // alterna: vuelve a lista
    }
    if (accion === 'perdi') return navegar('perdi')
    if (accion === 'encontre') return navegar('encontre')
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
    if (sec === 'novedades') {
      setVista('novedades')
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

  // Ofrece los avisos push, pero solo si hay algo que ofrecer (ver lib/avisos-push.js:
  // no si ya los tiene, no si bloqueó el permiso, no si ya se lo ofrecimos hoy).
  function ofrecerAvisos() {
    decidirModoAvisos().then((m) => m && setPedirAvisos(m))
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
      ofrecerAvisos() // ...y si no tiene el push activo, se lo ofrecemos acá mismo
    }
  }

  async function alPublicar(reporte) {
    const eraEdicion = !!editando
    await cargar()
    setEditando(null)
    setPlantilla(null)
    setOfrecerGuardar(false)
    setVista('feed')
    if (!eraEdicion && reporte) {
      setCompartiNuevo(reporte) // en alta: pantalla para compartir ya (reemplaza el toast)
    } else {
      mostrarToast(eraEdicion ? '✅ Aviso actualizado' : '✅ ¡Reporte publicado! Ya aparece en el inicio.')
    }
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
      mostrarToast('🔔 ¡Listo! Seguís esta búsqueda')
      ofrecerAvisos() // el cartel ofrece activar los avisos (antes acá iba una tarea)
      return
    }
    mostrarToast('¡Bienvenido! 🐾')
    const dest = { post: 'post-intent', perdi: 'perdido-pick', encontre: 'post-encontre' }[authProximo]
    if (dest) {
      setEditando(null)
      setPlantilla(null)
      setOfrecerGuardar(false)
      setVista(dest)
    } else {
      setVista('feed')
    }
  }

  // Borrar un aviso ajeno (solo admin). Usa el RPC que valida por email.
  async function borrarAdmin(id) {
    if (!(await confirmar({ mensaje: '¿Borrar este aviso como admin? No se puede deshacer.', aceptar: 'Borrar', peligro: true }))) return
    try {
      await borrarReporteAdmin(id)
      await cargar()
      setVista(detalleOrigen)
      mostrarToast('Aviso borrado')
    } catch (e) {
      console.error(e)
      mostrarToast('No se pudo borrar 😕')
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
      const rep = seleccionado // capturamos el aviso antes de recargar
      await marcarResuelto(id)
      await cargar()
      setVista(detalleOrigen)
      if (rep) setFestejo({ ...rep, estado: 'resuelto' }) // ofrecer compartir la buena noticia
      else mostrarToast('🎉 ¡Ya está en casa!')
    } catch (e) {
      console.error(e)
      mostrarToast('No se pudo actualizar 😕')
    }
  }

  // Cerrar un aviso desde Mi cuenta. Mismo festejo que desde el aviso: antes acá
  // sólo salía un toast, así que se perdía el momento de compartir el reencuentro
  // — que es donde más se cierra y el contenido que más ayuda a que la app crezca.
  // Recibe el aviso entero (no el id) porque acá no hay "seleccionado" que capturar.
  async function resolverDesdeCuenta(rep) {
    await marcarResuelto(rep.id)
    await cargar()
    setFestejo({ ...rep, estado: 'resuelto' })
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
    if (!(await confirmar({ mensaje: '¿Seguro que querés borrar este aviso? No se puede deshacer.', aceptar: 'Borrar', peligro: true }))) return
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
  async function mascotaGuardada(sacada) {
    setVista('cuenta')
    mostrarToast(sacada ? '🐾 Mascota sacada de tu perfil' : '🐾 Mascota guardada')
    // Sacar una mascota publicada como perdida baja también su aviso: refrescamos
    // el feed para que no quede el aviso fantasma en la lista en memoria.
    if (sacada) await cargar()
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
        {/* Las VISTAS: las que se bajan on-demand muestran "Cargando…" un instante la
            primera vez. El feed y el detalle no son lazy, así que no suspenden. */}
        <Suspense fallback={<CargandoVista />}>
        {vista === 'feed' && (
          <Feed
            reportes={reportes}
            cargando={cargandoReportes}
            onOpen={abrirDetalle}
            onToast={mostrarToast}
            authActivo={authActivo}
            logueado={logueado}
            user={user}
            onLogin={pedirLogin}
            onMenu={() => setMenuAbierto(true)}
            onNotifs={abrirNotifs}
            onBuscar={() => setBuscadorAbierto(true)}
            notifsNoLeidas={notifsNoLeidas}
            hayNudge={nudge}
            modo={homeModo}
            filtros={filtros}
            setFiltro={setFiltro}
            resetInicio={resetInicio}
            scrollRef={feedScrollRef}
            panelAbierto={filtrosAbierto}
            setPanelAbierto={setFiltrosAbierto}
          />
        )}
        {vista === 'detalle' && (
          <Detalle
            r={seleccionado}
            esMio={esMio}
            esAdmin={esAdmin}
            onBorrarAdmin={borrarAdmin}
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
              mostrarToast('🙌 ¡Gracias! Tu dato ya le llegó a la familia')
              if (!logueado) setCartelReporte(seleccionado)
            }}
            onToast={mostrarToast}
            onPasos={setWizPasos}
            atrasRef={wizAtrasRef}
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
            onVolver={() => setVista('feed')}
          />
        )}
        {vista === 'post-encontre' && (
          <EncontreWizard
            reportes={reportes}
            telefonoGuardado={user?.user_metadata?.telefono || ''}
            onVerAviso={abrirDetalle}
            onCerrar={() => setVista('feed')}
            onPublicado={alPublicar}
            onPasos={setWizPasos}
            atrasRef={wizAtrasRef}
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
            onIrSeccion={setCuentaSeccion}
            onCompletoPasos={() => setNudge(false)}
            onResuelto={resolverDesdeCuenta}
            onToast={mostrarToast}
            seguidos={seguidos}
            onDejarDeSeguir={(id) => toggleSeguir({ id })}
          />
        )}
        {vista === 'mascota' && (
          <MascotaForm
            inicial={mascotaEditando}
            telefonoGuardado={user?.user_metadata?.telefono || ''}
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
        {vista === 'admin' && esAdmin && <Admin onVolver={() => setVista('feed')} onOpen={(r) => abrirDetalle(r, 'admin')} />}
        {vista === 'moderacion' && esAdmin && <Moderacion onVolver={() => setVista('feed')} />}
        {vista === 'novedades' && <Novedades onVolver={() => setVista('feed')} />}
        </Suspense>

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
        {vista === 'feed' && <BottomNav modo={homeModo} onNav={navBarra} inicioPulse={inicioPulse} />}

        {/* Modales y hojas: fallback null — aparecen al instante siguiente sin tapar
            lo que se está viendo (son overlays, no reemplazan la pantalla). */}
        <Suspense fallback={null}>
        {guiaAbierta && <WelcomeGuide onClose={cerrarGuia} />}

        {soporteAbierto && <Soporte onCerrar={() => setSoporteAbierto(false)} />}

        {menuAbierto && (
          <MenuUsuario user={user} esAdmin={esAdmin} hayNudge={nudge} onSeccion={irSeccion} onLogout={salir} onCerrar={() => setMenuAbierto(false)} />
        )}

        {notifsAbierto && (
          <NotifPanel
            notifs={notifs}
            mostrarNudge={nudge}
            onPrimerosPasos={() => {
              setNotifsAbierto(false)
              irSeccion('primeros-pasos')
            }}
            onClose={() => setNotifsAbierto(false)}
            onAbrir={abrirDesdeNotif}
            onMarcarTodas={marcarTodasNotifs}
          />
        )}

        {buscadorAbierto && (
          <BuscadorOverlay
            reportes={reportesEnScope}
            ambito={ambitoBusqueda}
            q={filtros.q}
            onQ={(v) => setFiltro('q', v)}
            onOpen={(r) => {
              setBuscadorAbierto(false)
              abrirDetalle(r)
            }}
            onCerrar={() => setBuscadorAbierto(false)}
          />
        )}

        {festejo && (
          <FestejoReencuentro
            r={festejo}
            onCompartir={() => {
              compartirFlyer(festejo, mostrarToast)
              setFestejo(null)
            }}
            onCerrar={() => setFestejo(null)}
            onToast={mostrarToast}
            onFotoSubida={() => cargar()}
          />
        )}

        {pedirAvisos && <PedirAvisos modo={pedirAvisos} onCerrar={() => setPedirAvisos(null)} onToast={mostrarToast} />}

        {compartiNuevo && (
          <CompartiAhora
            r={compartiNuevo}
            onCompartir={() => {
              compartirFlyer(compartiNuevo, mostrarToast)
              marcarCompartido(compartiNuevo.id) // ya difundió → saltar el push de 24 h
              setCompartiNuevo(null)
            }}
            onCerrar={() => setCompartiNuevo(null)}
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
        </Suspense>
      </div>

      <Suspense fallback={null}>
        {fotosVer && <Lightbox fotos={fotosVer.fotos} inicio={fotosVer.i} onCerrar={() => setFotosVer(null)} />}
      </Suspense>

      <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>
    </div>
  )
}
