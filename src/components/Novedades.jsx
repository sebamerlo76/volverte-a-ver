import { useEffect, useState } from 'react'
import { getNovedades } from '../data/store.js'
import { fechaLegible, tiempoRelativo } from '../lib/formato.js'

// El mismo WhatsApp de la hoja de Ayuda (Soporte.jsx), con un texto propio: acá la
// persona viene de leer las mejoras, no con un problema.
const WA_IDEA =
  'https://wa.me/5493434054998?text=' +
  encodeURIComponent('¡Hola! Se me ocurrió una idea para Chicho 🐾')

// Historial público de mejoras de la app. Se llega desde el menú (y desde el push de
// una novedad). Es el changelog en criollo: muestra que Chicho está vivo y que lo que
// la gente pide se hace.
export default function Novedades({ onVolver }) {
  const [lista, setLista] = useState(null)

  useEffect(() => {
    let vivo = true
    getNovedades()
      .then((n) => vivo && setLista(n))
      .catch(() => vivo && setLista([]))
    return () => {
      vivo = false
    }
  }, [])

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onVolver}>
          arrow_back
        </button>
        <div className="ftitle">Novedades</div>
      </div>

      <div className="body">
        <div className="nov-intro">
          Todo lo que vamos mejorando en Chicho 🐾 Muchas de estas salieron de ideas de la gente que la usa.
        </div>
        <a className="nov-idea" href={WA_IDEA} target="_blank" rel="noreferrer">
          <span className="mi fill" style={{ fontSize: 20, color: '#25D366' }}>chat</span>
          <span>
            <b>¿Se te ocurre algo?</b> Contámelo por WhatsApp — lo leo yo.
          </span>
          <span className="mi" style={{ fontSize: 20, color: '#c3b8b0' }}>chevron_right</span>
        </a>

        {lista === null ? (
          <div className="empty" style={{ padding: '24px 30px' }}>Cargando…</div>
        ) : lista.length === 0 ? (
          <div className="empty" style={{ padding: '24px 30px' }}>Todavía no hay novedades publicadas.</div>
        ) : (
          <div className="nov-lista">
            {lista.map((n, i) => (
              <div className={'nov-item' + (i === 0 ? ' ultima' : '')} key={n.id}>
                <div className="nov-punto" />
                <div className="nov-cuerpo">
                  <div className="nov-fecha">
                    {tiempoRelativo(n.creadoEn)} · {fechaLegible(n.creadoEn)}
                    {i === 0 && <span className="nov-nuevo">Nuevo</span>}
                  </div>
                  <div className="nov-titulo">{n.titulo}</div>
                  <div className="nov-texto">{n.texto}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 'calc(24px + env(safe-area-inset-bottom))' }} />
      </div>
    </div>
  )
}
