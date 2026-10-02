# Carrera de Banderas: staging

Este flujo prueba Carrera sin tocar producción. El APK usa
`com.enmanuelotero.atlasflags.staging`, firma de depuración y unidades de prueba
de AdMob, por lo que puede convivir con la app instalada desde Google Play.

## 1. API y base de datos separadas

Crear en el proveedor una API y PostgreSQL exclusivos de staging desde la rama
`codex/carrera-multijugador-mvp` del repositorio backend. No reutilizar la base
de producción.

Partir de `.env.staging.example` del backend y reemplazar todos los placeholders.
Los valores que deben coincidir con el APK son:

```dotenv
ENV=production
RACE_MODE_ENABLED=true
RACE_INVITE_BASE_URL=https://API_STAGING
ANDROID_APP_LINK_PACKAGE_NAME=com.enmanuelotero.atlasflags.staging
ANDROID_APP_LINK_SHA256_CERT_FINGERPRINT=HUELLA_SHA256_DEL_APK_STAGING
```

Mantener una sola instancia y un solo worker (`WEB_CONCURRENCY=1`). Redis no es
necesario en esta configuración. El proxy debe aceptar upgrade de WebSocket y no
aplicar un timeout menor a 120 segundos.

El servicio gratuito de Render no admite `Pre-Deploy Command`. Usar como
`Docker Command` el script idempotente que aplica las migraciones antes de
arrancar:

```bash
/app/scripts/start_render_staging.sh
```

Después del despliegue deben responder por HTTPS `/health/live`, `/health/ready`
y `/.well-known/assetlinks.json`.

## 2. Huella y Android App Links

Desde `mobile/android`, consultar la firma de la variante staging:

```bash
./gradlew signingReport -PatlasEnvironment=staging
```

Copiar el valor SHA-256 de `staging` a
`ANDROID_APP_LINK_SHA256_CERT_FINGERPRINT` en la API y volver a desplegarla.
La huella cambia si otra máquina usa un debug keystore distinto.

## 3. APK de staging

Desde `mobile`:

```bash
cp .env.staging.example .env.staging
```

Editar únicamente `.env.staging` y establecer la URL HTTPS real de la API. El
archivo está ignorado por Git. Después:

```bash
npm ci
npm run android:staging
```

El APK queda en
`android/app/build/outputs/apk/staging/app-staging.apk`. Instalarlo en dos
dispositivos o emuladores:

```bash
adb install -r android/app/build/outputs/apk/staging/app-staging.apk
```

Verificar la asociación en Android 12 o posterior:

```bash
adb shell pm verify-app-links --re-verify com.enmanuelotero.atlasflags.staging
adb shell pm get-app-links com.enmanuelotero.atlasflags.staging
```

El host debe aparecer como `verified`. En Android 7–11 se prueba abriendo una
invitación desde Chrome y comprobando que Android ofrece la app.

## 4. Cuentas y smoke test automático

Crear dos cuentas verificadas exclusivas de staging. El backend incluye
`scripts/provision_staging_players.py`, que las crea durante el arranque cuando
el servicio tiene configuradas `STAGING_PLAYER_ONE_PASSWORD` y
`STAGING_PLAYER_TWO_PASSWORD`. No usar cuentas personales ni guardar las
contraseñas en el repositorio o en el historial de shell.

En una terminal con variables cargadas desde un gestor de secretos:

```bash
export STAGING_API_URL=https://API_STAGING
export STAGING_PLAYER_ONE_USERNAME=...
export STAGING_PLAYER_ONE_PASSWORD=...
export STAGING_PLAYER_TWO_USERNAME=...
export STAGING_PLAYER_TWO_PASSWORD=...
export STAGING_ANDROID_PACKAGE=com.enmanuelotero.atlasflags.staging
python scripts/smoke_race_staging.py
```

El script pertenece al repositorio backend. Comprueba salud, App Links, ambos
login, creación/entrada, los dos WebSockets, ready, inicio, 12 respuestas y un
único ganador. Al final intenta retirar a ambos jugadores de la sala.

## 5. Prueba manual en dos dispositivos

- Crear una sala, compartir el enlace y entrar desde el segundo dispositivo.
- Probar también el código manual de seis caracteres.
- Confirmar que nadie puede iniciar hasta que ambos estén conectados y listos.
- Fallar una respuesta y comprobar el bloqueo de 1,5 segundos.
- Completar una carrera y verificar que termina inmediatamente para ambos.
- Volver al lobby e iniciar una segunda ronda sin crear otra sala.
- Cortar y restaurar la red; comprobar el snapshot autoritativo.
- Reiniciar la API durante una ronda; comprobar recuperación o timeout.
- En la tercera sesión elegible, comprobar el intersticial de prueba y que el
  otro dispositivo muestra **Pausa entre rondas**.
- Cerrar la app durante esa pausa y confirmar que el estado se limpia.
- Abrir una invitación sin la app instalada: debe mostrarse la página web y el
  código. Install Referrer requiere instalar desde una pista de Google Play; no
  puede validarse mediante `adb install`.

## 6. Criterio de salida y rollback

No promover mientras fallen el smoke test, App Links o una segunda ronda. Ante
un problema, establecer `RACE_MODE_ENABLED=false` en la API y
`VITE_RACE_MODE_ENABLED=false` en el siguiente APK. La migración solo añade
tablas, por lo que desactivar la función no exige revertir el esquema.

Registrar para cada prueba: modelos/Android usados, latencia aproximada,
reconexiones, resultado de ambas pantallas y cualquier anuncio mostrado.
