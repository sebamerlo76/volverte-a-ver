import { useEffect, useState } from 'react'
import Feed from './components/Feed.jsx'
import Detalle from './components/Detalle.jsx'
import Publicar from './components/Publicar.jsx'
import Mapa from './components/Mapa.jsx'
import BottomNav from './components/BottomNav.jsx'
import { getReportes } from './data/store.js'

export default function App() {
  const [vista, setVista] = useState('feed') // feed | detalle | post | map
  const [selId, setSelId] = useState(null)
  const [reportes, setReportes] = useState([])
  const [toast, setToast] = useState('')

  // Cargar reportes del almacenamiento al iniciar.
  useEffect(() => {
    cargar()
  }, [])

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
    setVista(tab)
  }

  function abrirDetalle(id) {
    setSelId(id)
    setVista('detalle')
  }

  async function alPublicar() {
    await cargar()
    setVista('feed')
    mostrarToast('✅ ¡Reporte publicado! Ya aparece en el inicio.')
  }

  const tabActual = vista === 'map' ? 'map' : 'feed'
  const seleccionado = selId ? reportes.find((r) => r.id === selId) : null

  return (
    <div className="app-shell">
      <div className="app">
        {vista === 'feed' && <Feed reportes={reportes} onOpen={abrirDetalle} />}
        {vista === 'detalle' && <Detalle r={seleccionado} onVolver={() => setVista('feed')} onToast={mostrarToast} />}
        {vista === 'post' && (
          <Publicar onCerrar={() => setVista('feed')} onPublicado={alPublicar} onToast={mostrarToast} />
        )}
        {vista === 'map' && <Mapa reportes={reportes} onAbrir={abrirDetalle} onToast={mostrarToast} />}

        {/* La barra inferior se muestra en las vistas principales, no en detalle/publicar. */}
        {(vista === 'feed' || vista === 'map') && <BottomNav tab={tabActual} onNav={navegar} />}
      </div>

      <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>
    </div>
  )
}
