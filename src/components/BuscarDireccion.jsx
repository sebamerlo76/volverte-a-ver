import { useState } from 'react'
import { provinciaDe } from '../lib/localidades.js'

// Busca una dirección (calle + altura) y devuelve el punto para ubicarlo en el
// mapa. Usa Nominatim (OpenStreetMap), gratis. Búsqueda al enviar (no por tecla),
// así respeta el límite de uso.
export default function BuscarDireccion({ localidad, onEncontrado, onToast }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)

  async function buscar(e) {
    e?.preventDefault?.()
    const texto = q.trim()
    if (!texto || busy) return
    setBusy(true)
    try {
      const ciudad = localidad || 'Paraná'
      const query = `${texto}, ${ciudad}, ${provinciaDe(ciudad)}, Argentina`
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&addressdetails=0&q=${encodeURIComponent(query)}`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      const data = await res.json()
      if (data && data[0] && data[0].lat) {
        onEncontrado({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
        onToast?.('📍 Dirección encontrada — ajustala en el mapa si hace falta')
      } else {
        onToast?.('No encontré esa dirección. Probá con calle y altura, o marcá el mapa.')
      }
    } catch (err) {
      onToast?.('No se pudo buscar. Marcá el lugar en el mapa 📍')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="dir-buscar" onSubmit={buscar}>
      <span className="mi" style={{ fontSize: 19, color: 'var(--navy)' }}>
        search
      </span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar calle y altura (ej: Pascual Greca 821)"
        enterKeyHint="search"
      />
      <button type="submit" disabled={busy || !q.trim()}>
        {busy ? '…' : 'Buscar'}
      </button>
    </form>
  )
}
