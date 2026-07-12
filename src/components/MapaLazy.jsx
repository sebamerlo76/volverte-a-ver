import { lazy, Suspense } from 'react'

// Envoltorio del mapa con carga diferida (code-splitting). Leaflet es pesado, así
// que NO viaja en el bundle inicial: se baja solo cuando aparece un mapa en
// pantalla (o antes, por el prefetch en idle de App.jsx). Los componentes usan
// <MapaLeaflet .../> igual que siempre; solo cambian el import a este archivo.
const MapaReal = lazy(() => import('./MapaLeaflet.jsx'))

export default function MapaLazy(props) {
  return (
    <Suspense fallback={<div className="mapa-cargando">Cargando mapa…</div>}>
      <MapaReal {...props} />
    </Suspense>
  )
}
