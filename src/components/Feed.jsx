import { useMemo, useState } from 'react'
import PetCard from './PetCard.jsx'
import { avatarDe } from '../lib/formato.js'

const ZONAS_RAPIDAS = ['Parque Urquiza', 'Centro', 'San Agustín']

export default function Feed({ reportes, onOpen, authActivo, logueado, user, onLogin, onCuenta }) {
  const avatar = avatarDe(user)
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('todos') // todos | perdido | encontrado
  const [especie, setEspecie] = useState(null) // perro | gato
  const [zona, setZona] = useState(null)

  const toggle = (valor, actual, setter) => setter(actual === valor ? null : valor)

  // Tocar el logo vuelve al inicio "fresco": limpia filtros y sube al tope.
  function irInicio() {
    setQ('')
    setEstado('todos')
    setEspecie(null)
    setZona(null)
    const b = document.querySelector('.body')
    if (b) b.scrollTop = 0
  }

  const filtrados = useMemo(() => {
    const texto = q.trim().toLowerCase()
    return reportes.filter((r) => {
      if (estado !== 'todos' && r.tipo !== estado) return false
      if (especie && r.especie !== especie) return false
      if (zona && r.zona !== zona) return false
      if (texto) {
        const hay = `${r.nombre || ''} ${r.raza || ''} ${r.color || ''} ${r.zona || ''} ${r.especie}`.toLowerCase()
        if (!hay.includes(texto)) return false
      }
      return true
    })
  }, [reportes, q, estado, especie, zona])

  return (
    <div className="view">
      <div className="body">
        <div className="hd">
          <div className="brand">
            <button className="logo" onClick={irInicio} aria-label="Ir al inicio">
              <span className="mi fill" style={{ fontSize: 21 }}>
                pets
              </span>
            </button>
            <div style={{ flex: 1 }}>
              <div className="bname">Volverte a ver</div>
              <div className="bsub">Paraná · Entre Ríos</div>
            </div>
            {authActivo ? (
              <button
                onClick={logueado ? onCuenta : onLogin}
                aria-label={logueado ? 'Mi cuenta' : 'Iniciar sesión'}
              >
                {logueado && avatar ? (
                  <img className="hd-av" src={avatar} alt="Mi cuenta" referrerPolicy="no-referrer" />
                ) : (
                  <span
                    className={'mi' + (logueado ? ' fill' : '')}
                    style={{ fontSize: 28, color: logueado ? '#ff6b5e' : '#c3b8b0' }}
                  >
                    {logueado ? 'account_circle' : 'login'}
                  </span>
                )}
              </button>
            ) : (
              <span className="mi" style={{ fontSize: 26, color: '#c3b8b0' }}>
                notifications
              </span>
            )}
          </div>
          <div className="search">
            <span className="mi" style={{ fontSize: 21, color: '#c9beb6' }}>
              search
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, barrio o color…"
            />
          </div>
        </div>

        <div className="chips">
          <button className={'chip' + (estado === 'todos' ? ' on' : '')} onClick={() => setEstado('todos')}>
            Todos
          </button>
          <button className={'chip lost' + (estado === 'perdido' ? ' on' : '')} onClick={() => setEstado('perdido')}>
            Perdidos
          </button>
          <button className={'chip found' + (estado === 'encontrado' ? ' on' : '')} onClick={() => setEstado('encontrado')}>
            Encontrados
          </button>
          <button className={'chip' + (especie === 'perro' ? ' on' : '')} onClick={() => toggle('perro', especie, setEspecie)}>
            Perros
          </button>
          <button className={'chip' + (especie === 'gato' ? ' on' : '')} onClick={() => toggle('gato', especie, setEspecie)}>
            Gatos
          </button>
          {ZONAS_RAPIDAS.map((z) => (
            <button key={z} className={'chip' + (zona === z ? ' on' : '')} onClick={() => toggle(z, zona, setZona)}>
              <span className="mi" style={{ fontSize: 17, color: zona === z ? '#fff' : '#ff6b5e' }}>
                location_on
              </span>
              {z}
            </button>
          ))}
        </div>

        <div className="count">
          {filtrados.length} {filtrados.length === 1 ? 'mascota' : 'mascotas'} en Paraná
        </div>

        {filtrados.length === 0 ? (
          <div className="empty">
            🔍 No hay resultados con esos filtros.
            <br />
            Probá quitar alguno.
          </div>
        ) : (
          filtrados.map((r) => <PetCard key={r.id} r={r} onClick={() => onOpen(r)} />)
        )}
        <div style={{ height: 18 }} />
      </div>
    </div>
  )
}
