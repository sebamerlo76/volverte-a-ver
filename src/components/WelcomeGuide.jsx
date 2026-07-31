import { useRef, useState } from 'react'
import { provinciasOrdenadas } from '../lib/localidades.js'

// Lista de provincias donde ya está Chicho, en prosa ("A, B y C"). Se arma sola
// de los datos, así no se queda vieja al sumar provincias.
const PROVS = provinciasOrdenadas()
const PROVINCIAS_TXT = PROVS.length > 1 ? PROVS.slice(0, -1).join(', ') + ' y ' + PROVS[PROVS.length - 1] : PROVS[0]

// Recorrido de bienvenida (carrusel). Se muestra la primera vez y desde el menú "Guía".
const PASOS = [
  {
    logo: true,
    t: '¡Bienvenido a Chicho!',
    d: 'Ayudamos a que las mascotas perdidas de tu ciudad vuelvan a casa. 🐾',
  },
  {
    ic: 'place',
    color: 'var(--coral)',
    t: 'Cerca tuyo',
    d: `Ya estamos en ${PROVINCIAS_TXT}, y sumando ciudades todo el tiempo.\n\n¿Tu localidad no aparece? Escribinos y la sumamos. 💜`,
  },
  {
    ic: 'swap_horiz',
    color: 'var(--navy)',
    t: 'Perdido, Encontrado, Ya en casa',
    d: '🔴 Perdido: su familia lo busca.\n🔵 Encontrado: alguien lo vio, o lo tiene a resguardo (en tránsito), y busca a su familia.\n🏠 Ya en casa: volvió con su familia. 🎉',
  },
  {
    ic: 'pets',
    color: 'var(--navy)',
    t: 'Publicá en un toque',
    d: '¿Perdiste o encontraste una? Tocá 🐾 Perdí o 👁️ Encontré abajo para cargar tu aviso.',
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
  {
    ic: 'install_mobile',
    color: 'var(--navy)',
    t: 'Sumate a la red de tu zona 📲',
    d: 'Instalá Chicho en tu inicio y recibí un aviso cuando se pierde o aparece una mascota cerca tuyo. Cuantos más seamos, más rápido vuelven a casa. 🔔\n\n📱 Android: menú ⋮ → «Instalar app».\n🍎 iPhone: en Safari, Compartir ↑ → «Agregar a inicio».\n\nSin instalar no llegan las notificaciones.',
  },
]

// `bienvenida` = es la primera visita (no la abrió a mano desde el menú "Guía").
// En ese caso el primer paso es una PORTADA: la acción grande entra a la app y el
// recorrido queda como opción. El que llega de un link viene a ver mascotas, no a
// leer siete pantallas — antes el botón grande decía "Siguiente" y la única salida
// era un "Saltar" gris y chiquito, así que muchos no llegaban nunca al feed.
export default function WelcomeGuide({ onClose, bienvenida = false }) {
  const ref = useRef(null)
  const [paso, setPaso] = useState(0)
  const ultimo = paso >= PASOS.length - 1
  const portada = bienvenida && paso === 0

  function irA(i) {
    const el = ref.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }
  function siguiente() {
    if (portada || ultimo) onClose()
    else irA(paso + 1)
  }

  return (
    <div className="guia-overlay">
      <div className="guia-card">
        {/* En la portada el "Saltar" sobra (abajo ya hay un botón que entra), pero se
            deja ocupando su lugar con visibility para que nada salte al pasar de paso. */}
        <button className={'guia-saltar' + (portada ? ' oculto' : '')} onClick={onClose}>
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
                  // logo-boot (176px) y no logo.png (500px, 58 KB): acá se ve a 86 px
                  // y es lo primero que pinta la app, así que el peso se nota.
                  <img src="/logo-boot.png" alt="Chicho" width="86" height="86" />
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
          {portada ? 'Ver las mascotas de mi zona' : ultimo ? '¡Empezar!' : 'Siguiente'}
        </button>
        {/* Mismo criterio que el "Saltar": fuera de la portada queda invisible pero
            ocupando su lugar, así el pie no se mueve al avanzar. */}
        <button className={'guia-sec' + (portada ? '' : ' oculto')} onClick={() => irA(1)}>
          Ver cómo funciona
        </button>
      </div>
    </div>
  )
}
