import { linkGoogleMaps, linkWaze } from '../lib/formato.js'

// Hojita con las opciones para ir hasta un punto del mapa (Google Maps / Waze).
export default function ComoLlegarSheet({ punto, onCerrar }) {
  const lat = punto && punto[0]
  const lng = punto && punto[1]
  if (lat == null || lng == null) return null
  return (
    <div className="pp-sheet-ov" onClick={onCerrar}>
      <div className="pp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="report-sheet-t">¿Cómo querés llegar?</div>
        <a className="pp-op" href={linkGoogleMaps(lat, lng)} target="_blank" rel="noreferrer" onClick={onCerrar}>
          <span className="mi fill" style={{ fontSize: 22, color: '#2f7fed' }}>
            map
          </span>
          Google Maps
        </a>
        <a className="pp-op" href={linkWaze(lat, lng)} target="_blank" rel="noreferrer" onClick={onCerrar}>
          <span className="mi fill" style={{ fontSize: 22, color: '#20b8f0' }}>
            navigation
          </span>
          Waze
        </a>
        <button className="pp-cancel" onClick={onCerrar}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
