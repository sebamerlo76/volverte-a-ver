import { useEffect, useState } from 'react'
import { getMisMascotas } from '../data/store.js'

const ESPECIE_LBL = { perro: 'Perro', gato: 'Gato', otro: 'Otro' }

// "Se me perdió" -> elegir cuál de mis mascotas, o cargar una nueva.
export default function ElegirMascota({ user, onElegir, onOtra, onVolver }) {
  const [mascotas, setMascotas] = useState(null)

  useEffect(() => {
    let vivo = true
    getMisMascotas(user?.id)
      // "Se me perdió" es solo para tus mascotas, no las que tenés en tránsito.
      .then((m) => vivo && setMascotas(m.filter((x) => x.relacion !== 'transito')))
      .catch(() => vivo && setMascotas([]))
    return () => {
      vivo = false
    }
  }, [user?.id])

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onVolver}>
          arrow_back
        </button>
        <div className="ftitle">¿Cuál se perdió?</div>
      </div>

      <div className="body" style={{ padding: '6px 0 24px' }}>
        {mascotas === null ? (
          <div className="empty">Cargando…</div>
        ) : (
          <>
            {mascotas.length === 0 ? (
              <div className="masc-vacio" style={{ marginTop: 12 }}>
                No tenés mascotas cargadas. Cargá los datos ahora para publicar — y si querés, la guardás para
                la próxima. 🐾
              </div>
            ) : (
              mascotas.map((m) => (
                <button className="masc-row" key={m.id} onClick={() => onElegir(m)}>
                  <div className="masc-info" style={{ pointerEvents: 'none' }}>
                    <div className="masc-foto">
                      {m.foto ? (
                        <img src={m.foto} alt="" onError={(e) => (e.target.style.display = 'none')} />
                      ) : (
                        <span className="mi fill" style={{ fontSize: 26, color: '#c9a58f' }}>
                          pets
                        </span>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="masc-nombre">{m.nombre || 'Sin nombre'}</div>
                      <div className="masc-sub">
                        {ESPECIE_LBL[m.especie] || 'Mascota'}
                        {m.color ? ` · ${m.color}` : ''}
                      </div>
                    </div>
                  </div>
                  <span className="mi" style={{ fontSize: 24, color: '#c3b8b0' }}>
                    chevron_right
                  </span>
                </button>
              ))
            )}

            <div style={{ padding: '14px 20px 0' }}>
              <button className="btn-social" onClick={onOtra}>
                <span className="mi" style={{ fontSize: 22 }}>
                  add
                </span>
                {mascotas.length ? 'Otra mascota' : 'Cargar y publicar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
