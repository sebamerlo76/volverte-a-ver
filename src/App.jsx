import { useEffect, useState } from 'react'
import Feed from './components/Feed.jsx'
import Detalle from './components/Detalle.jsx'
import Publicar from './components/Publicar.jsx'
import Mapa from './components/Mapa.jsx'
import Auth from './components/Auth.jsx'
import MiCuenta from './components/MiCuenta.jsx'
import MascotaForm from './components/MascotaForm.jsx'
import IntentPublicar from './components/IntentPublicar.jsx'
import ElegirMascota from './components/ElegirMascota.jsx'
import EncontreWizard from './components/EncontreWizard.jsx'
import ReportarAvistamiento from './components/ReportarAvistamiento.jsx'
import MapaRecorrido from './components/MapaRecorrido.jsx'
import BottomNav from './components/BottomNav.jsx'
import { getReportes, marcarResuelto, reactivarReporte, eliminarReporte } from './data/store.js'
import { supabase, supabaseConfigurado } from './lib/supabase.js'

export default function App() {
  const [vista, setVista] = useState('feed') // feed | detalle | post | map | auth | cuenta
  const [selReporte, setSelReporte] = useState(null) // aviso abierto en el detalle
  const [reportes, setReportes] = useState([])
  const [toast, setToast] = useState('')
  const [user, setUser] = useState(null)
  const [editando, setEditando] = useState(null) // aviso en edición, o null
  const [mascotaEditando, setMascotaEditando] = useState(null) // mascota en edición, o null (nueva)
  const [plantilla, setPlantilla] = useState(null) // mascota para prellenar un aviso nuevo
  const [ofrecerGuardar, setOfrecerGuardar] = useState(false) // ofrecer guardar la mascota al publicar
  const [authProximo, setAuthProximo] = useState('feed') // adónde ir tras iniciar sesión

  const authActivo = supabaseConfigurado
  const logueado = !authActivo || !!user

  // Cargar reportes al iniciar.
  useEffect(() => {
    cargar()
  }, [])

  // Seguir el estado de la sesión (solo si hay Supabase).
  useEffect(() => {
    if (!authActivo) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [authActivo])

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

  function abrirDetalle(reporte) {
    setSelReporte(reporte)
    setVista('detalle')
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
    setVista('feed')
    mostrarToast('Sesión cerrada')
  }
  function trasAuth() {
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
      setVista('feed')
      mostrarToast('🎉 ¡Marcado como reencontrado!')
    } catch (e) {
      console.error(e)
      mostrarToast('No se pudo actualizar 😕')
    }
  }
  async function reactivar(id) {
    try {
      await reactivarReporte(id)
      await cargar()
      setVista('feed')
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
      setVista('feed')
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

  const tabActual = vista === 'map' ? 'map' : 'feed'
  const seleccionado = selReporte
  const esMio = seleccionado ? !authActivo || (user && seleccionado.userId === user.id) : false

  return (
    <div className="app-shell">
      <div className="app">
        {vista === 'feed' && (
          <Feed
            reportes={reportes}
            onOpen={abrirDetalle}
            authActivo={authActivo}
            logueado={logueado}
            user={user}
            onLogin={pedirLogin}
            onCuenta={() => setVista('cuenta')}
          />
        )}
        {vista === 'detalle' && (
          <Detalle
            r={seleccionado}
            esMio={esMio}
            onVolver={() => setVista('feed')}
            onToast={mostrarToast}
            onEditar={editar}
            onBorrar={borrar}
            onResuelto={resolver}
            onReactivar={reactivar}
            onAvistar={() => setVista('avistamiento')}
            onMaximizar={() => setVista('recorrido')}
          />
        )}
        {vista === 'avistamiento' && seleccionado && (
          <ReportarAvistamiento
            reporte={seleccionado}
            onCerrar={() => setVista('detalle')}
            onEnviado={() => {
              setVista('detalle')
              mostrarToast('👀 ¡Gracias! Tu avistamiento se sumó al recorrido')
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
            onCerrar={cerrarPublicar}
            onPublicado={alPublicar}
            onToast={mostrarToast}
          />
        )}
        {vista === 'auth' && <Auth onCerrar={() => setVista('feed')} onAuth={trasAuth} onToast={mostrarToast} />}
        {vista === 'cuenta' && (
          <MiCuenta
            user={user}
            onVolver={() => setVista('feed')}
            onAbrir={abrirDetalle}
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
          />
        )}
        {vista === 'map' && <Mapa reportes={reportes} onAbrir={abrirDetalle} onToast={mostrarToast} />}

        {(vista === 'feed' || vista === 'map') && <BottomNav tab={tabActual} onNav={navegar} />}
      </div>

      <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>
    </div>
  )
}
