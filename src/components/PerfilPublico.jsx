import { useEffect, useState } from 'react'
import { getPerfilPublico, addAvistamiento } from '../data/store.js'

const ESPECIE_LBL = { perro: 'Perro', gato: 'Gato', otro: 'Otro' }

// Página pública que ve quien escanea el QR del collar (sin login).
export default function PerfilPublico({ id }) {
  const [m, setM] = useState(undefined) // undefined = cargando, null = no existe
  const [enviando, setEnviando] = useState(false)
  const [avisado, setAvisado] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getPerfilPublico(id)
      .then((r) => setM(r))
      .catch(() => setM(null))
  }, [id])

  // Avisarle a la familia dónde está (crea un avistamiento → le llega push + al mapa).
  function avisarUbicacion() {
    if (!navigator.geolocation) {
      setMsg('Tu navegador no permite ubicación. Avisale por WhatsApp 👇')
      return
    }
    setEnviando(true)
    setMsg('')
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          await addAvistamiento({
            reporteId: m.reporte_id,
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            nota: 'Escanearon el QR del collar 🏷️',
            autor: 'Alguien por el QR',
          })
          setAvisado(true)
        } catch (e) {
          setMsg('No se pudo avisar. Probá por WhatsApp 👇')
        } finally {
          setEnviando(false)
        }
      },
      () => {
        setEnviando(false)
        setMsg('Activá la ubicación para avisarle dónde estás 📍. O escribile por WhatsApp 👇')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  if (m === undefined) {
    return (
      <div className="app-shell">
        <div className="app pub">
          <div className="empty" style={{ marginTop: 80 }}>
            Buscando la mascota… 🐾
          </div>
        </div>
      </div>
    )
  }

  if (!m) {
    return (
      <div className="app-shell">
        <div className="app pub">
          <div className="pub-top">
            <div className="logo" style={{ margin: '0 auto' }}>
              <span className="mi fill" style={{ fontSize: 22 }}>
                pets
              </span>
            </div>
            <div className="pub-brand">Chicho</div>
          </div>
          <div className="empty" style={{ marginTop: 40 }}>
            No encontramos esta mascota.
            <br />
            Puede que el código no sea válido.
          </div>
        </div>
      </div>
    )
  }

  const nombre = m.nombre || (m.especie === 'gato' ? 'Gato' : 'Perro')
  const wa = (m.whatsapp || '').replace(/\D/g, '')
  const texto = encodeURIComponent(`¡Hola! Encontré a ${nombre} 🐾 (por el QR de Chicho). ¿Dónde te lo llevo?`)
  const waLink = wa ? `https://wa.me/54${wa}?text=${texto}` : null

  return (
    <div className="app-shell">
      <div className="app pub">
        <div className="pub-scroll">
          <div className="pub-top">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
              <img src="/logo.png" alt="" width="52" height="52" style={{ display: 'block' }} />
              <span style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 34, color: 'var(--navy)' }}>Chicho</span>
            </div>
          </div>

          {m.perdido && (
            <div className="pub-alerta">
              <span className="mi" style={{ fontSize: 22 }}>
                error_outline
              </span>
              <div>
                <b>¡Me están buscando!</b>
                <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                  Mi familia me perdió{m.zona ? ` por ${m.zona}` : ''}. Ayudame a volver a casa 🙏
                </div>
              </div>
            </div>
          )}

          <div className="pub-foto">
            {m.foto ? (
              <img src={m.foto} alt={nombre} onError={(e) => (e.target.style.display = 'none')} />
            ) : (
              <span className="mi fill" style={{ fontSize: 90, color: 'rgba(255,255,255,.7)' }}>
                pets
              </span>
            )}
          </div>

          <div className="pub-body">
            <div className="pub-nombre">{nombre}</div>
            <div className="tags" style={{ marginTop: 10 }}>
              <span className="tag">{ESPECIE_LBL[m.especie] || 'Mascota'}</span>
              {m.sexo && m.sexo !== 'No sé' ? <span className="tag">{m.sexo}</span> : null}
              {m.color ? <span className="tag">{m.color}</span> : null}
              {m.tamano ? <span className="tag">{m.tamano}</span> : null}
              {m.raza ? <span className="tag">{m.raza}</span> : null}
              {m.edad ? <span className="tag">{m.edad}</span> : null}
            </div>

            {m.descripcion ? (
              <div className="signs" style={{ marginTop: 16 }}>
                <div className="sec-t">Señas</div>
                <div className="tx">{m.descripcion}</div>
              </div>
            ) : null}

            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--muted)', margin: '18px 0 10px', lineHeight: 1.5, textAlign: 'center' }}>
              {m.perdido ? '¿La encontraste? ¡Avisale a su familia!' : 'Si me encontraste, avisale a mi familia 🐾'}
            </div>
          </div>
        </div>

        <div className="pub-cta">
          {m.perdido && m.reporte_id ? (
            avisado ? (
              <div className="pub-ok">
                <span className="mi fill" style={{ fontSize: 20, color: 'var(--green)' }}>
                  check_circle
                </span>
                ¡Gracias! La familia ya recibió tu ubicación. Están en camino 🐾
              </div>
            ) : (
              <button className="btn-ubi" onClick={avisarUbicacion} disabled={enviando}>
                <span className="mi fill" style={{ fontSize: 22 }}>
                  my_location
                </span>
                {enviando ? 'Enviando…' : 'Avisar a la familia dónde estoy'}
              </button>
            )
          ) : null}
          {msg ? <div className="pub-msg">{msg}</div> : null}
          {waLink ? (
            <a className="btn-wa" href={waLink} target="_blank" rel="noreferrer">
              <span className="mi fill" style={{ fontSize: 24 }}>
                chat
              </span>
              Avisar por WhatsApp
            </a>
          ) : !(m.perdido && m.reporte_id) ? (
            <div className="empty" style={{ padding: 12 }}>
              Esta mascota no tiene un contacto cargado.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
