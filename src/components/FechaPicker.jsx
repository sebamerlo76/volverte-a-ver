import { useState } from 'react'

// Fecha YYYY-MM-DD en hora LOCAL (evita el corrimiento de zona horaria de toISOString).
function isoLocal(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Selector amigable: Hoy / Ayer / Otra fecha. Solo "Otra fecha" abre el calendario nativo.
export default function FechaPicker({ value, onChange }) {
  const hoy = isoLocal(0)
  const ayer = isoLocal(1)
  const [manual, setManual] = useState(!!value && value !== hoy && value !== ayer)

  return (
    <>
      <div className="chipsel-wrap">
        <button
          type="button"
          className={'chip' + (!manual && value === hoy ? ' on' : '')}
          onClick={() => {
            setManual(false)
            onChange(hoy)
          }}
        >
          Hoy
        </button>
        <button
          type="button"
          className={'chip' + (!manual && value === ayer ? ' on' : '')}
          onClick={() => {
            setManual(false)
            onChange(ayer)
          }}
        >
          Ayer
        </button>
        <button type="button" className={'chip' + (manual ? ' on' : '')} onClick={() => setManual(true)}>
          Otra fecha
        </button>
      </div>
      {manual && (
        <div className="inp" style={{ marginTop: 8 }}>
          <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
            calendar_today
          </span>
          <input type="date" value={value || ''} max={hoy} onChange={(e) => onChange(e.target.value)} />
        </div>
      )}
    </>
  )
}
