// Primera pantalla al tocar la patita: elegir el camino.
export default function IntentPublicar({ onPerdido, onEncontre, onCerrar }) {
  return (
    <div className="view">
      <div className="fhead">
        <button className="mi close" onClick={onCerrar}>
          close
        </button>
        <div className="ftitle">Publicar</div>
      </div>

      <div className="body" style={{ padding: '10px 20px 24px' }}>
        <div className="intent-lead">¿Qué querés publicar?</div>

        <button className="intent-card" onClick={onPerdido}>
          <div className="intent-ic" style={{ background: '#fff1ee', color: 'var(--coral-strong)' }}>
            <span className="mi" style={{ fontSize: 32 }}>
              error_outline
            </span>
          </div>
          <div className="intent-tx">
            <div className="intent-t">Se me perdió</div>
            <div className="intent-s">Mi mascota se perdió y la estoy buscando</div>
          </div>
          <span className="mi intent-arrow">chevron_right</span>
        </button>

        <button className="intent-card" onClick={onEncontre}>
          <div className="intent-ic" style={{ background: '#eef3fe', color: 'var(--blue)' }}>
            <span className="mi fill" style={{ fontSize: 32 }}>
              pets
            </span>
          </div>
          <div className="intent-tx">
            <div className="intent-t">Encontré una</div>
            <div className="intent-s">Vi o tengo una mascota que no es mía</div>
          </div>
          <span className="mi intent-arrow">chevron_right</span>
        </button>
      </div>
    </div>
  )
}
