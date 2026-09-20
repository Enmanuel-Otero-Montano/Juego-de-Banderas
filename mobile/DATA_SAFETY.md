# Seguridad de los datos — borrador para Google Play

Este documento traduce el comportamiento de Banderas, Países y Regiones y de sus SDK al formulario de **Seguridad de los datos** de Play Console. Es una guía de carga, no reemplaza la confirmación final dentro de Play Console: hay que revisarla contra las versiones y opciones efectivamente publicadas.

Fuentes oficiales usadas:

- [Divulgación de datos del SDK de Google Mobile Ads](https://developers.google.com/admob/android/privacy/play-data-disclosure)
- [Guía de RevenueCat para Seguridad de los datos](https://www.revenuecat.com/docs/platform-resources/google-platform-resources/google-plays-data-safety)
- [Requisito de eliminación de cuentas de Google Play](https://support.google.com/googleplay/android-developer/answer/13327111)

## Respuestas generales

| Pregunta | Respuesta propuesta | Motivo |
| --- | --- | --- |
| ¿La aplicación recoge o comparte datos? | Sí | Cuenta/ranking opcionales, Google Mobile Ads y RevenueCat. |
| ¿Los datos se cifran en tránsito? | Sí | La release exige API y páginas HTTPS; Google Play, AdMob y RevenueCat usan transporte seguro. |
| ¿El usuario puede solicitar la eliminación? | Sí | Eliminación autenticada dentro de Ajustes y página pública de solicitud. |
| ¿La aplicación sigue la política de Familias? | No declararlo salvo que se cambie el público | La audiencia prevista es 13+. Si se incluyen niños, hay que rediseñar consentimiento y anuncios antes de responder. |

## Datos y finalidad propuestos

| Tipo de dato de Play | Recogido | Compartido | Obligatorio | Finalidades a marcar | Procedencia |
| --- | --- | --- | --- | --- | --- |
| Información personal → Dirección de correo | Sí | No | Opcional | Funcionalidad de la app; gestión de cuentas | Cuenta de ranking opcional. |
| Identificadores → ID de usuario | Sí | No | Opcional | Funcionalidad de la app; gestión de cuentas; prevención de fraude/seguridad | ID de la cuenta y alias de ranking. |
| Actividad en la app → Interacciones con la app | Sí | Sí | Para la versión gratuita con anuncios | Publicidad/marketing; analíticas; prevención de fraude/seguridad; funcionalidad | Google Mobile Ads recoge interacciones. El backend también procesa resultados de Viaje, sin compartirlos. |
| Actividad en la app → Otro contenido generado por el usuario u otras acciones | Sí | No | Opcional | Funcionalidad de la app; prevención de fraude/seguridad | Dificultad, etapa, aciertos, tiempo, errores y pistas del ranking. Elegir la categoría equivalente que muestre la versión vigente del formulario. |
| Ubicación → Ubicación aproximada | Sí | Sí | Para la versión gratuita con anuncios | Publicidad/marketing; analíticas; prevención de fraude/seguridad | AdMob puede derivarla de la dirección IP. La app no solicita permiso de ubicación. |
| Rendimiento de la app → Diagnósticos | Sí | Sí | Para la versión gratuita con anuncios | Analíticas; prevención de fraude/seguridad | Google Mobile Ads. |
| Identificadores → IDs de dispositivo u otros IDs | Sí | Sí | Para la versión gratuita con anuncios | Publicidad/marketing; analíticas; prevención de fraude/seguridad | Google Mobile Ads. RevenueCat también puede usar un identificador anónimo de instalación/cliente. |
| Información financiera → Historial de compras | Sí | No* | Para usar Pasaporte Pro | Funcionalidad de la app; analíticas | Google Play y RevenueCat informan el producto y estado de compra. La app no recibe datos de tarjeta. |

`*` RevenueCat actúa como proveedor de servicios para procesar la compra. Según la definición de Google Play, una transferencia a un proveedor de servicios en nombre del desarrollador no suele declararse como “compartida”. Confirmar que el contrato y la configuración finales mantengan ese rol.

## Conservación y eliminación

- El progreso de juego sin cuenta queda en el dispositivo y se elimina al borrar los datos de la app o desinstalarla.
- `DELETE /users/me` elimina inmediatamente la cuenta, el perfil de ranking y los resultados de Viaje relacionados.
- Los intentos diarios pueden conservarse como métricas anónimas después de desvincular el identificador de usuario.
- Google Play, AdMob y RevenueCat conservan datos conforme a sus obligaciones y políticas. La eliminación de la cuenta de ranking no cancela ni borra el registro legal de una compra ya procesada por Google Play.
- Publicar `public/privacy.html` y `public/delete-account.html` en URLs HTTPS accesibles sin iniciar sesión, y registrar ambas en Play Console.

## Verificación justo antes del envío

1. Ejecutar `npm ls @capacitor-community/admob @revenuecat/purchases-capacitor` y comparar las versiones con la documentación vigente de cada proveedor.
2. Confirmar en AdMob la configuración de anuncios personalizados/no personalizados, UMP, regiones y consentimiento.
3. Confirmar si se activó cualquier integración adicional de RevenueCat; una integración nueva puede añadir datos o finalidades.
4. Recorrer el formulario de Play Console y adaptar el nombre de la categoría de resultados de juego a las opciones que muestre la consola.
5. Comprobar que la política pública dice exactamente lo mismo que el formulario.
