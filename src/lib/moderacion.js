// Filtro simple de groserías/insultos para los textos que cargan los usuarios.
// No es infalible (ningún filtro lo es), pero frena lo obvio antes de publicar.
// Se combina con el baneo de usuarios para los casos que se pasen igual.

// Normaliza: minúsculas, sin acentos (á→a, ñ→n).
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Lista curada (ya normalizada: sin acentos). Evita palabras que colisionen con
// términos normales (no incluye "negro", "ano", "boludo", etc.).
const GROSERIAS = new Set(
  [
    'puto','puta','putos','putas','putita','putito','putazo','reputo','reputa',
    'concha','conchudo','conchuda','conchudos','conchudas',
    'forro','forra','forros','forras',
    'pelotudo','pelotuda','pelotudos','pelotudas',
    'gil','giles','gila',
    'sorete','soretes',
    'mierda','mierdas',
    'cagon','cagona','cagones',
    'tarado','tarada','tarados','taradas',
    'imbecil','imbeciles',
    'idiota','idiotas',
    'estupido','estupida','estupidos','estupidas',
    'maricon','maricones','marica',
    'trolo','trola','trolos','trolas',
    'trava','travas',
    'garca','garcas','garcada',
    'choto','chota','chotos','chotas',
    'verga','vergas','vergazo',
    'pija','pijas',
    'culiado','culiao','culiados','culiaos','culiada',
    'hdp','ctm',
    'subnormal','subnormales',
    'retrasado','retrasada','retrasados',
    'mogolico','mogolica','mogolicos',
    'puneta',
    'cornudo','cornuda',
    'zorra','zorras',
    'malparido','malparida',
    'gonorrea',
    'forrazo','sotreta',
  ].map(norm),
)

// ¿El texto tiene alguna grosería (como palabra entera)?
export function tieneGroseria(texto) {
  const palabras = norm(texto).split(/[^a-z0-9]+/)
  return palabras.some((p) => p && GROSERIAS.has(p))
}
