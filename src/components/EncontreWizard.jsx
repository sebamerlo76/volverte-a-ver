import { useEffect, useMemo, useState } from 'react'
import MapaLeaflet from './MapaLeaflet.jsx'
import SelectChips from './SelectChips.jsx'
import PhotoPicker from './PhotoPicker.jsx'
import FechaPicker from './FechaPicker.jsx'
import { coordsDeBarrio } from '../lib/parana.js'
import { NOMBRES_LOCALIDADES, LOCALIDAD_DEFECTO, nombresBarriosDe, coordsDeBarrioEn } from '../lib/localidades.js'
import { COLORES, SEXOS, COLLAR, TAMANOS, RAZAS_PERRO, RAZAS_GATO } from '../lib/opciones.js'
import { addReporte, addMascota, subirFotos } from '../data/store.js'
import { nombreMostrado, tiempoRelativo, linkWhatsApp } from '../lib/formato.js'
import { similitud } from '../lib/vector.js'

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
  const [especie, setEspecie] = useState('') // sin asumir: se elige en el paso 1
  const [color, setColor] = useState('')
  const [tamano, setTamano] = useState('')
  const [raza, setRaza] = useState('')
  const [sexo, setSexo] = useState('')
  const [edad, setEdad] = useState('')
  const [collar, setCollar] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fotos, setFotos] = useState([])
  const [huella, setHuella] = useState(null)
  const [analizando, setAnalizando] = useState(false)
  const [localidad, setLocalidad] = useState(LOCALIDAD_DEFECTO)
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
    const c = coordsDeBarrioEn(localidad, z)
    setPunto({ lat: c[0], lng: c[1] })
  }

  // Precargamos el modelo (bajo demanda) al abrir el asistente, para que la foto se analice rápido.
  useEffect(() => {
    import('../lib/similar.js')
      .then((m) => m.precargarModelo())
      .catch(() => {})
  }, [])

  // Al cambiar la primera foto, calculamos su huella (para sugerir parecidos).
  useEffect(() => {
    const primera = fotos[0]
    if (!primera) {
      setHuella(null)
      return
    }
    let vivo = true
    setHuella(null)
    setAnalizando(true)
    import('../lib/similar.js')
      .then((m) => m.huellaDeImagen(primera.url))
      .then((h) => vivo && setHuella(h))
      .finally(() => vivo && setAnalizando(false))
    return () => {
      vivo = false
    }
  }, [fotos[0]?.url])

  function atras() {
    if (paso === 1) onCerrar()
    else setPaso(paso - 1)
  }
  function siguiente() {
    if (paso === 1 && !especie) {
      onToast?.('Elegí qué animal es 🐾')
      return
    }
    setPaso(Math.min(TOTAL, paso + 1))
  }

  // Posibles dueños: perdidos activos que coinciden. Refina según el paso.
  // Solo en pasos 1 (especie), 2 (cómo es) y 4 (dónde). En foto/contacto no.
  const coincidencias = useMemo(() => {
    if (paso !== 1 && paso !== 2 && paso !== 3 && paso !== 4) return []
    const compat = (r, campo, valor, ignorarNoSe) => {
      if (!valor || (ignorarNoSe && valor === 'No sé')) return true
      if (!r[campo]) return true // si el otro no especificó, no lo descarto
      return r[campo] === valor
    }
    let arr = reportes.filter((r) => r.tipo === 'perdido' && r.estado === 'activo' && r.especie === especie)
    if (paso >= 2) {
      arr = arr.filter((r) => compat(r, 'color', color) && compat(r, 'tamano', tamano) && compat(r, 'sexo', sexo, true))
    }
    // Paso 3 (foto): ordenamos por parecido visual a la foto cargada.
    if (paso === 3) {
      if (!huella) return []
      const conH = arr.filter((r) => Array.isArray(r.embedding) && r.embedding.length === huella.length)
      return conH
        .map((r) => ({ r, s: similitud(huella, r.embedding) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 4)
        .map((o) => o.r)
    }
    if (paso >= 4) {
      arr = arr.filter((r) => compat(r, 'zona', zona))
    }
    return [...arr].sort((a, b) => (a.zona === zona ? 0 : 1) - (b.zona === zona ? 0 : 1)).slice(0, 4)
  }, [reportes, especie, color, tamano, sexo, zona, paso, huella])

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
      const fotosUrls = await subirFotos(fotos)
      const fotoUrl = fotosUrls[0] || ''
      await addReporte({
        tipo: 'encontrado',
        especie,
        nombre: null,
        localidad,
        zona,
        referencia: zona,
        color: color.trim(),
        tamano,
        raza: raza.trim(),
        sexo,
        edad: edad.trim(),
        collar: collar.trim(),
        descripcion: descripcion.trim(),
        foto: fotoUrl,
        fotos: fotosUrls,
        whatsapp: wa,
        fechaEvento: fecha || new Date().toISOString().slice(0, 10),
        lat: punto.lat,
        lng: punto.lng,
        enCustodia,
        embedding: huella,
      })
      if (enCustodia) {
        try {
          await addMascota({
            nombre: null,
            especie,
            color: color.trim(),
            tamano,
            raza: raza.trim(),
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
            {especie !== 'otro' && (
              <>
                <div className="flabel">Raza</div>
                <SelectChips
                  opciones={especie === 'gato' ? RAZAS_GATO : RAZAS_PERRO}
                  valor={raza}
                  onChange={setRaza}
                  otro
                  placeholder="Otra raza"
                />
              </>
            )}
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
            <PhotoPicker value={fotos} onChange={setFotos} max={3} />
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700, marginTop: 12, lineHeight: 1.5 }}>
              La foto ayuda muchísimo a que la familia la reconozca. Si no tenés, podés seguir igual.
            </div>
            {analizando && (
              <div className="analizando">
                <span className="mi spin" style={{ fontSize: 18 }}>
                  autorenew
                </span>
                Buscando parecidos por la foto…
              </div>
            )}
          </>
        )}

        {paso === 4 && (
          <>
            {NOMBRES_LOCALIDADES.length > 1 && (
              <>
                <div className="flabel">Ciudad</div>
                <div className="inp">
                  <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
                    location_city
                  </span>
                  <select
                    value={localidad}
                    onChange={(e) => {
                      const loc = e.target.value
                      setLocalidad(loc)
                      const z = nombresBarriosDe(loc)[0] || ''
                      setZona(z)
                      const c = coordsDeBarrioEn(loc, z)
                      setPunto({ lat: c[0], lng: c[1] })
                    }}
                  >
                    {NOMBRES_LOCALIDADES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="flabel">Zona / barrio</div>
            <div className="inp">
              <span className="mi" style={{ fontSize: 20, color: 'var(--navy)' }}>
                location_on
              </span>
              <select value={zona} onChange={(e) => cambiarZona(e.target.value)}>
                {nombresBarriosDe(localidad).map((b) => (
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
            <div className="flabel">¿Cuándo lo encontraste?</div>
            <FechaPicker value={fecha} onChange={setFecha} />
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
            <div className="coinc-sub">
              {paso === 3
                ? 'Ordenados por parecido a tu foto 🔍'
                : 'Fijate si su familia ya lo está buscando — así lo devolvés al toque.'}
            </div>
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
            <div
              className="match-foto"
              onClick={() => {
                if (onVerAviso) {
                  const r = matchPreview
                  setMatchPreview(null)
                  onVerAviso(r)
                }
              }}
            >
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
              <span className="mi" style={{ fontSize: 16, color: 'var(--navy)' }}>
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
