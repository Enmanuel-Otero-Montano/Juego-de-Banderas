# Inicio sincronizado de Carrera de Banderas

## Diagnóstico

Auditoría del 8 de octubre de 2026, realizada sobre los dos checkouts locales:

- Cliente: `Juego-de-Banderas/mobile`, React/TypeScript, Capacitor 8 y WebSocket nativo.
- Backend: `banderas_paises_y_regiones`, FastAPI/ASGI, SQLAlchemy y PostgreSQL. La difusión WebSocket vive en memoria y requiere un único proceso ASGI.
- REST crea, une, configura y comienza salas; WebSocket comunica presencia, preparado, preguntas, progreso y resultados.

El servidor **ya persistía** un UUID de ronda, `starts_at` y `deadline_at`, con bloqueo de la fila de sala al comenzar. El defecto principal estaba en `RaceGameScreen`: comparaba esos instantes con `Date.now()` del teléfono, sin compensación, cada 100 ms. El heartbeat devolvía `server_time`, pero el cliente no lo utilizaba. Un reloj desajustado dos segundos puede explicar el desfase observado; no contamos con registros de aquella prueba para atribuirle exactamente su causa.

Problemas adicionales encontrados:

- No existía la precarga de banderas prometida en la documentación; la primera pregunta se montaba después de acabar la cuenta regresiva.
- El servidor enviaba el comienzo secuencialmente; un envío lento o fallido podía retrasar a otros y evitar que se programara el cierre por tiempo.
- El reducer aceptaba snapshots antiguos y el resultado REST de comenzar podía sobrescribir una ronda ya avanzada.
- Las sesiones de BD mantenidas por WebSocket podían conservar objetos obsoletos entre mensajes; preparado y desconexión no compartían el bloqueo de sala del inicio.
- El cambio de configuración difundía el snapshot personalizado del anfitrión a todos, incluyendo su `current_user_id`.
- Las respuestas no identificaban la ronda y las confirmaciones repetidas no incluían todos los campos actuales de penalización.

La puntuación ya era autoritativa: 12 banderas, 90 segundos, error con bloqueo de 1,5 segundos; gana la primera finalización válida procesada por el servidor. El desempate por timeout usa progreso, errores y momento del último avance. Se conservan esas reglas, sin modificar XP, monedas ni otros modos.

## Protocolo implementado

1. Al entrar, el cliente carga y decodifica las banderas locales del recorrido y calibra el reloj. «Listo» permanece deshabilitado hasta completar ambas tareas.
2. Se conserva el botón del anfitrión para comenzar, por compatibilidad con el lobby actual. El servidor comprueba bajo bloqueo que haya de 2 a 8 miembros, todos conectados y listos. El cliente nuevo envía la revisión del lobby para detectar cambios concurrentes.
3. El servidor crea una sola ronda y fija `starts_at = hora UTC del servidor + 5 segundos` y `deadline_at = starts_at + 90 segundos`, dentro de la misma transacción. Un reintento mientras está activa devuelve esa misma ronda.
4. Programa la tarea de vencimiento antes de enviar mensajes. Difunde las cuentas regresivas en paralelo; limita los envíos lentos sin bloquear a los demás. Cada participante recibe el mismo ID y los mismos instantes, con su estado y orden de opciones personalizado.
5. El cliente monta la primera pregunta y las opciones durante la cuenta regresiva, ocultas y deshabilitadas. Las revela al alcanzar `starts_at` según el reloj calibrado, en el siguiente frame disponible.
6. Inicio, tiempo restante y penalizaciones derivan de instantes absolutos del servidor. No se resta un contador independiente ni se reinicia al recibir un mensaje.
7. Respuestas nuevas incluyen `round_id`. El backend valida ronda, secuencia, pregunta, opción, inicio, deadline, penalización e idempotencia. Nunca acepta una respuesta nueva antes del inicio. Los eventos duplicados devuelven el estado autoritativo sin sumar otra vez.
8. Snapshots antiguos, cuentas regresivas duplicadas, respuestas de otra ronda y resultados REST tardíos no reinician el estado. Una confirmación propia pendiente todavía puede aplicarse después de un evento de progreso más reciente de otro participante.

No se añadieron servicios, dependencias ni migraciones de BD. Los campos adicionales mantienen compatibilidad de transporte con v1. Los clientes antiguos pueden seguir conectándose al backend actualizado, pero **no corrigen su reloj**: la validación de equidad requiere actualizar todos los teléfonos. La app nueva requiere el backend actualizado para completar la calibración. `round_id` y la revisión de inicio se aceptan opcionalmente para compatibilidad con clientes v1 anteriores; la app nueva siempre los envía.

