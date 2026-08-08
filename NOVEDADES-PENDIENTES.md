# Novedades pendientes de publicar

Cola de mejoras que ya están en vivo y todavía no se contaron. El formato del bloque y
quién lo agrega están en `CLAUDE.md` → "Cuando salga una mejora que el usuario nota".

- El **chat de código** agrega el bloque en el mismo commit que la mejora, y es el
  **único que edita este archivo**: también es el que tacha y el que borra.
- El **chat de novedades** manda el push desde el panel y después avisa al de código
  qué bloque ya está contado, para que lo borre.
- El **chat de guiones** avisa cuando salió el video o el posteo.

Ningún chat que no sea el de código escribe acá, aunque sea "sólo una tilde": un
commit es un commit y dispara un deploy (`CLAUDE.md` → "Quién toca qué").

Archivo vacío quiere decir que está todo contado.

Las 18 novedades del arranque (todo lo hecho hasta `8d2d71e`) se llevan aparte, en el
calendario del hilo de novedades. Acá van las mejoras nuevas, de ahí en adelante.

---

## Ahora entrás a ver las mascotas en un toque

- commit: "Bienvenida: que se pueda entrar a ver los avisos desde la primera pantalla" · 31-jul-2026
- Qué cambió: al entrar por primera vez había un recorrido de 7 pantallas, y para llegar
  a los avisos había que pasarlas todas de a una o encontrar un "Saltar" chiquito y gris
  arriba. Ahora la primera pantalla tiene un botón grande que dice **"Ver las mascotas de
  mi zona"** y te lleva derecho al listado; el recorrido queda abajo como opción, para el
  que lo quiera — y pasó de 7 pantallas a **4**, así el que lo mira lo termina.
- Por qué le importa: el que llega desde un link compartido en un grupo de Facebook o por
  WhatsApp entra buscando si está su mascota, no a leer siete pantallas. Antes muchos se
  quedaban trabados ahí y no llegaban nunca a ver un aviso.
- Dónde se ve: abrí chicho.ar en una ventana de incógnito (o borrá los datos del sitio) y
  es la primera pantalla, la de "¡Bienvenido a Chicho!". Abajo se ven los dos botones:
  el navy **"Ver las mascotas de mi zona"** y debajo **"Ver cómo funciona"**. Tocando el
  primero aparece el feed al instante.
- [ ] push desde el panel    [ ] redes

## Si en tu ciudad todavía no hay avisos, Chicho te invita a empezar

- commit: "Feed vacío: invitar a publicar en vez de avisar de un fracaso" · 31-jul-2026
- Qué cambió: si abrías Chicho en una ciudad donde todavía no hay avisos publicados, la
  pantalla decía "No hay resultados con esos filtros" — y encima era mentira, porque no
  habías puesto ningún filtro. Ahora te cuenta que Chicho recién llega a tu zona y te
  ofrece publicar el primer aviso, o mirar otra ciudad.
- Por qué le importa: llega gente de todo el país desde links compartidos, y muchos caen
  en ciudades donde Chicho todavía no tiene avisos. Encontrarse con un cartel de "sin
  resultados" parece que la app está rota o vacía, y se van. Ahora entienden que son los
  primeros y tienen el botón para publicar ahí mismo.
- Dónde se ve: en el inicio, tocá el nombre de tu ciudad arriba (el chip con el pin 📍) y
  elegí una donde todavía no haya avisos — Cañuelas o Diamante sirven. Aparece "Todavía
  no hay avisos en …" con los botones **"Se me perdió"** y **"Encontré una"**. Si además
  tocás la pestaña **Perdidos**, el texto cambia y dice que estar vacío es una buena
  noticia. 🎉
- [ ] push desde el panel    [ ] redes

## Primeros pasos ahora te ayuda a instalar la app

- commit: "Bienvenida de 4 pasos, sin Guía en la app, e instalar entra a Primeros pasos" · 31-jul-2026
- Qué cambió: la lista de "Primeros pasos" sumó **Instalá la app**, con su botón, y quedó
  **primera**. Es el paso del que dependen todos los avisos: si Chicho no está instalado
  en el teléfono, las notificaciones no llegan aunque las actives. Antes eso solo lo
  explicaba un cartel del inicio que, si lo cerrabas una vez, no volvía nunca. De paso se
  reordenó todo: primero lo que te hace llegar los avisos (instalar, notificaciones,
  ubicación), después lo tuyo (mascotas) y al final compartir.
