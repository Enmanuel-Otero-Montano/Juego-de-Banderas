# Pendiente: proteger el ranking con Play Integrity

## Objetivo

Evitar que una APK modificada o una llamada fabricada al API publique resultados
en el ranking competitivo. La protección debe aplicarse únicamente a las
partidas que se envían al ranking; el progreso local debe seguir funcionando sin
ella.

## Estado actual

El backend ya controla que el intento pertenece al usuario, que no esté vencido
ni reutilizado y que el puntaje se calcule en el servidor. Sin embargo, aún no
verifica que la solicitud venga de una instalación oficial e íntegra de Android.

Por eso este trabajo es un requisito antes de confiar plenamente en el ranking
global de una publicación en Google Play.

## Requisitos externos

- Una aplicación registrada en Google Play Console con el paquete
  `com.enmanuelotero.atlasflags` y firmada para distribución.
- Un proyecto de Google Cloud vinculado desde **Protegido con Play > Play
  Integrity API** en Play Console.
- Una cuenta de servicio del proyecto de Cloud con permisos para decodificar
  tokens de Play Integrity. Sus credenciales deben vivir solo en el backend,
  nunca en el APK, en archivos `.env` versionados ni en el repositorio.
- Una pista de pruebas de Play Console para validar veredictos de dispositivos
  reales antes de exigirlos en producción.

## Implementación prevista

1. Agregar la dependencia oficial Play Integrity al módulo Android y un puente
   Capacitor mínimo para solicitar tokens estándar.
2. Al iniciar una partida rankeada, preparar el proveedor de tokens en segundo
   plano.
3. Al completar una partida, calcular un `requestHash` SHA-256 de una
   serialización canónica del intento y del envío: usuario, `attempt_id`, etapa,
   versiones de reglas/contenido, respuestas y demás campos que el servidor
   vaya a aceptar.
4. Adjuntar el token y el resultado al endpoint de finalización.
5. En el backend, decodificar el token contra Google, comprobar el
   `requestHash` y exigir veredictos aceptables de integridad de app, dispositivo
   y cuenta según la política definida.
6. Calcular el resultado en el backend y publicar el ranking solo después de
   esas comprobaciones. Rechazar tokens ausentes, vencidos, repetidos o cuyo
   hash no coincida.
7. Registrar de forma no sensible los rechazos y crear métricas/alertas para
   distinguir problemas de dispositivos de intentos de fraude.

## Política inicial recomendada

- El ranking competitivo requiere token válido; no debe existir un modo de
  compatibilidad que acepte resultados sin él.
- Un fallo temporal de Play Integrity no borra el progreso local, pero deja la
  partida como no publicable en el ranking y explica el motivo al jugador.
- El backend conserva sus validaciones actuales de intento, tiempo, propiedad y
  cálculo de puntaje; Play Integrity es una capa adicional, no un reemplazo.
- Probar primero en pista interna y activar el rechazo obligatorio mediante una
  bandera de servidor para poder revertirlo de forma segura.

## Límites conocidos

Play Integrity impide de forma importante que una APK modificada o un cliente
fabricado publique puntajes. No evita por completo la automatización de la APK
oficial ni sustituye las validaciones del juego en el servidor.

## Referencias

- [Configuración de Play Integrity](https://developer.android.com/google/play/integrity/setup?hl=es-419)
- [Solicitudes estándar y verificación del token](https://developer.android.com/google/play/integrity/standard)
- [Veredictos de integridad](https://developer.android.com/google/play/integrity/verdicts)
