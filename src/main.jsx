import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import PerfilPublico from './components/PerfilPublico.jsx'
import './styles.css'

// Ruteo simple: /m/<id> muestra el perfil público de la mascota (QR del collar).
const qr = window.location.pathname.match(/^\/m\/([^/]+)/)

createRoot(document.getElementById('root')).render(
  <StrictMode>{qr ? <PerfilPublico id={decodeURIComponent(qr[1])} /> : <App />}</StrictMode>
)
