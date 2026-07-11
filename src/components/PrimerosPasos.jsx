import { useEffect, useState } from 'react'
import { getUbicaciones, getMisMascotas } from '../data/store.js'
import { yaSuscripto } from '../lib/push.js'
import { pasoHecho, marcarPaso, marcarPasosOk, INSTAGRAM_URL } from '../lib/pasos.js'

// Checklist de "Primeros pasos". Se tilda solo leyendo datos reales (ubicación,
// mascotas, push); compartir y seguir redes son acciones que se marcan al hacerlas.
export default function PrimerosPasos({ user, onIrSeccion, onNuevaMascota, onCompleto, onToast }) {
  const [cargando, setCargando] = useState(true)
  const [ubic, setUbic] = useState(false)
  const [masc, setMasc] = useState(false)
  const [push, setPush] = useState(false)
  const [compartir, setCompartir] = useState(pasoHecho('compartir'))
  const [redes, setRedes] = useState(pasoHecho('redes'))
  const [redesAbierto, setRedesAbierto] = useState(false)

  useEffect(() => {
    let vivo = true
    Promise.all([
      getUbicaciones(user?.id).catch(() => []),
      getMisMascotas(user?.id).catch(() => []),
      yaSuscripto().catch(() => false),
    ]).then(([u, m, p]) => {
      if (!vivo) return
      setUbic((u || []).length > 0)
      setMasc((m || []).length > 0)
      setPush(!!p)
      setCargando(false)
    })
    return () => {
      vivo = false
    }
  }, [user?.id])

  const hechos = [ubic, masc, push, compartir, redes].filter(Boolean).length
  const total = 5
  const completo = !cargando && hechos === total

  useEffect(() => {
    if (completo) {
      marcarPasosOk()
      onCompleto && onCompleto()
    }
  }, [completo])

  async function compartirApp() {
    const data = {
      title: 'Chicho',
      text: 'Chicho — mascotas perdidas y encontradas en tu zona 🐾',
      url: 'https://chicho.ar',
    }
    try {
      if (navigator.share) {
        await navigator.share(data)
      } else {
        await navigator.clipboard.writeText('https://chicho.ar')
        onToast && onToast('Link copiado 📋')
      }
      marcarPaso('compartir')
      setCompartir(true)
    } catch (e) {
      /* canceló: no marcamos */
    }
  }

  function abrirInstagram() {
    window.open(INSTAGRAM_URL, '_blank', 'noopener')
    setRedesAbierto(true)
  }
  function confirmarRedes() {
    marcarPaso('redes')
    setRedes(true)
    setRedesAbierto(false)
  }

  const PASOS = [
    { done: ubic, ic: 'location_on', t: 'Cargá tu ubicación', s: 'Para enterarte de avisos cerca tuyo', btn: 'Cargar', accion: () => onIrSeccion('ubicaciones') },
    { done: masc, ic: 'pets', t: 'Cargá tus mascotas', s: 'Si una se pierde, la publicás en 1 toque', btn: 'Cargar', accion: onNuevaMascota },
    { done: push, ic: 'notifications', t: 'Activá las notificaciones', s: 'Recibí avisos de perdidos y encontrados', btn: 'Activar', accion: () => onIrSeccion('notificaciones') },
    { done: compartir, ic: 'share', t: 'Compartí Chicho', s: 'Cuanta más gente, más rápido vuelven a casa', btn: 'Compartir', accion: compartirApp },
  ]

  const pct = Math.round((hechos / total) * 100)

  return (
    <div className="pp-card">
      <div className="pp-top">
        <div className="pp-title">Primeros pasos</div>
        <div className="pp-count">
          {hechos} de {total}
        </div>
      </div>
      <div className="pp-bar">
        <div className="pp-bar-fill" style={{ width: pct + '%' }} />
      </div>

      {completo && (
        <div className="pp-listo">
          🎉 <b>¡Listo!</b> Completaste todos los pasos. ¡Gracias por sumarte!
        </div>
      )}

      <div className="pp-rows">
        {PASOS.map((p) => (
          <div key={p.t} className={'pp-row' + (p.done ? ' done' : '')}>
            <span className={'mi' + (p.done ? ' fill' : '')} style={{ fontSize: 22, color: p.done ? '#1f9d8f' : 'var(--navy)' }}>
              {p.done ? 'check_circle' : p.ic}
            </span>
            <div className="pp-row-txt">
              <div className="pp-row-t">{p.t}</div>
              {!p.done && <div className="pp-row-s">{p.s}</div>}
            </div>
            {!p.done && (
              <button className="pp-btn" onClick={p.accion}>
                {p.btn}
              </button>
            )}
          </div>
        ))}

        {/* Paso "Seguir en Instagram": botón + confirmar (no verificable) */}
        <div className={'pp-row' + (redes ? ' done' : '')}>
          <span className={'mi' + (redes ? ' fill' : '')} style={{ fontSize: 22, color: redes ? '#1f9d8f' : 'var(--navy)' }}>
            {redes ? 'check_circle' : 'favorite'}
          </span>
          <div className="pp-row-txt">
            <div className="pp-row-t">Seguinos en Instagram</div>
            {!redes && <div className="pp-row-s">@chicho.ar — novedades y reencuentros</div>}
          </div>
          {!redes &&
            (!redesAbierto ? (
              <button className="pp-btn" onClick={abrirInstagram}>
                Seguir
              </button>
            ) : (
              <button className="pp-btn ok" onClick={confirmarRedes}>
                Ya te sigo ✓
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
