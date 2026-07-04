import { useRef, useState } from 'react'

// Recorrido de bienvenida (carrusel). Se muestra la primera vez y desde el menú "Guía".
const PASOS = [
  {
    logo: true,
    t: '¡Bienvenido a Chicho!',
    d: 'Ayudamos a que las mascotas perdidas de Paraná vuelvan a casa. 🐾',
  },
  {
    ic: 'pets',
    color: 'var(--navy)',
    t: 'Perdido vs. En la calle',
    d: '🔴 Perdido: su familia lo busca.\n🔵 En la calle: alguien lo encontró y busca a su familia.',
  },
  {
    ic: 'add_circle',
    color: '#ff5747',
    t: 'Publicá en un toque',
    d: '¿Perdiste o encontraste una? Tocá la patita 🐾 de abajo para cargar tu aviso.',
  },
  {
    ic: 'visibility',
    color: '#2f7fed',
    t: 'Reconocimiento por foto',
    d: 'Si cargás una que encontraste, Chicho te sugiere las perdidas que se parecen. 👀',
  },
  {
    ic: 'notifications_active',
    color: '#e0a300',
    t: 'Te avisamos',
    d: 'Activá las notificaciones: te aviso si aparece o si alguien la ve. Y compartí el aviso para llegar a más gente. 📢',
  },
]

export default function WelcomeGuide({ onClose }) {
  const ref = useRef(null)
  const [paso, setPaso] = useState(0)
  const ultimo = paso >= PASOS.length - 1

  function irA(i) {
    const el = ref.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }
  function siguiente() {
    if (ultimo) onClose()
    else irA(paso + 1)
  }

  return (
    <div className="guia-overlay">
      <div className="guia-card">
        <button className="guia-saltar" onClick={onClose}>
          Saltar
        </button>

        <div
          className="guia-slides"
          ref={ref}
          onScroll={(e) => {
            const el = e.currentTarget
            const i = Math.round(el.scrollLeft / el.clientWidth)
            if (i !== paso) setPaso(i)
          }}
        >
          {PASOS.map((p, i) => (
            <div className="guia-slide" key={i}>
              <div className="guia-ico" style={{ color: p.color }}>
                {p.logo ? (
                  <img src="/logo.png" alt="Chicho" width="86" height="86" />
                ) : (
                  <span className="mi fill" style={{ fontSize: 66 }}>
                    {p.ic}
                  </span>
                )}
              </div>
              <div className="guia-t">{p.t}</div>
              <div className="guia-d">{p.d}</div>
            </div>
          ))}
        </div>

        <div className="guia-dots">
          {PASOS.map((_, i) => (
            <span key={i} className={'gdot' + (i === paso ? ' on' : '')} />
          ))}
        </div>

        <button className="guia-btn" onClick={siguiente}>
          {ultimo ? '¡Empezar!' : 'Siguiente'}
        </button>
      </div>
    </div>
  )
}
