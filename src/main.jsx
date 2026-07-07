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

// Service worker: habilita Web Push (notificaciones) e instalar como PWA.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('SW no registrado:', e))
  })
}
