import { useMemo, useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import SelectChips from './SelectChips.jsx'
import { NOMBRES_BARRIOS, coordsDeBarrio } from '../lib/parana.js'
import { COLORES, SEXOS, COLLAR, TAMANOS } from '../lib/opciones.js'
import { addReporte, addMascota, subirFoto } from '../data/store.js'
import { nombreMostrado, tiempoRelativo, linkWhatsApp } from '../lib/formato.js'

function ultimoWhatsapp() {
  try {
    return localStorage.getItem('vav_wa') || ''
  } catch (e) {
    return ''
  }
}

const TOTAL = 5
const TITULOS = [
  '¿Qué animal es?',
  '¿Cómo es?',
  'Una foto (si podés)',
  '¿Dónde y cuándo?',
  '¿Cómo te contactan?',
]

export default function EncontreWizard({ reportes = [], onVerAviso, onCerrar, onPublicado, onToast }) {
  const [paso, setPaso] = useState(1)
  const [especie, setEspecie] = useState('perro')
  const [color, setColor] = useState('')
  const [tamano, setTamano] = useState('')
  const [sexo, setSexo] = useState('')
  const [edad, setEdad] = useState('')
  const [collar, setCollar] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [foto, setFoto] = useState('')
  const [fotoFile, setFotoFile] = useState(null)
  const [zona, setZona] = useState('Centro')
  const [fecha, setFecha] = useState('')
  const [whatsapp, setWhatsapp] = useState(ultimoWhatsapp())
  const [soloAviso, setSoloAviso] = useState(false)
  const [matchPreview, setMatchPreview] = useState(null)
  const [enCustodia, setEnCustodia] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const cIni = coordsDeBarrio('Centro')
  const [punto, setPunto] = useState({ lat: cIni[0], lng: cIni[1] })

  function cambiarZona(z) {
    setZona(z)
    const c = coordsDeBarrio(z)
    setPunto({ lat: c[0], lng: c[1] })
  }

  function elegirFoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFoto(URL.createObjectURL(file))
  }

  function atras() {
    if (paso === 1) onCerrar()
    else setPaso(paso - 1)
  }
  function siguiente() {
    setPaso(Math.min(TOTAL, paso + 1))
  }

  // Posibles dueños: perdidos activos que coinciden. Refina según el paso.
  // Solo en pasos 1 (especie), 2 (cómo es) y 4 (dónde). En foto/contacto no.
  const coincidencias = useMemo(() => {
    if (paso !== 1 && paso !== 2 && paso !== 4) return []
    const compat = (r, campo, valor, ignorarNoSe) => {
      if (!valor || (ignorarNoSe && valor === 'No sé')) return true
      if (!r[campo]) return true // si el otro no especificó, no lo descarto
      return r[campo] === valor
    }
    let arr = reportes.filter((r) => r.tipo === 'perdido' && r.estado === 'activo' && r.especie === especie)
    if (paso >= 2) {
      arr = arr.filter((r) => compat(r, 'color', color) && compat(r, 'tamano', tamano) && compat(r, 'sexo', sexo, true))
    }
    if (paso >= 4) {
      arr = arr.filter((r) => compat(r, 'zona', zona))
    }
    return [...arr].sort((a, b) => (a.zona === zona ? 0 : 1) - (b.zona === zona ? 0 : 1)).slice(0, 4)
  }, [reportes, especie, color, tamano, sexo, zona, paso])

  async function publicar() {
    if (!soloAviso && !whatsapp.trim()) {
      onToast('Poné un WhatsApp, o marcá "solo quiero avisar" 🙏')
      return
    }
    setGuardando(true)
    try {
      const wa = soloAviso ? '' : whatsapp.trim()
      if (wa) {
        try {
          localStorage.setItem('vav_wa', wa)
        } catch (e) {
          /* ignore */
        }
      }
      const fotoUrl = fotoFile ? await subirFoto(fotoFile) : ''
      await addReporte({
        tipo: 'encontrado',
        especie,
        nombre: null,
        zona,
        referencia: zona,
        color: color.trim(),
        tamano,
        raza: '',
        sexo,
        edad: edad.trim(),
        collar: collar.trim(),
        descripcion: descripcion.trim(),
        foto: fotoUrl,
        whatsapp: wa,
        fechaEvento: fecha || new Date().toISOString().slice(0, 10),
        lat: punto.lat,
        lng: punto.lng,
        en_custodia: enCustodia,
      })
      if (enCustodia) {
        try {
          await addMascota({
            nombre: null,
            especie,
            color: color.trim(),
            tamano,
            raza: '',
            sexo,
            edad: edad.trim(),
            collar: collar.trim(),
            descripcion: descripcion.trim(),
            foto: fotoUrl,
            whatsapp: wa,
            relacion: 'transito',
          })
        } catch (e) {
          console.warn('No se pudo guardar en tránsito:', e)
        }
      }
      onPublicado()
    } catch (e) {
      console.error(e)
      onToast('No se pudo publicar 😕')
      setGuardando(false)
    }
  }

  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={atras}>
          {paso === 1 ? 'close' : 'arrow_back'}
        </button>
        <div className="ftitle">Encontré una</div>
      </div>

      <div className="wiz-prog">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={'wiz-dot' + (n <= paso ? ' on' : '')} />
        ))}
      </div>

      <div className="body form-body">
        <div className="wiz-titulo">{TITULOS[paso - 1]}</div>

        {paso === 1 && (
          <div className="spec">
            {[
              { k: 'perro', ic: 'pets', t: 'Perro', fill: true },
              { k: 'gato', ic: 'pets', t: 'Gato' },
              { k: 'otro', ic: 'more_horiz', t: 'Otro' },
            ].map((op) => (
              <button
                key={op.k}
                className={'specb' + (especie === op.k ? ' on' : '')}
                style={{ height: 88 }}
                onClick={() => setEspecie(op.k)}
              >
                <span className={'mi' + (op.fill && especie === op.k ? ' fill' : '')} style={{ fontSize: 30 }}>
                  {op.ic}
                </span>
                {op.t}
              </button>
            ))}
          </div>
        )}

        {paso === 2 && (
          <>
            <div className="flabel">Color</div>
            <SelectChips opciones={COLORES} valor={color} onChange={setColor} otro placeholder="Otro color" />
            <div className="flabel">Tamaño</div>
            <SelectChips opciones={TAMANOS} valor={tamano} onChange={setTamano} />
            <div className="flabel">Sexo</div>
            <SelectChips opciones={SEXOS} valor={sexo} onChange={setSexo} />
            <div className="flabel">Collar / chapita</div>
            <SelectChips opciones={COLLAR} valor={collar} onChange={setCollar} otro placeholder="Detalle, ej: collar rojo" />
            <div className="flabel">Señas particulares</div>
            <textarea
              className="ta"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Collar, raza aproximada, si es manso o asustadizo…"
            />
          </>
        )}

        {paso === 3 && (
          <>
            <label className="photo-up" style={{ width: '100%', height: 160 }}>
              {foto ? (
                <img src={foto} alt="Foto" />
              ) : (
                <>
                  <span className="mi" style={{ fontSize: 30 }}>
                    photo_camera
                  </span>
                  Tocá para agregar una foto
                </>
              )}
              <input type="file" accept="image/*" onChange={elegirFoto} style={{ display: 'none' }} />
            </label>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700, marginTop: 12, lineHeight: 1.5 }}>
              La foto ayuda muchísimo a que la familia la reconozca. Si no tenés, podés seguir igual.
            </div>
          </>
        )}

        {paso === 4 && (
          <>
            <div className="flabel">Zona / barrio</div>
            <div className="inp">
              <span className="mi" style={{ fontSize: 20, color: '#ff6b5e' }}>
                location_on
              </span>
              <select value={zona} onChange={(e) => cambiarZona(e.target.value)}>
                {NOMBRES_BARRIOS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="mappick" style={{ height: 200 }}>
              <MapaLeaflet
                center={[punto.lat, punto.lng]}
                zoom={15}
                interactivo
                onGps={setPunto}
                onMapaClick={setPunto}
                marcadores={[{ id: 'nuevo', lat: punto.lat, lng: punto.lng, tipo: 'encontrado', especie }]}
              />
              <div className="hint">Tocá el mapa para marcar el lugar exacto</div>
            </div>
            <div className="flabel">Fecha</div>
            <div className="inp">
              <span className="mi" style={{ fontSize: 20, color: '#ff6b5e' }}>
                calendar_today
              </span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </>
        )}

        {paso === 5 && (
          <>
            <button className="check-row" onClick={() => setSoloAviso((v) => !v)}>
              <span className={'check-box' + (soloAviso ? ' on' : '')}>
                {soloAviso && (
                  <span className="mi" style={{ fontSize: 16, color: '#fff' }}>
                    check
                  </span>
                )}
              </span>
              <span>
                Solo quiero avisar que lo vi <b>(sin dejar mis datos)</b>
              </span>
            </button>

            {!soloAviso ? (
              <>
                <div className="flabel">WhatsApp de contacto</div>
                <div className="inp">
                  <span className="mi" style={{ fontSize: 20, color: '#25D366' }}>
                    chat
                  </span>
                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ej: 343 412 3456"
                    inputMode="tel"
                  />
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700, marginTop: 12, lineHeight: 1.5 }}>
                  Cuando la familia vea el aviso, te va a escribir por acá. 🐾
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700, marginTop: 12, lineHeight: 1.5 }}>
                Se publica igual para que la familia lo vea en el mapa. Sin tu WhatsApp no van a poder escribirte. 👀
              </div>
            )}
            <button className="check-row" style={{ marginTop: 16 }} onClick={() => setEnCustodia((v) => !v)}>
              <span className={'check-box' + (enCustodia ? ' on' : '')}>
                {enCustodia && (
                  <span className="mi" style={{ fontSize: 16, color: '#fff' }}>
                    check
                  </span>
                )}
              </span>
              <span>
                La tengo conmigo <b>(en tránsito)</b> — guardarla en Mi cuenta
              </span>
            </button>
          </>
        )}

        {coincidencias.length > 0 && (
          <div className="coinc">
            <div className="coinc-t">
              <span className="mi" style={{ fontSize: 18, color: '#1f9d8f' }}>
                visibility
              </span>
              ¿Alguno es este?
            </div>
            <div className="coinc-sub">Fijate si su familia ya lo está buscando — así lo devolvés al toque.</div>
            {coincidencias.map((r) => (
              <button className="bres-row" key={r.id} onClick={() => setMatchPreview(r)}>
                <div className="bres-foto">
                  {r.foto ? (
                    <img src={r.foto} alt="" onError={(e) => (e.target.style.display = 'none')} />
                  ) : (
                    <span className="mi fill" style={{ fontSize: 22, color: '#c9a58f' }}>
                      pets
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="bres-nombre">{nombreMostrado(r)}</div>
                  <div className="bres-sub">
                    {r.zona} · Perdido · {tiempoRelativo(r.creadoEn)}
                  </div>
                </div>
                <span className="mi" style={{ fontSize: 22, color: '#c3b8b0' }}>
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>

      <div className="fsubmit">
        {paso < TOTAL ? (
          <button className="btn-pub" onClick={siguiente}>
            Siguiente
            <span className="mi" style={{ fontSize: 22 }}>
              chevron_right
            </span>
          </button>
        ) : (
          <button className="btn-pub" onClick={publicar} disabled={guardando}>
            <span className="mi" style={{ fontSize: 23 }}>
              campaign
            </span>
            {guardando ? 'Publicando…' : 'Publicar'}
          </button>
        )}
      </div>

      {matchPreview && (
        <div className="match-modal" onClick={() => setMatchPreview(null)}>
          <div className="match-card" onClick={(e) => e.stopPropagation()}>
            <button className="match-x" onClick={() => setMatchPreview(null)} aria-label="Cerrar">
              <span className="mi" style={{ fontSize: 22 }}>
                close
              </span>
            </button>
            <div className="match-foto">
              {matchPreview.foto ? (
                <img src={matchPreview.foto} alt="" onError={(e) => (e.target.style.display = 'none')} />
              ) : (
                <span className="mi fill" style={{ fontSize: 46, color: '#c9a58f' }}>
                  pets
                </span>
              )}
            </div>
            <div className="match-nombre">{nombreMostrado(matchPreview)}</div>
            <div className="match-sub">
              <span className="mi" style={{ fontSize: 16, color: '#ff6b5e' }}>
                location_on
              </span>
              {matchPreview.zona} · Perdido · {tiempoRelativo(matchPreview.creadoEn)}
            </div>
            <div className="match-tags">
              {matchPreview.sexo && matchPreview.sexo !== 'No sé' ? <span className="tag">{matchPreview.sexo}</span> : null}
              {matchPreview.color ? <span className="tag">{matchPreview.color}</span> : null}
              {matchPreview.tamano ? <span className="tag">{matchPreview.tamano}</span> : null}
              {matchPreview.collar ? <span className="tag">🦮 {matchPreview.collar}</span> : null}
            </div>
            {matchPreview.descripcion ? <div className="match-desc">{matchPreview.descripcion}</div> : null}
            <a
              className="btn-wa"
              href={linkWhatsApp(matchPreview)}
              target="_blank"
              rel="noreferrer"
              onClick={() => onToast('Abriendo WhatsApp…')}
            >
              <span className="mi fill" style={{ fontSize: 22 }}>
                chat
              </span>
              Contactar a la familia
            </a>
            {onVerAviso && (
              <button
                className="match-ver"
                onClick={() => {
                  const r = matchPreview
                  setMatchPreview(null)
                  onVerAviso(r)
                }}
              >
                Ver aviso completo
              </button>
            )}
            <button className="match-no" onClick={() => setMatchPreview(null)}>
              No es este — seguir
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
