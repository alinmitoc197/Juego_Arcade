# Clash de Bandos (prototipo)

Juego de combate 2D para navegador (HTML + CSS + JavaScript con módulos y Canvas). Para jugar no hace falta instalar nada (esbuild solo se usa para generar `jugar.html`).
En esta fase la prioridad es la **interfaz**; los personajes son marcadores provisionales y originales.

## Identidad visual

Ambiente de **bando contra bando**: azul (Vanguardia) a la izquierda, rojo (Arcanos) a la derecha y dorado como acento, con un rayo de choque en el centro.
Cada modo del menú muestra luchadores dentro (provisionales) y, cuando son dos, aparecen enfrentados.
Colores y fuentes: variables de `css/theme.css`. Nombre y bandos del título: `js/data/config.js`.

## Cómo ejecutarlo

**Lo más fácil: abre `jugar.html` con doble clic.** Es un único archivo con todo dentro (código, estilos e imágenes);
no necesita servidor ni instalar nada, y puedes copiarlo solo a cualquier sitio. Abajo a la izquierda del menú se ve la versión (`v0.6`).
Si cambias el código, vuelve a generarlo con `npm install` (una vez) y `npm run build`.

### Para desarrollar (carga el código vivo, sin compilar)

Abre `index.html` **a través de un servidor local** (los módulos JS no funcionan con doble clic):
- **VS Code:** extensión *Live Server* → clic derecho en `index.html` → *Open with Live Server*.
- **Windows:** `start.bat` · **Linux / Mac:** `./start.sh` · **Terminal:** `python serve.py` (servidor sin caché que elige un puerto libre).

Tras editar, recarga con Ctrl+Shift+R. `jugar.html` NO se actualiza solo: regéneralo con `npm run build`.

Las fuentes vienen de Google Fonts (necesita internet; sin conexión usa fuentes de reserva).

## Pantallas implementadas

| Pantalla | Qué hace |
|---|---|
| Menú principal | Tiles inclinados, descripción por modo, selector de idioma, navegación con flechas o ratón |
| Selección de luchador | 3 grupos × 12 luchadores, tooltip, traje alternativo (Tab), aleatorio (R) |
| Presentación VS | Pantalla dividida, estrella VS, barra de carga (Espacio para saltar) |
| Combate | HUD con vida, barra Super, reloj, asaltos, combos, avisos (ASALTO, ¡LUCHA!, ¡K.O.!, ¡PRIMER GOLPE!) |
| Opciones | 3 secciones, ajustes persistentes (localStorage) |
| Ayuda | Cómo pelear, movimientos especiales por luchador, teclas por jugador |

Modos jugables: **Arcade** (contra CPU, escalera de rivales), **Versus** (2 jugadores, mismo teclado), **Entrenamiento** (muñeco, sin tiempo ni K.O.) y **Espectador** (CPU vs CPU).
Cooperativo, Supervivencia y Supervivencia cooperativa aparecen como «PRONTO».

## Controles

| | Jugador 1 | Jugador 2 |
|---|---|---|
| Mover / saltar / agacharse | Flechas | I J K L |
| Puñetazo ligero / medio / fuerte | A / S / D | U / O / P |
| Patada ligera / media / fuerte | Z / X / C | M / , / . |
| Provocar | Enter | Shift derecho |

`Esc` pausa el combate. Mantén **atrás** para cubrirte (y **abajo+atrás** contra golpes bajos).
Cadena de combo: ligero → medio → fuerte. Especiales: ↓↘→ + puñetazo (esfera), →↓↘ + puñetazo (ascendente), ↓↙← + patada (patada en carrera), ↓↘→↓↘→ + puñetazo (súper, gasta 1 barra).

## Estructura

```
index.html
css/        theme · components · screens · fight
js/
  main.js            arranque, escalado 1280x720, bucle
  core/              Input, SceneManager, Scene, Store (ajustes), I18n, Sfx
  data/              config, controls, moves (frame data), roster, i18n/{es,en}
  ui/                dom (h()), focus (navegación por geometría), FighterArt (SVG provisional)
  game/              FightEngine, Fighter, AI, controllers, HUD, Renderer, FighterDraw, StageBg
  scenes/            Menu, Select, VersusIntro, Fight, Options, Help
tests/               pruebas del motor (npm test)
```

Ideas de diseño: el motor de combate (`FightEngine`, `Fighter`, `AI`) **no toca el DOM**, así que se prueba en Node; la UI está en escenas independientes; los datos (movimientos, plantel, textos, controles) están separados del código.

## Imágenes de personajes

Las imágenes del menú van en `assets/characters/` (PNG o WebP con fondo transparente, ~900 px de alto).
En `js/scenes/MenuScene.js`, cada tarjeta de `TILES` acepta `imgs: ['assets/characters/xxx.webp']` y `c`/`cd` (color claro y oscuro del fondo, sacados del contorno del personaje).
Si una tarjeta no tiene `imgs`, usa los muñecos provisionales.

## Cómo ampliarlo

- **Nuevo luchador:** añade el nombre en `js/data/roster.js`. Para arte real, sustituye `FighterArt.js` (retratos) y `FighterDraw.js` (sprites).
- **Reequilibrar un golpe:** edita los números en `js/data/moves.js` (startup / active / recover en frames a 60 fps).
- **Nuevo ajuste:** una línea en `SCHEMA` de `OptionsScene.js` + su texto en `i18n/es.js` y `en.js`.
- **Nuevo idioma:** copia `i18n/es.js`, tradúcelo y regístralo en `core/I18n.js`.
- **Depurar:** Opciones → *Mostrar cajas de golpe* y *Mostrar FPS*.

## Pruebas

`npm test` (Node 18+): comprueba comandos especiales, cadenas de combo, bloqueo, golpes bajos y simula 40 combates IA vs IA sin bloqueos.

## Siguientes fases sugeridas

1. Sprites/arte real y animaciones por frames. 2. Audio real (ahora los efectos se sintetizan). 3. Cooperativo y Supervivencia.
4. Más movimientos por luchador (hoy hay 4 especiales genéricos por arquetipo). 5. Mando/gamepad y remapeo de teclas. 6. Escenarios con scroll de cámara.
