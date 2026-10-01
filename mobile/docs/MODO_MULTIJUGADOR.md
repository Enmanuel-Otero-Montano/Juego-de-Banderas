# Especificación de producto y técnica: Carrera de Banderas

Estado: **MVP implementado localmente en la rama `codex/carrera-multijugador-mvp`**.
El issue #48 debe permanecer abierto hasta aplicar la migración en staging,
validar el flujo con dispositivos Android reales y aprobar explícitamente estas
reglas.

## Resumen

**Carrera de Banderas** es una partida privada, simultánea y en tiempo real para
2 a 8 personas. Todas recorren el mismo pool de 12 banderas. Una respuesta
correcta avanza un puesto; una incorrecta mantiene a la persona en la misma
bandera y aplica una penalización breve. Gana quien completa primero las 12.

Una **sala** conserva el código, el grupo y los ajustes; dentro de ella se pueden
jugar muchas **rondas**. Pedir revancha crea una ronda nueva, no otra sala, por
lo que nadie necesita compartir un enlace otra vez.

La carrera termina para todos en el instante en que el servidor confirma la
última respuesta del ganador. Si nadie llega a la meta antes de 90 segundos,
gana quien haya avanzado más.

El modo es independiente del progreso de Viaje, los lugares y todos los rankings
públicos. Su propuesta de valor se resume en una frase:

> Resuelve todas las banderas antes que los demás.

## Decisiones de producto propuestas

| Pregunta | Propuesta |
| --- | --- |
| ¿Simultáneo o asíncrono? | Simultáneo y en tiempo real. |
| ¿Cuántas personas? | De 2 a 8, contando a quien crea la sala. |
| ¿Cómo se entra? | Sala privada mediante enlace o código. |
| ¿Se reutiliza la sala? | Sí. Después de cada resultado se vuelve al mismo lobby y se puede iniciar otra ronda. |
| ¿Qué define al ganador? | Ser la primera persona en resolver correctamente las 12 banderas. |
| ¿Cuándo termina? | Inmediatamente al llegar alguien a 12/12, o a los 90 segundos. |
| ¿Qué ocurre al fallar? | No se avanza, se bloquean las respuestas 1,5 segundos y se reintenta la misma bandera. |
| ¿Todos juegan lo mismo? | Sí: mismos países, orden y distractores; cambia la posición visual de las opciones. |
| ¿Usa lugares? | No. Puede compartirse dentro de un lugar, pero no depende de él ni le da puntos. |
| ¿Afecta rankings públicos? | No. La clasificación pertenece únicamente a esa carrera. |
| ¿Requiere cuenta? | Sí en la primera versión, para identidad, reconexión y una plaza por persona. |
| ¿Incluye ayudas? | No hay corazones, pistas, monedas, anuncios recompensados ni ventajas Pro. |

Los valores de 12 banderas, 90 segundos y 1,5 segundos de penalización son la
configuración inicial. Deben vivir en reglas versionadas del servidor para poder
ajustarlos con datos sin actualizar el APK.

## Objetivos

- Crear una experiencia social que se entienda sin tutorial largo.
- Premiar conocimiento y velocidad en vez de acumular puntos opacos.
- Hacer que consultar Lens o una IA externa consuma tiempo competitivo.
- Reutilizar el catálogo, las cuentas y la validación de respuestas existentes.
- Admitir grupos pequeños sin necesitar matchmaking público al lanzamiento.
- Mantener el modo Viaje y el juego offline completamente independientes.

## Fuera de la primera versión

- matchmaking contra personas desconocidas;
- rankings globales o temporadas de Carrera;
- carreras públicas vinculadas a lugares;
- chat, voz, espectadores, equipos o torneos;
- bots que rellenen plazas;
- premios, apuestas, monedas o XP por ganar;
- power-ups o ventajas comprables;
- preguntas de capitales o país → bandera;
- más de ocho participantes;
- invitados sin cuenta.

Tampoco forman parte del MVP los formatos Sprint de 8 banderas y Maratón de 20.
La carrera estándar de 12 debe validarse antes de ampliar las reglas.

## Reglas de la carrera

