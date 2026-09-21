# Atlas de Banderas — Android

Nueva versión móvil del proyecto **Banderas, países y regiones**. Es una aplicación React + TypeScript empaquetada con Capacitor 8 y pensada para funcionar sin conexión durante las partidas.

## Qué incluye

- Catálogo local de 195 países y sus banderas SVG.
- Ronda rápida, práctica por cinco regiones y desafío diario reproducible.
- Modo Viaje configurable: Fácil (8), Normal (10) y Difícil (12) banderas; los grupos se adaptan a cada dificultad.
- Ruta personalizada: el jugador elige manualmente su país, empieza en su región y decide el orden de los destinos en cinco bifurcaciones.
- 12 etapas curadas de 12 banderas sin repetir países, con una ruta central de 144 y una Expedición de 51; el reloj depende de la dificultad y no de la etapa.
- La bandera de origen entra siempre en la ruta central mediante un intercambio que conserva la división 144/51.
- Expedición global posterior para descubrir las 51 banderas fuera de la ruta central hasta completar las 195.
- Modos Rápido, Diario y Regiones con preguntas bandera → país, país → bandera y capital → bandera.
- Puntuación explicable por bandera: 10 puntos al primer intento, 5 tras un error, 2 con pista y 0 sin resolver; el tiempo solo añade un bonus pequeño.
- Corazones de campaña persistentes, pistas, monedas, XP, racha, dominio por país y progreso persistente.
- Sonido y vibración configurables.
- Anuncios recompensados voluntarios para obtener pistas.
- Intersticial cada tres partidas, nunca durante una pregunta.
- Compra **Pasaporte Pro** gestionada por Google Play + RevenueCat para quitar anuncios.
- Consentimiento publicitario mediante Google UMP y política de privacidad dentro de la app.

La ficha propuesta está en [`PLAY_STORE_LISTING.md`](PLAY_STORE_LISTING.md), la guía del formulario en [`DATA_SAFETY.md`](DATA_SAFETY.md), las tareas de publicación en [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) y la política lista para publicar en [`public/privacy.html`](public/privacy.html).

## Puntuación y competencia

La dificultad elige la composición de banderas según su reconocimiento (familiar, intermedia o experta), pero nunca cambia cuánto vale una bandera individual. Para una clasificación pública, todas las personas deben recibir el mismo reto y dificultad. Las pistas siguen permitiendo terminar una partida, pero reducen el valor de esa bandera; los desempates usan menos pistas, menos errores y menor tiempo oficial.

Los recursos de anuncios, monedas y Pro sirven para aprender y continuar el modo Viaje. No deben conceder corazones adicionales en una partida competitiva. La API de carrera recalcula el puntaje a partir del resultado de cada bandera y el cliente publica sólo con una sesión autenticada. El ranking inicial es social y no concede premios; antes de organizar competencias con premios conviene añadir retos de partida de un solo uso emitidos por el servidor.

## Desarrollo

Requiere Node.js 22 o posterior.

```bash
npm install
npm run dev
npm test
npm run build
npm run screenshots
npm run store-assets
npm run store-assets:check
npm run android:icons
```

## Ejecutar en Android

Instalar Android Studio, JDK 21 y Android SDK 36. Después:

```bash
cp .env.example .env.local
npm run android:sync
npm run android:open
```

La configuración actual usa el ID de aplicación `com.enmanuelotero.atlasflags`, `minSdk 24` y `targetSdk 36`.

## Activar monetización real

1. Crear la app en AdMob y copiar el ID de app a `VITE_ADMOB_APP_ID`.
2. Crear dos unidades: una recompensada y una intersticial. Copiar sus IDs al archivo de entorno.
3. Crear en Google Play el producto administrado de pago único, por ejemplo `atlas_pro_lifetime`.
4. Vincular Google Play con RevenueCat, crear el entitlement `premium`, la oferta predeterminada y un paquete `lifetime`.
5. Copiar la clave pública Android de RevenueCat al archivo de entorno.
6. Probar compras con una pista cerrada y anuncios solo con dispositivos de prueba.

Para desarrollo se usan anuncios oficiales de prueba y la compra aparece como no configurada. `npm run android:bundle` bloquea una release si faltan valores o la firma, hay placeholders, se usa HTTP/localhost o aparecen IDs de prueba.

## Generar el Android App Bundle

1. Copiar `.env.production.example` como `.env.production` y completar valores.
2. Copiar `android/keystore.properties.example` como `android/keystore.properties`.
3. Ejecutar `npm run android:bundle`.

El AAB firmado queda en `android/app/build/outputs/bundle/release/`.

`npm run screenshots` inicia Vite cuando hace falta y genera seis capturas 1080×1920 en `play-assets/screenshots/`. `npm run store-assets` crea el icono 512×512 y el gráfico 1024×500. Ambos requieren Google Chrome en `/usr/bin/google-chrome`, o indicar otra ruta con `CHROME_PATH`; si Vite se ejecuta en otra URL, usar `SCREENSHOT_BASE_URL`.

## Checklist previo a Play Store

- Definir nombre final, precio y países de distribución; revisar la ficha y las seis capturas ya generadas.
- Publicar la política de privacidad en una URL HTTPS y enlazarla en Play Console.
- Publicar `delete-account.html` y registrar su URL de eliminación de cuenta en Play Console.
- Confirmar que la audiencia sea 13+. Si se incluyen menores, revisar Families Policy y la configuración de anuncios antes de enviar.
- Completar Seguridad de los datos siguiendo `DATA_SAFETY.md` y confirmar las respuestas con los SDK configurados en producción.
- Crear un keystore fuera del repositorio y configurar la firma de release.
- Generar un Android App Bundle firmado desde Android Studio.
- Probar compra, restauración, consentimiento, modo avión, rotación, botón atrás y pantallas pequeñas.
- Subir primero a Internal testing y revisar el reporte pre-lanzamiento.

## Decisiones de producto

La versión anterior mezclaba páginas independientes, autenticación obligatoria para parte del progreso, un backend todavía en evolución y una API de países ya deprecada. Esta versión separa el juego base de los servicios online: el aprendizaje y el progreso son inmediatos y locales; el ranking y la cuenta son opcionales y una caída de la API no impide jugar.

La monetización evita vender ventaja competitiva. Los anuncios recompensados son opcionales y los intersticiales aparecen solo en una transición natural. Pasaporte Pro ofrece comodidad y apoyo al desarrollo, no respuestas ni puntuación extra.

## Marca

El icono de Play Store y Android parte del logo web (`assets/images/logo-app-banderas-1260x1260-fondo-gris.png`): globo de continentes de colores con ¿ y ?, sobre fondo verde oscuro saturado y soporte gris. La fuente es `mobile/assets/icon-only.png`; `npm run android:icons` y `npm run store-assets` regeneran mipmaps y `play-assets/icon-512.png`.
## Conexión de rankings

El modo Viaje puede jugarse sin cuenta y conserva el progreso en el dispositivo.
Para publicar etapas, el usuario crea una cuenta con alias, correo y contraseña;
el nombre real y la foto no son requeridos. Las etapas publicadas se recalculan
en el servidor y se consultan por dificultad, país o región.

Para Android de producción, define `VITE_API_URL` con una URL HTTPS pública
antes de ejecutar `npm run android:sync`. El valor por defecto
`http://127.0.0.1:8000` sirve únicamente para desarrollo web local.