## Estimación temporal

`raceClock.ts` registra cinco sondeos al conectar, separados 250 ms, y después uno cada 10 segundos. Cada sondeo tiene un identificador de un solo uso. Se requieren al menos tres muestras válidas.

Con `t0`/`t3` del reloj monotónico del cliente y `s1`/`s2` de recepción/envío UTC del servidor:

```text
RTT de red = (t3 - t0) - (s2 - s1)
desplazamiento = (s1 + s2 - t0 - t3) / 2
hora estimada del servidor = performance.now() + desplazamiento
```

Se usa la muestra de menor RTT entre las últimas 12 muestras de menos de 60 segundos, descontando el procesamiento del servidor. Se rechazan valores inválidos y mediciones de más de 4 segundos. No se usa `Date.now()` para temporizar la carrera. La propiedad monotónica de `performance.now()` está descrita en [High Resolution Time, W3C](https://www.w3.org/TR/hr-time-3/#monotonic-clock).

La incertidumbre estimada es RTT/2; no supone conocer la latencia exacta en cada dirección. Al suspender la app o perder el socket se invalida la calibración. Al volver se abre una conexión nueva, se recupera el snapshot y se recalibra antes de habilitar respuestas.

## Política ante retrasos y desconexiones

- **Antes de programar:** un miembro desconectado o no listo impide comenzar. Salir del lobby libera la plaza y, si corresponde, cambia el anfitrión. Una reconexión requiere volver a marcar listo.
- **Después de programar, incluso durante la cuenta regresiva:** se conserva la ronda, el conjunto de participantes y sus instantes. Ningún participante puede posponerlos. Una desconexión no cancela ni pausa la partida.
- **Recursos o reloj todavía no disponibles:** la pantalla muestra «Preparando» y bloquea respuestas. Cuando estén disponibles entra con el tiempo restante; no recibe tiempo adicional.
- **App en segundo plano:** se cierra el socket y se invalida la estimación; se recupera al volver. Los dos canales de ciclo de vida, Capacitor y visibilidad del documento, están contemplados.
- **Reconexión después de comenzar:** conserva inicio, deadline, progreso, secuencia y penalización del servidor. Si ya terminó, muestra el resultado.
- **Socket reemplazado:** la limpieza de la conexión anterior no puede marcar desconectada a la conexión nueva.
- **Vencimiento:** el cliente bloquea respuestas al alcanzar el deadline estimado; el servidor aplica siempre su deadline oficial. El resultado final puede llegar después por latencia.

## Verificación automatizada

Cliente:

```bash
cd mobile
npm test
npm run build
npm run catalog:check -- --backend '/ruta/al/backend'
npm run store-assets:check
```

Resultado: **112 pruebas aprobadas en 25 archivos**, compilación de producción correcta, contrato de catálogos y recursos de tienda validados.

Cobertura agregada: ocho relojes independientes, diferencias de reloj de pared, 100/300/500/1000 ms por dirección (hasta 2000 ms RTT), entrega desigual del comienzo, procesamiento del servidor, selección de muestra, invalidación, reconexión, respuestas duplicadas, snapshots fuera de orden, preparado del lobby, primera pregunta montada y oculta, carga tardía y bloqueo al vencer el tiempo. Las latencias se simulan de forma determinista; no son una medición de dispositivos reales.

Backend:

```bash
cd '/ruta/al/backend'
banderas-paises-regiones-venv/bin/python -m pytest
# Incluir las pruebas de bloqueo real con una BD PostgreSQL desechable:
RACE_TEST_DATABASE_URL='postgresql+psycopg2://usuario:clave@127.0.0.1:puerto/base_test' \
  banderas-paises-regiones-venv/bin/python -m pytest
```

La prueba PostgreSQL exige que el nombre de BD contenga `test`, crea un esquema único y lo elimina al terminar; nunca utiliza el `DATABASE_URL` de la aplicación. Se ejecutó con PostgreSQL 16 en un contenedor temporal local. Cubre solicitudes de inicio simultáneas y respuestas finales simultáneas con conexiones independientes y bloqueos reales.

Resultado con las nuevas pruebas PostgreSQL habilitadas: **82 aprobadas y 3 omitidas**. Las tres omitidas corresponden a pruebas preexistentes de concurrencia del ranking, cuyo entorno separado no se configuró. Hay un aviso preexistente de deprecación de Starlette/AnyIO. Los casos de Carrera incluyen 2 y 8 miembros preparados sucesivamente, comienzo común, reintentos, respuestas adelantadas o vencidas, desconexión/reconexión, reemplazo de socket y difusión personalizada.

## Validación con dos teléfonos Android

1. Desplegar primero este backend en staging, con un único worker ASGI y reloj del host sincronizado por NTP. Luego instalar la app actualizada en ambos teléfonos usando el flujo Android de staging existente. No se desplegó ni publicó ninguna versión como parte de esta tarea.
2. Entrar con dos cuentas diferentes. Crear sala en A y unirse desde B. Verificar que «Listo» no se habilite hasta acabar «Preparando». Marcar listo en A, esperar unos segundos, y marcar listo en B. Comenzar desde A.
3. Colocar ambos teléfonos juntos y grabarlos con una tercera cámara a 60 o 120 fps durante al menos diez rondas. Comparar el primer frame visible de pregunta en cada uno; registrar mediana y máximo del desfase. Como objetivo de QA en una red estable y simétrica, buscar menos de 100 ms, sin tratarlo como garantía del protocolo.
4. En una compilación depurable, inspeccionar los WebSockets con `chrome://inspect`. Confirmar que ambos reciben el mismo `round.id`, `starts_at` y `deadline_at`; comprobar los sondeos `probe_id`, `server_received_at` y `server_time`. Cada deadline debe estar exactamente 90 segundos después del inicio.
5. Desactivar la hora automática en un teléfono y adelantar su reloj dos minutos; repetir atrasándolo dos minutos. El instante de inicio y el tiempo restante deben mantenerse alineados. Restaurar la hora automática al terminar.
6. Usar una red de pruebas con emulación de latencia en el router/proxy que transporte el WebSocket completo. Añadir 100, 300, 500 y 1000 ms por dirección a uno de los teléfonos, conservando el otro sin retraso. Repetir las rondas y registrar RTT. No basta con retrasar solo solicitudes HTTP ni con la velocidad de descarga configurada en DevTools. Probar además una red asimétrica para observar la incertidumbre residual.
7. Poner B en segundo plano o activar modo avión durante la cuenta regresiva. A debe comenzar a la hora prevista. Al devolver B al primer plano o recuperar red, B debe recalibrarse y mostrar el tiempo restante, sin volver a tener 90 segundos. Repetir durante una pregunta y durante la penalización.
8. Desconectar B antes de comenzar: el anfitrión no debe poder iniciar mientras B siga en la lista y desconectado. Probar que B salga del lobby y que el anfitrión salga antes de empezar.
9. Responder rápidamente/doble toque, provocar un error y reconectar. Confirmar que no se duplique el avance, no desaparezca una penalización vigente y se conserve la ronda. Repetir una revancha y comprobar que tenga un ID nuevo y un único resultado.
10. Repetir el inicio con ocho cuentas/dispositivos o siete clientes de prueba adicionales. Introducir un participante lento; no debe retrasar los envíos a los demás ni modificar el deadline.

## Limitaciones de equidad restantes

- No se promete simultaneidad absoluta de pantalla: influyen la asimetría de red, planificación del sistema, refresco de pantalla, carga del WebView y frames perdidos. La calibración minimiza el desfase; el servidor decide el tiempo válido.
- Se conserva la regla competitiva actual: el ganador es quien completa primero **en el servidor**. Una conexión con más RTT sigue perjudicando las confirmaciones sucesivas, el envío final y el margen junto al deadline. No se aceptan tiempos declarados por el cliente ni se resta RTT a la puntuación, porque permitiría falsificar tiempos o cambiaría las reglas de desempate.
- El plan completo sigue viajando al cliente, como antes. Una app modificada puede leer las respuestas; esto no implementa un sistema antitrampas nuevo.
- El servidor necesita un reloj UTC estable. Un salto de hora en ese host o una suspensión prolongada del proceso puede afectar la presentación y entrega de resultados.
- La difusión en memoria sigue requiriendo un único worker; escalar a varios requiere un transporte compartido, fuera del alcance de este cambio.
- Las pruebas automatizadas y PostgreSQL se ejecutaron localmente. La validación visual con teléfonos reales queda pendiente; no se generó ni publicó un AAB de Google Play.
