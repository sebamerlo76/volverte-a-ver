// Dominio canónico de Chicho. Se usa para armar links que tienen que ser
// permanentes (el QR del collar, el link de gestión de un aviso sin cuenta),
// sin importar desde qué dominio se abrió la app (chicho.ar, el de Vercel,
// localhost). NO usar window.location.origin para esos casos: un QR impreso
// tiene que apuntar siempre a chicho.ar.
export const SITIO_URL = 'https://chicho.ar'