- Por qué le importa: las notificaciones son lo que hace que una mascota aparezca en la
  primera hora, que es cuando se encuentran. Quien no tenía la app instalada se quedaba
  afuera de eso sin enterarse, y encima la lista le pedía activar avisos que todavía no
  podía recibir.
- Dónde se ve: menú (la carita arriba a la izquierda) → **Primeros pasos**. **Instalá la
  app** es el primer ítem, con el botón **Instalar**; si ya la tenés, aparece tildado
  solo. El contador de arriba dice 6 en vez de 5. Además la pantalla ya no parpadea al
  abrirse: antes mostraba un segundo todo sin completar y después se tildaba solo.
- [ ] push desde el panel    [ ] redes

## Tu aviso guarda todas las veces que volvió a casa

- commit: "El historial de reencuentros vive en el aviso" · 8-ago-2026
- Qué cambió: si una mascota se pierde más de una vez, cada vuelta a casa queda guardada.
  Entrás a tu aviso y ves su historia: **"Volvió a casa 2 veces"**, con la fecha de cada
  vez y cuántos días estuvo afuera. Antes eso no se guardaba en ningún lado: al reabrir un
  aviso, el reencuentro anterior se perdía.
- Por qué le importa: es parte de la vida de la mascota. Y para la familia que ya pasó por
  esto, ver "la otra vez volvió a los 2 días" en el peor momento vale más que cualquier
  cosa que le podamos decir nosotros.
- Dónde se ve: entrá a un aviso **tuyo** que hayas marcado como "Ya en casa". Abajo
  aparece el cartel ámbar **"🏠 Volvió a casa"** con la fecha y los días. Si además tenés
  la mascota cargada en **Mis mascotas**, en su tarjeta figura **"🏠 Volvió 2 veces"**.
  (Esto lo ve solamente su familia: no es público.)
- [ ] push desde el panel    [ ] redes

## Subir la foto del reencuentro, desde el aviso

- commit: "La foto del reencuentro se sube desde el propio aviso" · 7-ago-2026
- Qué cambió: cuando tu mascota vuelve a casa, Chicho te invita a subir una foto de ella
  ya en casa. Antes ese botón estaba sólo en Mi cuenta → Avisos, a tres toques y en otra
  pantalla; ahora aparece en el aviso mismo, que es donde uno lo busca. La foto se ve al
  instante, sin recargar nada.
- Por qué le importa: esas fotos arman el muro de **Ya en casa**, que es lo que ve la
  gente que todavía está buscando a la suya. Cada reencuentro que se cuenta con una foto
  es alguien que sigue buscando un rato más.
- Dónde se ve: entrá a un aviso **tuyo** que ya hayas marcado como "Ya en casa" y que no
  tenga foto del reencuentro. Abajo de la foto principal aparece el cartel ámbar
  "**¿Tenés una foto de … ya en casa?**" con el botón para subirla.
- [ ] push desde el panel    [ ] redes

## Los puntitos de las fotos ahora se tocan

- commit: "Detalle: los puntitos del carrusel ahora cambian de foto al tocarlos" · 3-ago-2026
- Qué cambió: en un aviso con varias fotos, los puntitos de abajo sólo indicaban en cuál
  estabas: había que deslizar sí o sí. Ahora tocás el puntito y va a esa foto. Además el
  área que responde al dedo es mucho más grande que el punto (se ve igual, pero ya no hay
  que apuntarle a algo de 7 píxeles).
- Por qué le importa: tocar el puntito es lo primero que la gente intenta, y como no
  pasaba nada, muchos se quedaban viendo sólo la primera foto — justo donde a veces está
  la seña que la identifica (una mancha, el collar, la cola).
- Dónde se ve: abrí cualquier aviso que tenga **más de una foto**; abajo de la foto
  aparecen los puntitos. Tocá el de la derecha y la foto cambia.
- [ ] push desde el panel    [ ] redes

## "Encontré" busca en tu ciudad y alrededores, no en toda la provincia

- commit: "Encontré: buscar los parecidos en tu zona, no en toda la provincia" · 1-ago-2026
- Qué cambió: cuando cargás una mascota que encontraste, Chicho te muestra los perdidos
  que se le parecen. Antes buscaba en **toda la provincia**, así que te podía mostrar uno
  de una ciudad a 300 km. Ahora busca donde dice el cartel: **tu ciudad y lo que esté a
  menos de 20 km**. Y si tocás "Cambiar" y elegís otra ciudad, ahora sí se actualiza la
  lista (antes no cambiaba nada).
