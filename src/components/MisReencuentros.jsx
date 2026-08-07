import { useEffect, useState } from 'react'
import { getMisReencuentros } from '../data/store.js'
import { fechaLegible } from '../lib/formato.js'
import { ubicacionTexto } from '../lib/localidades.js'
import { fotoOptimizada } from '../lib/foto.js'

// Historial de reencuentros del usuario: cada vez que una de sus mascotas volvió a casa.
//
// PRIVADO, y no por descuido: un contador de "se perdió 3 veces" a la vista de todos se
// lee como reproche a la familia. Esto es para que ella lo tenga, no para mostrarlo.
// La RLS de la tabla ya lo garantiza (ver schema-historial-reencuentros.sql).
//
// Cuelga del AVISO y no de la mascota porque, medido sobre los datos reales, el 82% de
// los perdidos se publica sin tener la mascota cargada en "Mis mascotas": atándolo ahí,
// casi nadie tendría historial.
export default function MisReencuentros({ user }) {
  const [lista, setLista] = useState(null)

  useEffect(() => {
    let vivo = true
    getMisReencuentros(user?.id)
      .then((l) => vivo && setLista(l))
      .catch(() => vivo && setLista([]))
    return () => {
      vivo = false
    }
  }, [user?.id])

  if (lista === null) return <div className="empty">Cargando…</div>

  if (!lista.length) {
    return (
      <div className="empty">
        🏠 Todavía no hay ninguno.
        <br />
        Acá van a quedar guardadas todas las veces que una de tus mascotas vuelva a casa.
      </div>
    )
  }

  return (
    <div className="reenc-hist">
      <div className="adm-nota" style={{ marginTop: 0 }}>
        {lista.length === 1 ? 'Una vuelta a casa' : `${lista.length} vueltas a casa`} 💛 Esto lo ves solamente vos.
      </div>
      {lista.map((r) => (
        <div key={r.id} className="reenc-item">
          {r.foto ? (
            <img className="reenc-item-foto" src={fotoOptimizada(r.foto, 300)} alt="" loading="lazy" onError={(e) => (e.target.style.display = 'none')} />
          ) : (
            <div className="reenc-item-foto reenc-item-sinfoto">
              <span className="mi fill" style={{ fontSize: 26 }}>
                pets
              </span>
            </div>
          )}
          <div className="reenc-item-txt">
            <div className="reenc-item-t">{r.nombre || 'Sin nombre'}</div>
            <div className="reenc-item-s">Volvió el {fechaLegible(r.volvioEn)}</div>
            <div className="reenc-item-d">
              {/* Los días son lo que convierte la lista en una historia: no es lo mismo
                  "volvió" que "estuvo nueve días afuera y volvió". */}
              {r.dias === 0 ? 'El mismo día 🙌' : r.dias === 1 ? 'Estuvo 1 día afuera' : `Estuvo ${r.dias} días afuera`}
              {r.localidad ? ` · ${ubicacionTexto(r.localidad, r.zona)}` : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
