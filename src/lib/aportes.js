// Tipos de aporte de un vecino a un aviso. Antes había uno solo ("lo vi acá", con
// punto en el mapa) y toda otra información se perdía: en los grupos de Facebook
// pasa seguido que alguien SABE de quién es el perro, o que el animal tiene dueño y
// se escapa siempre — datos que resuelven el caso y no entraban en "lo vi".
//
// A propósito NO hay comentarios libres: elegir un tipo obliga a aportar algo
// concreto y le deja afuera el "pobrecito, que alguien haga algo" que llena los
// grupos y no ayuda a nadie (y encima le pega a la familia que está buscando).
export const TIPOS_APORTE = [
  {
    k: 'visto',
    t: 'Lo vi',
    d: 'Lo vi en un lugar y te marco dónde',
    ic: 'visibility',
    color: '#1f9d8f',
    mapa: true, // pide marcar el punto
    titulo: '¡Lo vi acá!',
    pregunta: '¿Cómo lo viste? (opcional)',
    chips: ['Lo vi suelto', 'Alguien lo tiene', 'Cruzó la calle', 'Estaba asustado', 'Se dejó acercar'],
  },
  {
    k: 'duenio',
    t: 'Sé de quién es',
    d: 'Conozco a la familia o sé dónde vive',
    ic: 'home',
    color: '#2f7fed',
    mapa: false,
    titulo: 'Sé de quién es',
    pregunta: '¿Qué sabés? (opcional)',
    chips: ['Sé dónde vive', 'Sé quién es el dueño', 'Ya lo llevé a su casa antes', 'Lo conocen en el barrio'],
  },
  {
    k: 'escapa',
    t: 'Tiene dueño y se escapa',
    d: 'No está perdido: se escapa seguido y vuelve',
    ic: 'repeat',
    color: '#8a807a',
    mapa: false,
    titulo: 'Tiene dueño y se escapa',
    pregunta: '¿Qué sabés? (opcional)',
    chips: ['Se escapa seguido y vuelve', 'Anda siempre por la zona', 'Los dueños lo dejan salir'],
  },
  {
    k: 'peligro',
    t: 'Está en peligro',
    d: 'Necesita que alguien vaya ahora',
    ic: 'warning',
    color: '#ff5747',
    mapa: true,
    titulo: 'Está en peligro',
    pregunta: '¿Qué está pasando? (opcional)',
    chips: ['Está en la calle', 'Parece herido', 'Lo van a sacar del lugar', 'Está encerrado'],
  },
]

export function tipoAporte(k) {
  return TIPOS_APORTE.find((x) => x.k === k) || TIPOS_APORTE[0]
}

// ¿Este aporte se dibuja en el mapa / el recorrido? Los que no marcan lugar guardan
// el punto de la zona del aviso (para no depender de que lat/lng sean nulos en la
// base), así que hay que filtrarlos por tipo y no por si tienen coordenadas.
export function aporteEnMapa(a) {
  return tipoAporte(a?.tipo).mapa
}