- Por qué le importa: encontraste un perro en tu barrio y necesitás saber si alguien
  cerca lo está buscando. Que se cuelen avisos de la otra punta de la provincia entre los
  cuatro que te muestra significa perder lugares que le correspondían a los de tu zona —
  justo a los que sí podrían ser.
- Dónde se ve: tocá **👁️ Encontré**, elegí Perro o Gato y mirá el cartel gris que dice
  "**Buscando en … y alrededores**". Tocá **Cambiar**, elegí una ciudad lejana (por
  ejemplo Neuquén si estás en Paraná) y vas a ver que la lista de abajo cambia.
- [ ] push desde el panel    [ ] redes

## Se ven bien las fotitos de las mascotas parecidas

- commit: "Las fotos chicas mostraban un pedazo: Supabase recortaba en vez de achicar" · 1-ago-2026
- Qué cambió: en "Encontré una", cuando Chicho te muestra las mascotas perdidas que se
  parecen, las fotitos salían mal recortadas — se veía un pedazo del piso o de una pared
  en lugar del animal. Lo mismo pasaba en los resultados del buscador. Ahora se ven
  completas, igual que en el listado principal. Y de paso todas las fotos chicas de la
  app (el globito del mapa, tus mascotas, el perfil del QR) pesan bastante menos, así que
  las pantallas abren más rápido con datos móviles.
- Por qué le importa: esa lista existe para que reconozcas de un vistazo a la mascota que
  encontraste. Con la foto cortada no se reconocía nada, y alguien podía pasar de largo
  justo el aviso de la familia que la está buscando.
- Dónde se ve: tocá **👁️ Encontré** abajo, elegí Perro o Gato, y mirá la lista de
  "**¿Alguno es este?**": cada fila tiene su foto. También en la **lupa** de arriba,
  buscando cualquier cosa (por ejemplo "perro"), las fotitos de los resultados.
- [ ] push desde el panel    [ ] redes

## Ahora podés recibir los avisos sin instalar nada

- commit: "Los avisos no necesitan que instales la app (salvo en iPhone)" · 1-ago-2026
- Qué cambió: para que te llegaran los avisos de mascotas perdidas cerca tuyo, antes había
  que instalar Chicho en el teléfono. Ahora se activan directo desde el navegador, en un
  toque. Te llegan igual con Chicho cerrado. En iPhone sigue haciendo falta agregarlo a
  inicio, pero eso es una exigencia de Apple, no nuestra.
- Por qué le importa: los avisos son lo que hace que una mascota aparezca en la primera
  hora, que es cuando se encuentran. Pedir instalar antes era un paso que la mayoría no
  daba, y esa gente se quedaba sin enterarse de nada aunque quisiera ayudar. Ahora el
  vecino que entra una vez puede quedar sumado a la red sin instalar nada.
- Dónde se ve: entrá a chicho.ar con tu cuenta desde el celular (sin la app instalada).
  En el inicio, arriba de los avisos, aparece el cartel **"Activá los avisos de tu zona"**
  con el botón. Tocándolo el navegador pide permiso y ya está.
- [ ] push desde el panel    [ ] redes

## "Ya en casa" ahora dice cuándo volvió cada mascota

- commit: "Ya en casa: la fecha que se muestra es la del reencuentro" · 31-jul-2026
- Qué cambió: en la pestaña **Ya en casa** cada tarjeta decía "hace 6 días", y eso era
  cuándo se había publicado el aviso — o sea cuándo se perdió, justo lo contrario de lo
  que esa pantalla celebra. Ahora dice **"volvió hace 6 días"**, con la fecha del
  reencuentro, y la lista se ordena por eso: arriba los que volvieron más recién.
- Por qué le importa: esa pantalla es la prueba de que Chicho funciona. Con la fecha
  vieja parecía una lista de mascotas perdidas hace mucho; ahora se lee como lo que es,
  reencuentros frescos, uno atrás del otro.
- Dónde se ve: en el inicio, pestaña **🏠 Ya en casa**. Cada tarjeta arriba a la derecha
  dice "volvió hace 20 h", "volvió ayer", "volvió hace 4 días". Los reencuentros más
  nuevos quedan primeros. (Los avisos cerrados hace mucho, antes de que se guardara esa
  fecha, siguen mostrando la de publicación y no dicen "volvió".)
- [ ] push desde el panel    [ ] redes
