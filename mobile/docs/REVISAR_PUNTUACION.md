# Revisar la puntuación

Recordatorio previo al lanzamiento: confirmar qué puntaje se muestra, qué se publica
en la tabla y si el wizard comunica bien una derrota.

## Qué entra hoy en la clasificación

Solo el **modo Viaje**, etapas **1 a 12**.

Condiciones:

- Sesión iniciada (cuenta de clasificación).
- Al menos **70 %** de aciertos en la etapa.
- El servidor **recalcula** el puntaje; no usa el número del cliente.
- Se guarda la **mejor marca** de cada etapa.
- El total de la tabla es la **suma** de esas mejores marcas.
- Fácil, Normal y Difícil tienen tablas **separadas**.

## Qué no entra

- Desafío diario
- Ronda rápida
- Por regiones
- Expedición global (etapa 13)

Esas partidas pueden dar XP y monedas locales. No publican ranking.

## Cómo se calcula (Viaje)

Por bandera resuelta:

| Recorrido | Puntos |
| --- | --- |
| Primer intento, sin pista | 10 |
| Hubo error, sin pista | 5 |
| Con pista | 2 |
| Sin resolver | 0 |

Extras:

- Tiempo: como máximo **+10** (1 punto cada 10 s restantes).
- Ruta limpia: **+5** si no hubo pistas ni errores.

La dificultad cambia cuántas y cuáles banderas salen, no el valor de cada una.

## Decisiones de UI ya tomadas

- El wizard muestra **pts y desglose** solo en modo Viaje.
- En diario, regiones y ronda rápida muestra **% y aciertos**, no puntos de ranking.
- Cómo se puntúa: modal desde la clasificación, el mapa de Viaje y el desglose del wizard.
- Si se pierde: texto **Intento no superado** y emblema de **brújula verde**.
- Si se supera: **Ruta completada** y **copa dorada**.

## Checklist de revisión

- [ ] Jugar una etapa de Viaje logueado, superarla (≥ 70 %) y ver si el puntaje del wizard coincide con lo publicado.
- [ ] Perder una etapa de Viaje (vidas en 0 o menos del 70 %) y confirmar que no entra a la tabla.
- [ ] Completar diario, regiones y ronda rápida: el wizard no debe mostrar pts de ranking.
- [ ] Probar Fácil / Normal / Difícil: cada uno suma en su propia tabla.
- [ ] Confirmar que reintentar una etapa ya superada solo actualiza la marca si el nuevo puntaje es mejor.
- [ ] Expedición global: decidir si debe mostrar pts (hoy es Viaje, pero no rankea).
- [ ] Revisar el desglose del wizard en Viaje (banderas / tiempo / ruta limpia / pistas y errores) en un teléfono real.

## Notas

La tabla vieja `overall_score_table` es legado del modo regiones de la web. La app
Android consulta `/career/leaderboard`.
