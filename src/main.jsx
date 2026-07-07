import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import PerfilPublico from './components/PerfilPublico.jsx'
import GestionAviso from './components/GestionAviso.jsx'
import { Analytics } from '@vercel/analytics/react'
import './styles.css'

// Ruteo simple: /m/<id> = perfil público (QR del collar); /g/<token> = gestionar
// un aviso publicado sin cuenta (cerrar/borrar).
const qr = window.location.pathname.match(/^\/m\/([^/]+)/)
const gest = window.location.pathname.match(/^\/g\/([^/]+)/)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {qr ? (
      <PerfilPublico id={decodeURIComponent(qr[1])} />
    ) : gest ? (
      <GestionAviso token={decodeURIComponent(gest[1])} />
    ) : (
      <App />
    )}
    <Analytics />
  </StrictMode>
)

// Altura real del viewport en una variable CSS. Evita que, al recargar dentro de
// la PWA instalada (botón "Actualizar"), la barra de abajo quede tapada por la
// barra de gestos: 100dvh a veces se recalcula mal en un reload "en caliente".
function fijarAltura() {
  document.documentElement.style.setProperty('--app-h', window.innerHeight + 'px')
}
fijarAltura()
window.addEventListener('resize', fijarAltura)
window.addEventListener('orientationchange', () => setTimeout(fijarAltura, 250))
// Y un recálculo apenas termina de cargar, por si el viewport todavía no asentó.
window.addEventListener('load', () => setTimeout(fijarAltura, 150))

// Service worker: habilita Web Push (notificaciones) e instalar como PWA.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('SW no registrado:', e))
  })
}
