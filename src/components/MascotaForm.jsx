import { useState } from 'react'
import { addMascota, actualizarMascota, eliminarMascota, subirFoto } from '../data/store.js'
import SelectChips from './SelectChips.jsx'
import { COLORES, SEXOS, EDADES, COLLAR, TAMANOS } from '../lib/opciones.js'

export default function MascotaForm({ inicial, onCerrar, onGuardado, onToast }) {
  const editando = !!inicial
  const [especie, setEspecie] = useState(inicial?.especie || 'perro')
  const [foto, setFoto] = useState(inicial?.foto || '')
  const [fotoFile, setFotoFile] = useState(null)
  const [nombre, setNombre] = useState(inicial?.nombre || '')
  const [sexo, setSexo] = useState(inicial?.sexo || '')
  const [edad, setEdad] = useState(inicial?.edad || '')
  const [collar, setCollar] = useState(inicial?.collar || '')
  const [color, setColor] = useState(inicial?.color || '')
  const [tamano, setTamano] = useState(inicial?.tamano || '')
  const [raza, setRaza] = useState(inicial?.raza || '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion || '')
  const [guardando, setGuardando] = useState(false)

  function elegirFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFoto(URL.createObjectURL(file))
  }

  async function guardar() {
    if (!nombre.trim()) {
      onToast('Poné un nombre 🐾')
      return
    }
    setGuardando(true)
    try {
      const fotoUrl = fotoFile ? await subirFoto(fotoFile) : foto
      const datos = {
        nombre: nombre.trim(),
        especie,
        sexo,
        edad: edad.trim(),
        collar: collar.trim(),
        color: color.trim(),
        tamano,
        raza: raza.trim(),
        descripcion: descripcion.trim(),
        foto: fotoUrl,
      }
      if (editando) await actualizarMascota(inicial.id, datos)
      else await addMascota(datos)
      onGuardado()
    } catch (e) {
      console.error(e)
      onToast('No se pudo guardar 😕')
      setGuardando(false)
    }
  }

  async function borrar() {
    if (!window.confirm('¿Sacar esta mascota de tu perfil? Se puede volver a cargar cuando quieras.')) return
    try {
      await eliminarMascota(inicial.id)
      onGuardado()
    } catch (e) {
      console.error(e)
      onToast('No se pudo borrar 😕')
    }
  }

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onCerrar}>
          arrow_back
        </button>
        <div className="ftitle">{editando ? 'Editar mascota' : 'Agregar mascota'}</div>
      </div>

      <div className="body form-body">
        <div className="flabel">Especie</div>
        <div className="spec">
          {[
            { k: 'perro', ic: 'pets', t: 'Perro', fill: true },
            { k: 'gato', ic: 'pets', t: 'Gato' },
            { k: 'otro', ic: 'more_horiz', t: 'Otro' },
          ].map((op) => (
            <button key={op.k} className={'specb' + (especie === op.k ? ' on' : '')} onClick={() => setEspecie(op.k)}>
              <span className={'mi' + (op.fill && especie === op.k ? ' fill' : '')} style={{ fontSize: 23 }}>
                {op.ic}
              </span>
              {op.t}
            </button>
          ))}
        </div>

        <div className="flabel">Foto</div>
        <label className="photo-up">
          {foto ? (
            <img src={foto} alt="Foto de la mascota" />
          ) : (
            <>
              <span className="mi" style={{ fontSize: 26 }}>
                photo_camera
              </span>
              Agregar
            </>
          )}
          <input type="file" accept="image/*" onChange={elegirFoto} style={{ display: 'none' }} />
        </label>

        <div className="flabel">Nombre</div>
        <div className="inp">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Rocco" />
        </div>

        <div className="flabel">Sexo</div>
        <SelectChips opciones={SEXOS} valor={sexo} onChange={setSexo} />

        <div className="flabel">Edad (aprox.)</div>
        <SelectChips opciones={EDADES} valor={edad} onChange={setEdad} otro placeholder="Ej: 2 años" />

        <div className="flabel">Collar / chapita</div>
        <SelectChips opciones={COLLAR} valor={collar} onChange={setCollar} otro placeholder="Detalle, ej: rojo con chapita" />

        <div className="flabel">Color</div>
        <SelectChips opciones={COLORES} valor={color} onChange={setColor} otro placeholder="Otro color" />

        <div className="flabel">Tamaño</div>
        <SelectChips opciones={TAMANOS} valor={tamano} onChange={setTamano} />

        <div className="flabel">Raza</div>
        <div className="inp">
          <input value={raza} onChange={(e) => setRaza(e.target.value)} placeholder="Ej: Caniche (o mestizo)" />
        </div>

        <div className="flabel">Señas particulares</div>
        <textarea
          className="ta"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Collar, cicatrices, comportamiento, algo que lo distinga…"
        />

        {editando && (
          <button className="btn-logout" style={{ marginTop: 18 }} onClick={borrar}>
            <span className="mi" style={{ fontSize: 20 }}>
              heart_broken
            </span>
            Ya no lo tengo
          </button>
        )}
        <div style={{ height: 24 }} />
      </div>

      <div className="fsubmit">
        <button className="btn-pub" onClick={guardar} disabled={guardando}>
          <span className="mi" style={{ fontSize: 23 }}>
            {editando ? 'save' : 'add'}
          </span>
          {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar mascota'}
        </button>
      </div>
    </div>
  )
}