### Pool y dificultad

- Cada carrera contiene exactamente 12 países del catálogo vigente.
- La primera versión usa únicamente **bandera → país** para que todas las
  preguntas tengan un tiempo de lectura comparable.
- Quien crea la sala elige recorrido: Mundo, América, Europa, Asia, África u
  Oceanía.
- También elige Fácil, Normal o Difícil. Las tres usan 12 banderas; cambia la
  mezcla de niveles de reconocimiento, no la longitud de la carrera.
- La composición exacta se genera en el servidor mediante reglas versionadas.
  Como configuración inicial:

| Dificultad | Familiares | Intermedias | Expertas |
| --- | ---: | ---: | ---: |
| Fácil | 7 | 4 | 1 |
| Normal | 4 | 5 | 3 |
| Difícil | 2 | 4 | 6 |

Si una región no tiene suficientes países de un nivel, el servidor completa el
pool con el nivel contiguo dentro de la misma región. Nunca cambia de recorrido
silenciosamente.

### Igualdad entre participantes

El servidor congela un plan nuevo al iniciar cada ronda:

- mismos 12 códigos de país;
- mismo orden de las 12 banderas;
- mismos tres distractores para cada bandera;
- misma hora de inicio y de cierre.

La posición A/B/C/D se baraja de manera determinista para cada participante.
Así la dificultad es la misma, pero nadie puede copiar la posición que tocó otra
persona.

### Progreso

1. Todas las personas empiezan en `0/12` después de una cuenta regresiva común
   de tres segundos.
2. Una respuesta correcta confirmada por el servidor avanza a la siguiente
   bandera.
3. Una respuesta incorrecta:
   - no aumenta el progreso;
   - deshabilita esa opción;
   - bloquea el resto de respuestas durante 1,5 segundos;
   - permite reintentar la misma bandera después del bloqueo.
4. No existe pausa. Mandar la app al fondo no detiene el reloj.
5. La pantalla muestra el progreso de los rivales (`7/12`, `10/12`), nunca sus
   respuestas.

### Final y clasificación

El servidor termina la carrera de forma atómica al aceptar la respuesta correcta
que lleva a la primera persona a `12/12`. No hay tiempo adicional después de que
alguien cruza la meta.

La clasificación se ordena así:

1. La persona que llegó a `12/12`.
2. Mayor número de banderas completadas en el instante del cierre.
3. Menor número de respuestas incorrectas.
4. Momento más temprano en que alcanzó su progreso actual.
5. Mismo puesto si todo lo anterior coincide.

Si transcurren 90 segundos sin que nadie llegue a `12/12`, se aplica el mismo
orden desde el punto 2. La primera persona de esa tabla figura como **ganador
por avance**; la interfaz debe distinguirlo de **meta completada**.

Una carrera sin al menos dos participantes conectados al comenzar se cancela y
no produce ganador.

## Experiencia de usuario

### 1. Crear una sala

Desde Inicio, **Carrera de Banderas** abre un formulario corto:

- recorrido;
- dificultad;
- botón **Crear carrera**.

La respuesta entrega un enlace y un código corto. La persona puede compartir el
enlace mediante el diálogo nativo de Android o mostrar/copiar el código.

### Invitado sin la app instalada

La invitación usa una única URL HTTPS verificada, por ejemplo
`https://dominio.example/race/<token>`:

1. Si la app está instalada, Android App Links abre directamente la pantalla de
   entrada a la sala.
2. Si no está instalada, la misma URL abre una página web de invitación, no un
   error. La página muestra quién invita, recorrido, dificultad, plazas, tiempo
   restante, código de seis caracteres y el botón **Instalar desde Google Play**.
3. El enlace a Play incluye un Install Referrer con el token opaco de la sala.
   En el primer inicio, la app recupera ese dato, lo guarda como
   `pendingRaceInvite` y continúa la entrada después del onboarding o login.
4. Si el Install Referrer no está disponible, la persona conserva el código
   visible y puede introducirlo manualmente. Este es el respaldo obligatorio del
   MVP y no depende de atribución ni de un SDK externo.
