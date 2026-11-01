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
- [x] Registrar el nombre de paquete antes del **30 de septiembre de 2026**, fecha límite de la verificación de desarrolladores de Android.
- [x] Confirmar que el identificador definitivo sea `com.enmanuelotero.atlasflags`. No puede cambiarse después de publicar la app.
- [ ] Registrar el paquete y preparar la ficha “Banderas, Países y Regiones”, categoría Educación, audiencia 13+, “contiene anuncios” y “compras dentro de la app”.
- [ ] Definir precio, países de distribución, correo/teléfono/sitio de contacto y confirmar que `soporte@ofiul.com` exista y sea atendido.

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

- [x] Copiar `android/keystore.properties.example` a `android/keystore.properties` y completar sus cuatro valores.
- [x] Activar Play App Signing al crear la primera release.

### Servicios de producción

- [x] Desplegar la API en una URL HTTPS, con PostgreSQL, secreto aleatorio, SMTP real y los orígenes CORS mínimos. Ejecutar `alembic upgrade head` antes de iniciar la API.
- [x] Publicar la privacidad y eliminación de cuenta en `https://ofiul.com/games/banderas-paises-y-regiones/`, con HTTPS válido y acceso sin login.
- [x] Registrar en Play Console `https://ofiul.com/games/banderas-paises-y-regiones/privacy/` y `https://ofiul.com/games/banderas-paises-y-regiones/delete-account/`.
- [ ] AdMob: unidades rewarded/interstitial activas y mensajes UMP publicados (RGPD y normativas estatales de EE. UU.). Pendiente vincular la ficha de Google Play y obtener la revisión de la app cuando esté publicada en producción.
- [x] Crear en Play Console el producto no consumible `pro_passport_lifetime`.
- [x] Vincular Google Play con RevenueCat; crear entitlement `premium`, offering predeterminada y paquete `lifetime` asociado al producto.
- [x] Verificar una compra sandbox desde Google Play: RevenueCat recibe `pro_passport_lifetime`, activa `premium` con duración ilimitada y la app refleja el acceso Pro después de reiniciarla.
- [x] Copiar `.env.production.example` a `.env.production` y completar API, URLs públicas, IDs reales de AdMob, clave pública Android de RevenueCat, `ANDROID_VERSION_CODE` y `ANDROID_VERSION_NAME`.

### Formularios, pruebas y envío

- [ ] Revisar la puntuación con `docs/REVISAR_PUNTUACION.md` (qué entra al ranking, wizard de derrota y consistencia del puntaje publicado).
- [x] Completar Seguridad de los datos usando `DATA_SAFETY.md`, declaraciones de anuncios/compras, acceso a la app, clasificación de contenido y público objetivo.
- [x] Revisar y subir la ficha de `PLAY_STORE_LISTING.md`, icono, gráfico de funciones y las capturas de `play-assets/screenshots/`.
- [x] Generar el bundle firmado con `npm run android:bundle` y conservar el `.aab` y el mapping de R8.
- [ ] Subir primero a prueba interna; instalar desde Google Play y probar alta/verificación/login/eliminación, ranking, compra/restauración, anuncios/consentimiento, modo avión, botón Atrás, rotación y al menos un equipo Android 7 y uno actual.
- [ ] Corregir todo hallazgo del reporte previo al lanzamiento y recién después promover a producción.
- [x] Completar la prueba cerrada exigida por Play Console con al menos 12 testers durante 14 días.
- [x] Solicitar acceso a producción y responder el cuestionario sobre la prueba cerrada (enviada a revisión el 12 de octubre de 2026).

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
