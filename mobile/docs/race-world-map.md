# Carrera multijugador sobre mapa mundial

## Análisis de la pantalla existente

`RaceGameScreen.tsx` contiene cabecera, temporizador, progreso, pregunta/bandera y respuestas. La fila anterior distribuía las iniciales por índice y dibujaba una barra individual con denominador fijo 12. `RaceMode.tsx` recibe mensajes del WebSocket y `raceState.ts` conserva los participantes y sus avances. La pregunta local puede avanzar de manera optimista antes del acuse del servidor. Cada miembro ya tiene `user_id`, `seat`, nombre, avatar y estado de conexión.

## Implementación

- `RaceWorldMap.tsx`: SVG local de siluetas simplificadas, océano azul y continentes verdes; sin imágenes externas del mapa, dependencias ni peticiones adicionales. Conserva la proporción geográfica del dibujo aunque cambie el alto del contenedor.
- Progreso remoto desde el estado existente. Para el jugador local se conserva el último avance confirmado hasta un acuse/snapshot; `expected_sequence` evita interpretar un error de transporte como confirmación. Las correcciones autoritativas pueden retroceder el marcador. No modifica el reducer, el protocolo, las respuestas ni los temporizadores.
- Escala común `progreso / total`, donde el total proviene del plan de la ronda. La posición se calcula sobre el ancho real de los carriles descontando el ancho de la ficha y márgenes de 10 px. `ResizeObserver` vuelve a medir al cambiar el contenedor, incluidas las áreas seguras.
- Carriles iniciales ordenados por asiento y vinculados al identificador del usuario. Una baja deja reservado su carril para una reconexión; reordenar la lista recibida no cambia posiciones verticales. Se reinician al cambiar de ronda.
- Inicial o avatar existente, ocho colores, contador, doble contorno local, indicador de desconexión y marca de llegada. Nombre completo, estado y progreso disponibles para lectores de pantalla. Un avatar que no carga deja visible la inicial.
- El mapa está memoizado para no renderizarse con cada actualización del reloj. Transiciones CSS de `transform` de 220 ms que se redirigen al último destino, sin colas. Movimiento reducido desactiva la transición.

## Distribución y parámetros

El mapa participa del flujo flex de la pantalla. Con 5–8 jugadores recibe el espacio restante después de medir de forma natural la cabecera, pregunta, bandera y respuestas; con 2–4 utiliza una altura compacta dentro de una zona reservada del mismo tamaño que la amplia. El espacio libre queda debajo del mapa, antes del bloque de pregunta. Así pregunta, bandera y respuestas mantienen exactamente la misma posición en ambos tamaños para un mismo viewport. Separación superior: **5 px**. Separación entre la zona reservada y el texto de la pregunta: **18 px**, también sin conexión; con el mapa compacto la separación desde el fondo azul es mayor. Ancho completo de la superficie de juego, conservando el límite de 620 px que ya tenía la aplicación en pantallas grandes.

Hay dos capacidades de altura, independientes de la cantidad exacta de participantes dentro de cada grupo:

- **2–4 jugadores:** 176 px; en pantallas de hasta 700 px de alto, 130 px.
- **5–8 jugadores:** la altura amplia existente, con mínimo de 240 px (ocho carriles de 28 px más 16 px de margen). Cinco, seis y siete jugadores usan la misma altura que ocho en el mismo viewport.

Los carriles reales se distribuyen uniformemente dentro de esa altura. Las bajas y desconexiones no reducen la capacidad reservada durante la ronda. Avatares de 20–34 px según alto real de carril. Los parámetros se concentran en el bloque `.race-world-map` de `styles.css` y en las constantes geométricas del componente.

La pregunta conserva tipografía, bandera y separación interna; deja de centrar verticalmente un bloque flexible para anclarla al borde inferior de la zona reservada al mapa. Las respuestas conservan su diseño. Por debajo de 700 px de altura se elimina solamente la altura mínima vacía del bloque de pregunta. Si el contenido mínimo no cabe, el documento permite desplazamiento vertical, sin recortar ni superponer controles.

## Verificación (9 de octubre de 2026)

- **116 pruebas unitarias**, incluidos los casos existentes de reloj, reducer y pantalla, más posición proporcional, ocho carriles, reconexión, baja, reordenación, correcciones, progreso optimista, error de transporte, avatar fallido y cambio de ancho.
- **22 escenarios de navegador**: posiciones idénticas de pregunta, bandera y respuestas entre ambos tamaños en 360×800, 390×844, 320×568, 360×640, 412×915 y 740×360; comparación de todos los grupos de 2–8 jugadores a 390×844 y de 4/5 jugadores a 320×568; 2 jugadores a 360×800; 8 jugadores a 390×844, 320×568, 360×640, 412×915 y 740×360; empates, meta y desconexión. También ráfagas de avances, movimiento reducido y clics en respuestas/salida.
- **5 escenarios iniciales en el WebView de Capacitor**, emulador Android 16 con Android System WebView 133.0.6943.137, superficie aproximada de 412×867 CSS px: 2 y 8 jugadores, empates, meta y desconexión. Se cargó una fixture con los componentes reales en el WebView depurable, usando participantes sintéticos; no es una prueba de una partida entre dispositivos contra el servidor real.
- Compilación TypeScript/Vite, sincronización Capacitor y `assembleDebug` correctos. Los ajustes posteriores de altura y posición fija de la bandera se verificaron con los 22 escenarios de navegador y se recompiló para Android; no se repitió la ejecución del emulador en ese ajuste.
- En 360×640 no hay desplazamiento con ninguno de los dos tamaños. Para conservar las mismas posiciones, ambos reservan la zona amplia: en 320×568 el documento mide aproximadamente 635 px con ambos tamaños; en horizontal 740×360 también se desplaza. No hay desbordamiento horizontal ni superposición entre mapa, pregunta, bandera y respuestas.

Las capturas y mediciones se generan en `mobile/test-artifacts/race-map/` y `android/` dentro de esa carpeta. Son artefactos locales excluidos de Git.

## Reproducir

Desde `mobile/`:

```sh
npm test
npm run test:race-map
npm run android:debug
```

El script usa Playwright y Chrome ya disponibles; `CHROME_PATH` permite indicar otro ejecutable. Para comprobar un emulador con el APK debug instalado y abierto:

```sh
RACE_ANDROID_SERIAL=emulator-5580 npm run test:race-map
```

El script sirve una fixture local mediante Vite, conecta al WebView de la app por ADB/CDP, captura y verifica geometría, restaura la URL original y elimina sus redirecciones. No añade rutas de demostración al bundle de producción ni accede a cuentas o partidas reales.