5. La plaza solo se reserva cuando una cuenta autenticada entra desde la app. Un
   clic web o una instalación incompleta no puede ocupar una de las ocho plazas.
6. Si la sala empezó, se llenó o venció durante la instalación, la app lo explica
   y permite volver a Inicio; nunca incorpora a alguien a mitad de la carrera.

[Android App Links](https://developer.android.com/training/app-links/about)
proporciona la caída automática a la web cuando la app no está instalada. La
[API oficial de Install Referrer](https://developer.android.com/google/play/installreferrer)
permite recuperar el contenido de referencia después de instalar desde Play.

### 2. Sala de espera

La sala muestra:

- recorrido y dificultad;
- participantes conectados, hasta ocho;
- estado **Preparando** o **Listo** de cada uno;
- código y botón para volver a compartir;
- botón **Comenzar** visible para quien hospeda.

El botón se habilita con 2–8 participantes y cuando todos hayan precargado
banderas y marcado **Listo**. Al comenzar se bloquea la lista: nadie puede entrar
tarde. Si la persona anfitriona abandona antes de empezar, el rol pasa a quien
lleve más tiempo en la sala.

Después de una ronda, las personas regresan a este mismo lobby. Pueden quedarse,
salir o entrar antes de la siguiente. El anfitrión puede cambiar recorrido o
dificultad; cualquier cambio quita el estado **Listo** de todos para que nadie
empiece bajo reglas que no vio.

Una sala temporal gratuita vence 30 minutos después de quedar vacía. Mientras
haya alguien conectado puede albergar rondas sucesivas sin crear otro código.

### 3. Cuenta regresiva

El servidor fija `starts_at` unos segundos en el futuro. Cada cliente ajusta la
visualización con la diferencia estimada de reloj y muestra `3 · 2 · 1 · YA`.
Las respuestas permanecen bloqueadas hasta `starts_at`.

### 4. Pantalla de carrera

- En la parte superior se ven hasta ocho avatares o fichas con su avance.
- El centro conserva la bandera grande y legible del juego actual.
- Debajo aparecen cuatro países para responder con un toque.
- Un error muestra una turbulencia breve y la cuenta regresiva de penalización.
- Un acierto mueve el indicador de viaje y carga inmediatamente la siguiente
  bandera.
- No aparecen pista, corazones, monedas ni anuncios.

La animación nunca debe retrasar el envío de la respuesta ni bloquear el avance
confirmado por el servidor.

### 5. Resultado

Al recibir `race_finished`, todas las pantallas dejan de aceptar respuestas y
muestran:

- ganador y motivo del cierre;
- tabla de posiciones;
- progreso, errores y tiempo de cada participante;
- **Revancha**, que vuelve al lobby de la misma sala y prepara un pool nuevo;
- **Compartir resultado** sin revelar las respuestas.

Los resultados pueden consultarse durante siete días. Después se elimina el
detalle de esa ronda; esto es retención operativa y no una pantalla de historial
ampliado para Pro.

### Publicidad en Carrera

No se muestran banners, anuncios recompensados ni intersticiales durante lobby,
countdown, preguntas o resultado. Las ayudas por anuncio tampoco existen en una
carrera.

La frecuencia se calcula **por participante y por instalación**, reutilizando el
contador local `sessionsCompleted` que ya usa la aplicación; no pertenece al
anfitrión, a la sala ni al servidor. Una ronda solo incrementa el contador de la
persona que la completó. Abandonar o desconectarse antes del resultado no cuenta.

Por eso, al terminar la misma ronda, una persona puede tener una impresión
elegible, otra no, y una persona Pro nunca recibe el intersticial. Cuando el
contador de un participante gratuito alcanza la tercera sesión elegible:

1. ve primero el resultado completo;
2. el intersticial se precarga sin bloquear la interfaz;
3. al tocar **Continuar**, se muestra antes de volver al lobby o a Inicio;
4. si no estaba listo, la navegación continúa sin esperar ni reintentar;
5. después del anuncio, la persona queda **No lista** en el lobby y la próxima
   ronda no puede comenzar hasta que todas vuelvan a marcar **Listo**.

Mientras alguien completa este paso, quienes ya están en el lobby ven en su
ficha el estado **Pausa entre rondas** y un aviso como «Esperando a 1 persona».
No se muestra «viendo un anuncio»: el estado neutral explica la demora sin
señalar quién tiene cuenta gratuita o Pro. También se distinguen **Viendo
resultado**, **En el lobby**, **Listo** y **Sin conexión**.

Antes de abrir el intersticial, el cliente publica `ad_break`; al cerrarse,
fallar o no estar disponible publica `in_lobby`. Es presencia efímera, no se
guarda en el historial y no autoriza ni contabiliza una impresión. El servidor
la limpia al reconectar y, como salvaguarda ante el cierre de la app, después de
90 segundos. La carrera siguiente sigue dependiendo únicamente del estado
**Listo**, nunca de esta etiqueta informativa.

La app no deduce ingreso porque `showInterstitial()` haya sido llamado o porque
el anuncio se haya cerrado. Registra la impresión y su valor únicamente desde
`InterstitialAdPluginEvents.AdImpression`, que en la versión actual del plugin
entrega los datos de ingreso cuando ocurre el evento pagado. El listener se
instala antes de mostrar y el evento se persiste inmediatamente.

**Salir de la sala** siempre significa volver a Inicio dentro de la aplicación,
no cerrar Android. No se solicita ni muestra un anuncio cuando la app pasa a
segundo plano, se cierra o el dispositivo se apaga. Si la persona mata la app
antes de que el SDK registre la impresión, no hay ingreso; si la impresión y el
evento pagado ya ocurrieron, puede monetizarse aunque cierre después.

Esta ubicación es un descanso entre rondas o pantallas, no un anuncio de salida
de la aplicación. Debe mantener frequency cap y seguir la
[guía oficial de intersticiales](https://support.google.com/admob/answer/6201350)
y la prohibición expresa de anuncios en
[carga o salida de la app](https://support.google.com/admob/answer/6201362).

### Pasaporte Pro dentro de Carrera

La Carrera no vende velocidad, respuestas, menos penalización, plazas extra ni
otra ventaja competitiva. Tampoco usa estadísticas avanzadas o historial
ampliado como beneficio Pro.

Los beneficios específicos propuestos para este modo son:

- **Sala persistente**: conserva propietario, código y personalización durante
  siete días desde la última actividad para reunir al mismo grupo otro día. Una
  sala gratuita sigue admitiendo revancha ilimitada mientras esté activa, pero
  vence 30 minutos después de quedar vacía.
- **Personalización visible para todo el grupo**: nombre de sala, emblema, tema,
  color de ficha o avión, estela y animación de llegada. Son cosméticos y no
  cambian reglas ni tiempos.

Los formatos Sprint, Maratón u otros tipos de pregunta pueden estudiarse más
adelante como personalización del anfitrión Pro, pero quedan expresamente fuera
del MVP. La ausencia general de anuncios de Pasaporte Pro continúa aplicando,
pero no se presenta como una función nueva ni como el argumento propio de este
modo.

## Conexión, abandono y recuperación

- El servidor envía un heartbeat y considera desconectada una conexión después
  de dos intervalos perdidos.
- La carrera y su reloj continúan si alguien pierde conexión o manda la app al
  fondo.
- Al reconectar, la cuenta recupera su plaza y recibe un snapshot autoritativo:
  estado, progreso, bandera actual, opciones descartadas, penalización y tiempo
  restante.
- El anfitrión deja de tener privilegios especiales una vez iniciada la carrera.
- Si el servidor no recibe la respuesta, esta no cuenta. El cliente conserva un
  `event_id` y puede reenviar el mismo evento; la operación es idempotente.
- Si todas las personas se desconectan, el reloj continúa hasta el límite. La
  sala se cierra sin ganador si ninguna vuelve y no hay progreso suficiente para
  producir una clasificación válida.
- La interfaz avisa cuando la latencia o la pérdida de conexión puede afectar la
  carrera; no inventa progreso local.

### Latencia y respuesta optimista

Esperar un viaje completo al servidor antes de mostrar cada bandera acumularía
desventaja para quien tenga peor red. Por eso, al comenzar, el cliente recibe el
plan completo de su propia carrera y puede representar el siguiente paso de
forma optimista:

- el toque se envía inmediatamente por el WebSocket persistente;
- si el catálogo local lo considera correcto, la interfaz muestra la siguiente
  bandera sin esperar el acuse;
- si lo considera incorrecto, inicia visualmente la penalización y el servidor
  corrige su final mediante `locked_until`;
- el progreso que ven los rivales, la clasificación y el cierre solo cambian
  después de la validación del servidor;
- cualquier rechazo o diferencia de versión obliga a aplicar el snapshot del
  servidor, incluso si implica corregir la pantalla local.

El ganador sigue siendo la primera respuesta final válida recibida por el
servidor. No se confía en el reloj declarado por el cliente. Esta primera versión
es privada y no rankeada; compensar latencia o revisar foto-finish sería requisito
antes de crear una competición pública.

Objetivos operativos iniciales:

- confirmación de respuesta p95 inferior a 300 ms en la región de despliegue;
- difusión de progreso p95 inferior a 400 ms;
- snapshot después de reconectar en menos de tres segundos;
- aviso de conexión inestable cuando la latencia sostenida supere 700 ms.

## Trampas y autoridad

No es posible detectar de forma fiable una segunda cámara usando Lens o una IA.
La defensa principal es de diseño: partida simultánea, sin pausa, duración corta
y coste directo por cada segundo consultando fuera de la app.

Además:

- el servidor genera el pool y valida cada respuesta;
- el cliente nunca decide progreso, penalización, ganador ni tiempo restante;
- cada cuenta ocupa una sola plaza y una cuenta no puede estar en dos carreras
  activas;
- los mensajes llevan secuencia e identificador idempotente;
- el plan no se entrega antes de bloquear participantes y comenzar;
- se aplican límites a creación, entrada y frecuencia de respuestas;
- Play Integrity debe vincular sesión, carrera y versión oficial antes de abrir
  premios o rankings competitivos en el futuro;
- se registran señales anómalas, como respuestas repetidas por debajo del tiempo
  humanamente razonable, sin expulsión automática en la primera versión.

Como no hay premios ni ranking global, hacer trampa solo altera una carrera
privada. Esto reduce el incentivo mientras se reúnen datos reales.

## Arquitectura propuesta

### Responsabilidades

| Componente | Responsabilidad |
| --- | --- |
| Android/React | Sala, precarga, interacción, animación, reloj visual y reconexión. |
| API FastAPI | Autenticación, creación/entrada, generación del plan y consulta de resultados. |
| Motor WebSocket | Presencia, cuenta regresiva, respuestas, penalizaciones, progreso y cierre. |
| PostgreSQL | Salas, participantes, plan versionado, eventos y resultado autoritativo. |
| Gestor en memoria | Conexiones y difusión WebSocket dentro del único proceso del MVP. |
| Redis, más adelante | Pub/sub y presencia compartida al ejecutar varios procesos o instancias. |

PostgreSQL es la fuente definitiva y resuelve con transacciones el progreso y el
ganador. **Redis no es obligatorio para la primera versión.** El MVP se despliega
con un solo proceso ASGI, cuyo gestor en memoria conoce todas las conexiones.
Cada respuesta aceptada se persiste antes de difundirse; después de un reinicio,
los clientes reconstruyen el estado mediante snapshot de PostgreSQL.

Esta elección impide usar varios workers o réplicas en paralelo: cada proceso
vería solo sus propios WebSockets. Antes de escalar horizontalmente se añade un
adaptador Redis para presencia y pub/sub sin cambiar el contrato del juego. Los
locks que deciden ganador siguen en PostgreSQL, no en Redis.

### Estados

Una sala usa:

`waiting ↔ round_active → closed`

Cada ronda usa esta máquina de estados:

`waiting → countdown → running → finished`

También puede pasar de `waiting` a `cancelled`, o de `running` a `expired`. Una
ronda no vuelve atrás ni empieza dos veces; al terminar, la sala regresa a
`waiting` y puede crear la siguiente.

Un participante usa:

`joined → ready → racing → finished`

Los estados `disconnected` y `forfeited` complementan el estado de juego; una
reconexión durante la carrera restaura `racing` sin reiniciar tiempo ni progreso.

## Contrato de red inicial

### REST

| Método y ruta | Uso |
| --- | --- |
| `POST /race-rooms` | Crear sala; devuelve ID, código, enlace y vencimiento. |
| `POST /race-rooms/join` | Entrar mediante código o token del enlace. |
| `GET /race-rooms/{room_id}` | Recuperar snapshot autorizado de sala y ronda actual. |
| `PATCH /race-rooms/{room_id}` | Cambiar ajustes en lobby y reiniciar estados ready. |
| `POST /race-rooms/{room_id}/leave` | Abandonar una sala que espera. |
| `POST /race-rooms/{room_id}/rounds` | El anfitrión congela el plan e inicia otra ronda. |
| `GET /race-rooms/{room_id}/rounds/{round_id}/results` | Consultar un resultado retenido. |

El código visible usa seis caracteres Base32 sin `0/O/1/I`. No es el identificador
interno y se protege con expiración, rate limit y bloqueo temporal de intentos.
El enlace utiliza un token no adivinable y no expone el ID secuencial de la sala.

### WebSocket

`WSS /race-rooms/{room_id}/socket`

La conexión se autentica con la sesión existente y solo admite miembros de la
sala. Mensajes mínimos:

Cliente → servidor:

- `ready`
- `intermission_status { state: reviewing_result | ad_break | in_lobby }`
- `answer { event_id, sequence, country_code, selected_code }`
- `heartbeat`

Servidor → cliente:

- `lobby_state`
- `countdown { starts_at }`
- `race_started { deadline_at, question }`
- `answer_result { event_id, correct, locked_until, next_question }`
- `progress { participants }`
- `player_connection_changed`
- `player_intermission_changed`
- `race_finished { reason, standings }`
- `snapshot`
- `error { code }`

Cada mensaje incluye `protocol_version` y un número de revisión creciente. Un
cliente que detecta un salto solicita snapshot en lugar de inferir eventos.

## Modelo de datos propuesto

### `flag_race_rooms`

- `id` UUID;
- `join_code_hash` y `join_token_hash`;
- `owner_user_id` y `current_host_user_id`;
- `status`;
- `scope` y `difficulty`;
- `is_persistent`, personalización opcional y versión de revisión;
- `created_at`, `last_activity_at` y `expires_at`.

### `flag_race_room_members`

- `room_id` y `user_id`, únicos como pareja;
- posición de asiento y rol actual;
- estado ready y de conexión;
- `joined_at`, `left_at` y última actividad.

### `flag_race_rounds`

- `id` UUID y `room_id`;
- número de ronda dentro de la sala;
- `status`;
- `ruleset_version` y `content_version`;
- `country_codes` y plan de distractores;
- `created_at`, `starts_at`, `deadline_at` y `finished_at`;
- `winner_user_id` opcional;
- `finish_reason` (`completed`, `timeout`, `cancelled`);
- revisión para control de concurrencia.

### `flag_race_participants`

- `round_id` y `user_id`, únicos como pareja;
- posición de asiento;
- progreso confirmado;
- número de errores;
- secuencia esperada;
- momento en que alcanzó el progreso actual;
- estado de conexión y juego;
- `joined_at`, `finished_at` y última actividad.

### `flag_race_answer_events`

- `event_id` único;
- ronda, participante y secuencia;
- país preguntado y país seleccionado;
- resultado;
- momento de recepción del servidor;
- penalización resultante.

El evento que completa `12/12` debe cerrar la carrera dentro de la misma
transacción, bloqueando la fila de la ronda. Dos respuestas finales concurrentes
no pueden producir dos ganadores. Al cerrar, la sala vuelve a lobby sin cambiar
código ni miembros presentes.

Los eventos detallados se eliminan después de 24 horas y los resultados después
de siete días, salvo que métricas agregadas y anónimas exijan menos retención.

## Implementación Android

Para no seguir aumentando `App.tsx`, el modo debe vivir en módulos propios:

```text
src/multiplayer/
  contract.ts
  raceApi.ts
  raceSocket.ts
  raceState.ts
  RaceCreateScreen.tsx
  RaceLobbyScreen.tsx
  RaceGameScreen.tsx
  RaceResultsScreen.tsx
```

Trabajo principal:

- añadir `race` al enrutado interno sin mezclarlo con `completeSession`;
- reutilizar `Flag`, nombres localizados y sesión segura;
- precargar las 12 banderas y marcar `ready` solo cuando estén disponibles;
- implementar una máquina de estados reducer, no estados booleanos dispersos;
- estimar diferencia con el reloj del servidor mediante varias mediciones de
  latencia y usarla solo para la visualización;
- considerar siempre autoritativo el snapshot del servidor;
- integrar App Links verificados y publicar `/.well-known/assetlinks.json` con
  la huella de Play App Signing;
- añadir un puente Capacitor mínimo para consultar Install Referrer una vez tras
  la instalación, persistir la invitación pendiente y borrarla al consumirla o
  vencer;
- reutilizar Capacitor Share para invitación y resultado;
- reutilizar la cadencia global de intersticial y escuchar el evento pagado de
  impresión; cerrar o apagar la app no se registra como impresión;
- mantener sala y socket entre rondas, regresando al lobby con un plan nuevo;
- mantener texto, número y forma además del color para progreso y conexión;
- traducir el flujo completo a español, inglés, portugués, francés y alemán.

## Implementación backend

1. Añadir migraciones, modelos y esquemas de Carrera.
2. Crear el generador determinista de pools y distractores con contrato de
   catálogo compartido.
3. Implementar creación, entrada, salida, snapshots y resultados mediante REST.
4. Implementar un administrador WebSocket autenticado detrás de una interfaz de
   difusión, inicialmente en memoria y con un solo proceso ASGI.
5. Implementar presencia, ready, cuenta regresiva y bloqueo de participantes.
6. Procesar respuestas de forma idempotente, aplicar penalización en tiempo de
   servidor y cerrar la carrera con transacción atómica.
7. Restaurar estado desde PostgreSQL después de reinicios y enviar el snapshot a
   cada conexión recuperada.
8. Añadir tareas de expiración y purga de datos.
9. Aplicar rate limits por cuenta, dispositivo, IP, sala y código de entrada.
10. Exponer métricas sin país preguntado ni respuesta individual como etiqueta.
11. Añadir el adaptador Redis antes de habilitar más de un worker o instancia;
    no forma parte del MVP en un único proceso.

## Observabilidad y métricas de producto

Métricas técnicas:

- conexiones activas y salas concurrentes;
- latencia p50/p95 entre respuesta y confirmación;
- reconexiones y mensajes repetidos;
- cierres por meta, timeout, cancelación o fallo;
- discrepancias de revisión y restauraciones de snapshot;
- errores de PostgreSQL y WebSocket;
- errores de pub/sub cuando se incorpore Redis para escalado.

Métricas de producto:

- salas creadas que llegan a comenzar;
- cantidad media de participantes;
- abandono en lobby y durante carrera;
- duración hasta la meta;
- errores por dificultad;
- uso de revancha;
- porcentaje de carreras de 2, 3–4 y 5–8 personas.

No se usan alias, correos, códigos de país preguntados ni respuestas como
dimensiones de analítica.

## Pruebas requeridas

### Backend

- creación, entrada, sala llena, código inválido y código vencido;
- una cuenta no puede ocupar dos plazas ni dos carreras simultáneas;
- todos reciben el mismo plan y opciones equivalentes;
- respuesta correcta, incorrecta, repetida, adelantada y fuera de secuencia;
- penalización aplicada por tiempo de servidor;
- dos respuestas finales concurrentes producen un solo ganador;
- cierre inmediato bloquea respuestas posteriores;
- revancha conserva sala, código y miembros, pero crea otro plan y otra ronda;
- timeout y desempates;
- reconexión y snapshot;
- reinicio de proceso durante lobby y carrera;
- autorización: una persona externa no puede leer ni escribir la sala;
- carga con al menos 100 salas de ocho participantes simuladas.

### Android

- crear, compartir, entrar por enlace y por código;
- abrir la página web e instalar desde Play en un dispositivo sin la app;
- recuperar la invitación con Install Referrer y completar el flujo tras login;
- entrar manualmente con el código cuando el referrer no exista;
- mostrar sala iniciada, llena o vencida después de una instalación lenta;
- iniciar con 2 y con 8 participantes;
- jugar dos rondas seguidas sin volver a crear ni compartir la sala;
- mostrar un intersticial elegible al continuar después del resultado y no
  contabilizarlo si no llegó el evento de impresión;
- mostrar **Pausa entre rondas** a los demás participantes mientras alguien
  atraviesa el intersticial, y limpiar el estado al cerrar, fallar, reconectar o
  vencer los 90 segundos;
- rotación, segundo plano, pérdida de red y reconexión;
- cierre de app y retorno antes de terminar;
- penalización sin doble toque;
- recepción del ganador mientras se está respondiendo;
- accesibilidad con lector de pantalla y sin depender del color;
- pantallas pequeñas y los cinco idiomas;
- Android 7 y una versión Android actual.

## Criterios de aceptación

- Una cuenta puede crear una sala privada y reunir entre 2 y 8 participantes.
- La misma sala puede ejecutar varias rondas con pools nuevos sin cambiar código
  ni volver a invitar a quienes permanecen dentro.
- Nadie entra después de comenzar y todas las personas parten de una cuenta
  regresiva común.
- El servidor entrega el mismo pool, orden y distractores a todos.
- Cada acierto avanza exactamente una bandera; un error no avanza y bloquea 1,5
  segundos.
- La primera confirmación válida de `12/12` cierra la carrera inmediatamente y
  produce un único ganador.
- Si nadie termina en 90 segundos, el servidor ordena por progreso, errores y
  momento de avance.
- Desconectar o poner la app en segundo plano no pausa el reloj ni duplica una
  plaza.
- Una reconexión recupera el estado autoritativo sin reiniciar progreso.
- Pistas, corazones, monedas, anuncios y Pro no alteran la carrera.
- La publicidad solo puede aparecer en la transición posterior a un resultado
  elegible y nunca durante la carrera ni al cerrar Android.
- El resultado no cambia Viaje, XP, monedas ni rankings de mundo, país, región o
  lugar.
- La carrera completa se puede usar en los cinco idiomas de la app.

## Partición recomendada en issues de implementación

1. **Prototipo de Carrera y prueba de latencia**: validar lobby, progreso de ocho
   personas, penalización y cierre inmediato con un servidor de prueba.
2. **Persistencia y contrato REST**: migraciones, generación de plan, creación,
   entrada, snapshot y resultados.
3. **Motor WebSocket MVP**: presencia, countdown, respuestas, gestor en memoria,
   concurrencia en PostgreSQL y recuperación.
4. **Flujo Android**: crear, lobby, carrera y resultado con estado autoritativo.
5. **Invitación y reconexión**: página web de caída, App Links, Install Referrer,
   código manual, compartir, restaurar sesión y revancha.
6. **Protección y operación**: rate limits, Play Integrity, métricas, purga y
   feature flag.
7. **QA multijugador**: carga, redes móviles, segundo plano, dispositivos reales,
   idiomas y accesibilidad.

Redis se abre como tarea separada únicamente antes de aumentar el despliegue a
más de un worker o instancia.

## Despliegue gradual

1. Mantener el modo detrás de una feature flag de servidor.
2. Probar con cuentas internas y latencia artificial antes de mostrarlo.
3. Abrirlo a testers cerrados solo mediante invitación.
4. Medir durante al menos dos semanas creación, inicio, abandono, latencia y
   revancha.
5. Ajustar pool, penalización o tiempo únicamente mediante una nueva versión de
   reglas, conservando la versión usada por cada resultado.
6. Habilitarlo públicamente sin matchmaking ni ranking global.

Una clasificación pública o premios requieren una decisión posterior sobre
Play Integrity, moderación, reportes, apelaciones y tratamiento de empates por
latencia. No forman parte de esta primera Carrera privada.
