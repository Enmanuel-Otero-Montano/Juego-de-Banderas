# Checklist de publicación — Banderas, Países y Regiones

## Ya preparado en el repositorio

- Proyecto Android Capacitor con `applicationId` `com.enmanuelotero.atlasflags`, `minSdk 24` y `targetSdk 36`.
- Build de producción con minificación, reducción de recursos, firma externa y bloqueo de IDs/URLs de prueba.
- Pruebas web/móvil, validación de release y sincronización Android automatizadas.
- Política de privacidad, página de eliminación de cuenta y eliminación autenticada dentro de la app.
- Ficha propuesta, seis capturas 1080×1920, icono 512×512 y gráfico de funciones 1024×500 en `play-assets/`.
- Guía del formulario de Seguridad de los datos en `DATA_SAFETY.md`.

## Acciones que requieren al titular

### Identidad y Play Console

- [ ] Crear o verificar la cuenta de Google Play Console con los datos legales del titular y completar cualquier verificación de identidad/dispositivo que solicite Google.
- [ ] Registrar el nombre de paquete antes del **30 de septiembre de 2026**, fecha límite de la verificación de desarrolladores de Android.
- [ ] Confirmar que el identificador definitivo sea `com.enmanuelotero.atlasflags`. No puede cambiarse después de publicar la app.
- [ ] Registrar el paquete y preparar la ficha “Banderas, Países y Regiones”, categoría Educación, audiencia 13+, “contiene anuncios” y “compras dentro de la app”.
- [ ] Definir precio, países de distribución, correo/teléfono/sitio de contacto y confirmar que `gamoying@gmail.com` exista y sea atendido.

### Licencias y firma

- [ ] Leer y aceptar personalmente las licencias del Android SDK. En el entorno preparado:

  ```bash
  export JAVA_HOME=/home/enmanuel/Documents/Codex/2026-09-15/elimin-un-x20-2/work/android-toolchain/jdk-21.0.12.1+1
  export ANDROID_HOME=/home/enmanuel/Documents/Codex/2026-09-15/elimin-un-x20-2/work/android-toolchain/android-sdk
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platforms;android-36" "build-tools;36.0.0" "platform-tools"
  ```

- [ ] Crear el keystore de subida fuera del repositorio, guardar contraseñas en un gestor seguro y conservar una copia de recuperación.

  ```bash
  keytool -genkeypair -v -keystore /ruta/segura/atlas-flags-upload.jks -alias atlas-flags-upload -keyalg RSA -keysize 4096 -validity 10000
  ```

- [ ] Copiar `android/keystore.properties.example` a `android/keystore.properties` y completar sus cuatro valores.
- [ ] Activar Play App Signing al crear la primera release.

### Servicios de producción

- [ ] Desplegar la API en una URL HTTPS, con PostgreSQL, secreto aleatorio, SMTP real y los orígenes CORS mínimos. Ejecutar `alembic upgrade head` antes de iniciar la API.
- [ ] Publicar `public/privacy.html` y `public/delete-account.html` en URLs HTTPS públicas y sin login.
- [ ] Crear la app y las unidades rewarded/interstitial en AdMob. Configurar UMP/mensajes de privacidad y dispositivos de prueba.
- [ ] Crear en Play Console el producto no consumible `atlas_pro_lifetime` (o elegir otro ID definitivo).
- [ ] Vincular Google Play con RevenueCat; crear entitlement `premium`, offering predeterminada y paquete `lifetime` asociado al producto.
- [ ] Copiar `.env.production.example` a `.env.production` y completar API, URLs públicas, IDs reales de AdMob, clave pública Android de RevenueCat, `ANDROID_VERSION_CODE` y `ANDROID_VERSION_NAME`.

### Formularios, pruebas y envío

- [ ] Revisar la puntuación con `docs/REVISAR_PUNTUACION.md` (qué entra al ranking, wizard de derrota y consistencia del puntaje publicado).
- [ ] Completar Seguridad de los datos usando `DATA_SAFETY.md`, declaraciones de anuncios/compras, acceso a la app, clasificación de contenido y público objetivo.
- [ ] Revisar y subir la ficha de `PLAY_STORE_LISTING.md`, icono, gráfico de funciones y las capturas de `play-assets/screenshots/`.
- [ ] Generar el bundle firmado con `npm run android:bundle` y conservar el `.aab` y el mapping de R8.
- [ ] Subir primero a prueba interna; instalar desde Google Play y probar alta/verificación/login/eliminación, ranking, compra/restauración, anuncios/consentimiento, modo avión, botón Atrás, rotación y al menos un equipo Android 7 y uno actual.
- [ ] Corregir todo hallazgo del reporte previo al lanzamiento y recién después promover a producción.
- [ ] Si la cuenta de desarrollador personal es nueva, completar la prueba cerrada y los requisitos de acceso a producción que Play Console indique.

## Comandos finales

```bash
cd /home/enmanuel/Proyectos/Juego-de-Banderas/mobile
npm ci
npm run check
npm run store-assets:check
npm run release:check
npm run android:bundle
```

Cada publicación posterior debe aumentar `ANDROID_VERSION_CODE`. `ANDROID_VERSION_NAME` es la versión visible para las personas.
