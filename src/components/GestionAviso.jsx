import { useEffect, useState } from 'react'
import { getReportePorToken, resolverPorToken, borrarPorToken } from '../data/store.js'
import { ubicacionTexto } from '../lib/localidades.js'

// Página para gestionar un aviso publicado SIN cuenta (link chicho.ar/g/<token>).
// Deja cerrarlo ("ya volvió a casa") o borrarlo, sin login.
export default function GestionAviso({ token }) {
  const [r, setR] = useState(undefined) // undefined = cargando, null = no existe
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getReportePorToken(token)
      .then((x) => setR(x))
      .catch(() => setR(null))
  }, [token])

  async function cerrar() {
    setBusy(true)
    try {
      await resolverPorToken(token)
      setR((x) => ({ ...x, estado: 'resuelto' }))
      setMsg('🎉 ¡Listo! Tu aviso quedó cerrado. Gracias por ayudar a que vuelva a casa.')
    } catch (e) {
      setMsg('No se pudo cerrar. Probá de nuevo.')
    } finally {
      setBusy(false)
    }
  }
  async function borrar() {
    if (!window.confirm('¿Borrar el aviso? No se puede deshacer.')) return
    setBusy(true)
    try {
      await borrarPorToken(token)
      setR(null)
      setMsg('Aviso borrado.')
    } catch (e) {
      setMsg('No se pudo borrar. Probá de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const cerrado = r && r.estado === 'resuelto'

  return (
    <div className="app-shell">
      <div className="app pub">
        <div className="pub-scroll">
          <div className="pub-top">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
              <img src="/logo.png" alt="" width="48" height="48" style={{ display: 'block' }} />
              <span style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 30, color: 'var(--navy)' }}>Chicho</span>
            </div>
          </div>

          {r === undefined ? (
            <div className="empty" style={{ marginTop: 40 }}>Cargando tu aviso… 🐾</div>
          ) : !r ? (
            <div className="empty" style={{ marginTop: 40 }}>
              {msg || 'No encontramos este aviso. Puede que el link no sea válido o ya lo hayas borrado.'}
            </div>
          ) : (
            <div className="pub-body" style={{ paddingTop: 8 }}>
              <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 19, color: 'var(--navy)', textAlign: 'center' }}>
                Gestionar tu aviso
              </div>

              <div className="gest-card">
                {r.foto ? (
                  <img src={r.foto} alt="" onError={(e) => (e.target.style.display = 'none')} />
                ) : (
                  <div className="gest-noimg">
                    <span className="mi fill" style={{ fontSize: 30, color: '#c9a58f' }}>pets</span>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--navy)' }}>
                    {r.nombre || (r.especie === 'gato' ? 'Gato' : r.especie === 'otro' ? 'Mascota' : 'Perro')}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--muted)' }}>
                    {r.tipo === 'perdido' ? 'Perdido' : 'En la calle'}
                    {r.zona ? ` · ${r.localidad ? ubicacionTexto(r.localidad, r.zona) : r.zona}` : ''}
                  </div>
                  {cerrado && <div className="gest-cerrado">🏠 Cerrado</div>}
                </div>
              </div>

              {msg ? <div className="pub-msg" style={{ marginTop: 6 }}>{msg}</div> : null}

              {!cerrado ? (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button className="btn-ubi" onClick={cerrar} disabled={busy}>
                    <span className="mi fill" style={{ fontSize: 22 }}>home</span>
                    {busy ? 'Cerrando…' : 'Ya volvió a casa (cerrar)'}
                  </button>
                  <button className="gest-borrar" onClick={borrar} disabled={busy}>
                    <span className="mi" style={{ fontSize: 19 }}>delete</span>
                    Borrar el aviso
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                  Ya podés cerrar esta página. 💜
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
