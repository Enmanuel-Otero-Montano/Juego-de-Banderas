# Ficha ASO para Google Play

Esta ficha usa términos que una persona sí buscaría (banderas, países, capitales y geografía), pero los integra en frases naturales. Google Play no tiene un campo de palabras clave: la relevancia también depende de una ficha fiel, de la calidad técnica, de las reseñas y de la satisfacción de quienes juegan.

## Nombre

Banderas, Países y Regiones

## Descripción breve

Aprende banderas, países y capitales jugando. Explora los 195 países.

## Descripción completa

¿Cuántas banderas del mundo puedes reconocer?

Banderas, Países y Regiones es un juego de geografía para aprender las banderas, los países y las capitales del mundo mientras juegas. Identifica cada país, elige su bandera y completa tu pasaporte de viaje, a tu ritmo.

• Aprende las 195 banderas del mundo, países y capitales.
• Desafío diario con una combinación igual para todos.
• Modo Viaje: empieza en tu región, elige destinos y supera 12 etapas.
• Práctica por América, Europa, Asia, África y Oceanía.
• Rondas rápidas para jugar en pocos minutos.
• Fácil, Normal y Difícil para adaptar el desafío.
• Progreso partida a partida, precisión, rachas, XP y colección de banderas.
• Pistas y explicaciones para convertir cada error en aprendizaje.
• Partidas disponibles sin conexión.

No necesitas registrarte para jugar. Si quieres publicar tus resultados del modo Viaje, puedes crear una cuenta opcional con un alias público.

La versión gratuita contiene anuncios. Pasaporte Pro elimina los anuncios e incluye ventajas de comodidad sin aumentar la puntuación ni dar ventajas competitivas.

## Localización en inglés (Estados Unidos)

### Nombre

Flags, Countries & Regions

### Descripción breve

Learn flags, countries and capitals through geography challenges.

### Descripción completa

How many flags of the world can you recognize?

Flags, Countries & Regions is a geography game for learning world flags, countries and capitals while you play. Match each country with its flag, build your travel passport and progress at your own pace.

• Learn all 195 country flags, countries and capitals.
• A daily challenge with the same combination for everyone.
• Journey mode: start in your region, choose destinations and clear 12 stages.
• Practice by the Americas, Europe, Asia, Africa or Oceania.
• Quick rounds for a game in a few minutes.
• Easy, Normal and Hard difficulty levels.
• Game-by-game progress, accuracy, streaks, XP and a flag collection.
• Hints and explanations that turn every mistake into learning.
• Play games offline.

You do not need to register to play. Create an optional account only if you want to publish Journey results with a public alias.

The free version contains ads. Passport Pro removes ads and adds convenience features without increasing scores or giving competitive advantages.

## Localización en portugués (Brasil)

### Nome

Bandeiras, Países e Regiões

### Descrição curta

Aprenda bandeiras, países e capitais em desafios de geografia.

### Descrição completa

Quantas bandeiras do mundo você consegue reconhecer?

Bandeiras, Países e Regiões é um jogo de geografia para aprender bandeiras, países e capitais enquanto você joga. Relacione cada país à sua bandeira, complete seu passaporte de viagem e avance no seu ritmo.

• Aprenda as 195 bandeiras do mundo, países e capitais.
• Desafio diário com a mesma combinação para todas as pessoas.
• Modo Viagem: comece na sua região, escolha destinos e conclua 12 etapas.
• Pratique pelas Américas, Europa, Ásia, África e Oceania.
• Rodadas rápidas para jogar em poucos minutos.
• Dificuldades Fácil, Normal e Difícil.
• Evolução partida a partida, precisão, sequências, XP e coleção de bandeiras.
• Dicas e explicações para transformar cada erro em aprendizado.
• Partidas disponíveis offline.

Não é preciso criar uma conta para jogar. Crie uma conta opcional somente se quiser publicar resultados do Modo Viagem com um apelido público.

A versão gratuita contém anúncios. O Passaporte Pro remove anúncios e oferece conveniências sem aumentar pontuações ou dar vantagens competitivas.

## Estrategia de publicación ASO

1. Usar español como idioma predeterminado y añadir las localizaciones en inglés y portugués de esta ficha.
2. Subir las capturas en este orden: Inicio, Desafío diario, Modo Viaje, Regiones, Progreso y Pasaporte Pro. Las tres primeras explican el valor del juego antes de hablar de monetización.
3. Usar el icono de `play-assets/` y el gráfico/capturas que correspondan al idioma de cada ficha. El gráfico debe coincidir con el nombre público y no prometer funciones no disponibles.
4. Elegir categoría **Educación** y solo etiquetas disponibles que describan la versión publicada: Geografía, Trivia y Juegos educativos.
5. No repetir palabras clave ni pedir reseñas desde la ficha. Tras el lanzamiento, medir impresiones, conversión de ficha a instalación, retención y reseñas desde Play Console antes de hacer experimentos.

## Recursos localizados

| Ficha de Play | Nombre visible | Gráfico y capturas |
| --- | --- | --- |
| Español | Banderas, Países y Regiones | `play-assets/` |
| Inglés (EE. UU.) | Flags, Countries & Regions | `play-assets/localized/en-US/` |
| Portugués (Brasil) | Bandeiras, Países e Regiões | `play-assets/localized/pt-BR/` |

Para regenerarlos tras cambiar la interfaz:

```bash
npm run store-assets
npm run screenshots
npm run store-assets:en
npm run screenshots:en
npm run store-assets:pt
npm run screenshots:pt
```

## Categoría y audiencia propuestas

- Categoría: Educación.
- Etiquetas sugeridas: Geografía, Trivia y Juegos educativos (elegir sólo las que ofrezca Play Console y describan la versión final).
- Audiencia: 13 años o más.
- Contiene anuncios: Sí.
- Compras dentro de la app: Sí, producto no consumible de pago único.

## Material gráfico preparado

Las seis capturas verticales 1080×1920 están en `play-assets/screenshots/`:

1. Inicio.
2. Pregunta del desafío diario.
3. Modo Viaje con etapas.
4. Práctica por regiones.
5. Pasaporte y progreso.
6. Pasaporte Pro.

El icono de alta resolución y el gráfico de funciones están en `play-assets/icon-512.png` y `play-assets/feature-graphic-1024x500.png`.

La política incluida en `public/privacy.html` debe publicarse en una URL HTTPS antes de completar la ficha.
La página `public/delete-account.html` debe publicarse y registrarse como URL de eliminación de cuenta.
