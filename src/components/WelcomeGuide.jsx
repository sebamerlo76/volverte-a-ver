import { useRef, useState } from 'react'

// Bienvenida del SITIO: la ve una sola vez quien llega navegando a chicho.ar. Dentro de
// la app ya no hay "Guía" — ahí se guía haciendo, con los banners del feed y el checklist
// de Primeros pasos. Por eso esto es corto: cuatro pantallas, y la primera deja entrar.
//
// Eran siete y se recortaron a propósito. Se fue "Cerca tuyo" (en qué provincias está
// Chicho): el botón ya dice "de mi zona", el feed abre en la ciudad de la persona y, si
// está vacía, el propio feed la nombra. Lo de instalar se queda aunque BannerInstalar
// diga casi lo mismo, porque los banners NO le llegan al que recién entra: el de avisos
// pide estar logueado y tener la app instalada, y el de instalar no aparece en Android
// hasta que el navegador ofrece el cartel.
const PASOS = [
  {
    logo: true,
    t: '¡Bienvenido a Chicho!',
    d: 'Ayudamos a que las mascotas perdidas de tu ciudad vuelvan a casa. 🐾',
  },
  {
    ic: 'pets',
    color: 'var(--navy)',
    t: 'Publicá en un toque',
    d: '🔴 Perdido: su familia lo busca.\n🔵 Encontrado: alguien lo vio, o lo tiene a resguardo, y busca a su familia.\n🏠 Ya en casa: volvió con su familia. 🎉\n\n¿Perdiste o encontraste una? Tocá 🐾 Perdí o 👁️ Encontré abajo.',
  },
  {
    ic: 'visibility',
    color: '#2f7fed',
    t: 'Reconocimiento por foto',
    d: 'Si cargás una que encontraste, Chicho te sugiere las perdidas que se parecen. 👀',
  },
  {
    ic: 'install_mobile',
    color: 'var(--navy)',
    t: 'Sumate a la red de tu zona 📲',
    d: 'Instalá Chicho y activá las notificaciones: te avisamos si aparece la tuya o si se pierde una cerca. 🔔\n\n📱 Android: menú ⋮ → «Instalar app».\n🍎 iPhone: Compartir ↑ → «Agregar a inicio».\n\nSin instalar no llegan las notificaciones.',
  },
]

// El primer paso es una PORTADA: la acción grande entra a la app y el recorrido queda
// como opción. El que llega de un link viene a ver mascotas, no a leer — antes el botón
// grande decía "Siguiente" y la única salida era un "Saltar" gris y chiquito, así que
// muchos no llegaban nunca al feed.
export default function WelcomeGuide({ onClose }) {
  const ref = useRef(null)
  const [paso, setPaso] = useState(0)
  const ultimo = paso >= PASOS.length - 1
  const portada = paso === 0

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
                  // El tamaño va por CSS y no inline: en pantallas bajas hay que achicarlo
                  // (media query) y un style inline le ganaría a la regla.
                  <span className="mi fill guia-ico-mi">{p.ic}</span>
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
