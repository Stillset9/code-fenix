# Code Fenix

**Prometheon Studio. Fundador y creador: Santiago Píriz. Colaborador de ideas: Héctor Juani.**

Metroidvania soulslike en 2D con pixel art gótico. Vanilla JS y Canvas 2D, sin dependencias ni paso de build, y todo el arte y el sonido se generan por código.

## Cómo jugar
Abrí `index.html` en un navegador moderno (Chrome, Edge o Firefox). Funciona sin conexión.

## Controles
| Acción | Teclado | Mando |
|---|---|---|
| Moverse | ← → / A D | Stick / cruceta |
| Saltar / doble salto | Espacio / Z | A |
| Ataque ligero / crítico | J / X | X |
| Pesado (mantener: Arte) | K / C | Y |
| Disparo secundario | L / V | RB |
| Esquivar / impulso aéreo | Shift | B |
| Parada (parry) | Q | LB |
| Curar (Lágrima de Fénix) | R | LT |
| Verso / cambiar verso | F / T | RT / L3 |
| Ranura rápida (consumible) | G | R3 |
| Hablar / descansar | E / ↑ | Cruceta ↑ |
| Inventario y equipo | I / Tab | Select |
| Pausa / silenciar | Esc / P · M | Start |

En los menús: flechas para moverte, E o Enter para confirmar y Esc para volver. En el inventario, Q y T cambian de pestaña. En el árbol de habilidades, Enter despierta una rama con Plumas y K la paga con Créditos.

## Estructura
- `index.html`: lienzo de 640x360 y carga de scripts.
- `js/font.js`: fuente bitmap. `js/sprites.js`: sprites, paletas y apariencia del creador de personaje.
- `js/audio.js`: efectos con Web Audio. `js/bg.js`: utilidades de ruido (fondos del hito 1).
- `js/data.js`: objetos, armas, versos, NPCs y diálogos, y el árbol de habilidades.
- `js/rooms.js`: mapa. `js/core.js`: física, combate, IA y guardado.
- `js/render.js`: render del mundo. `js/hires.js`: arte a resolución nativa (fondos parallax, tiles, luz, íconos, retratos y marcos).
- `js/ui.js`: título, créditos, creador y bucle principal. `js/ui2.js`: HUD y menús en alta resolución.
- `js/rig.js`: esqueleto articulado de personajes (jugador, NPCs, enemigos y jefa) con todas las animaciones, pintado a resolución nativa.
- `js/music.js`: motor de música sintetizada (secuenciador, instrumentos y los 11 temas originales).
- `js/cine.js`: splash de Prometheon Studio, prólogo, presentación de la jefa, final, menú OPCIONES y director musical.
- `concept.md`: biblia de lore. `screenshots/`: capturas. `tests_puppeteer.js`: pruebas automáticas (Chrome sin interfaz).

## Música y opciones (hito 3)
Toda la música se genera en tiempo real con Web Audio y no usa archivos. El título, el prólogo, el final y las peleas contra jefes son metal sinfónico: coro, cuerdas, guitarras distorsionadas con power-chords y doble bombo. Cada zona tiene su tema de techno oscuro: Atrio, Refugio, Nave, Osario, Galería, Campanario y Santuario. Al cambiar de zona, un tema se funde con el siguiente.
En **OPCIONES** (desde el título o desde la pausa) podés ajustar el volumen de la música y de los efectos, y reasignar cualquier acción a otra tecla. Las opciones se guardan en `localStorage` (`codefenix_opts`). ESC y ENTER quedan reservadas.

## Cinemáticas
Al arrancar aparece el splash de Prometheon Studio. Al empezar una partida nueva se ve el prólogo, en cinco paneles. La primera vez que te enfrentás a la Abadesa hay una presentación dentro del juego, y antes de los créditos se ve el final. ENTER avanza y ESC salta.

## Guardado
Se guarda en `localStorage` (`codefenix_save_v1`) cada vez que descansás en una pira, incluida la apariencia del personaje.

## Celular, PWA y nube (hito 4)
- **Controles táctiles:** solo aparecen en pantallas táctiles. A la izquierda hay un stick virtual que aparece donde apoyás el dedo. A la derecha están los botones SALTO, ATAQUE, PESADO y ESQUIVA, y una fila más chica con CURAR, VERSO, PARADA y DISPARO. Junto al stick están E (interactuar), RÁPIDO (ranura rápida) y CAMBIAR (arma). Arriba a la derecha están ☰ (pausa/menú), BOLSA (inventario) y ⛶ (pantalla completa). Admite varios dedos a la vez y podés deslizar de un botón a otro.
- **Menús táctiles:** el stick mueve la selección, SALTO o ATAQUE confirman y ESQUIVA o ☰ vuelven. Además se pueden tocar directamente las opciones del título, de la pausa y de OPCIONES (incluidas las barras de volumen). En las cinemáticas, un toque avanza y ☰ salta.
- **Pantalla:** el juego se escala para ocupar la pantalla (con un múltiplo entero de píxeles cuando hay espacio). La página no hace zoom ni desplazamiento. En vertical aparece el aviso "Girá tu dispositivo" y el juego se pausa. La pantalla completa se activa al tocar para empezar, con el botón ⛶ o desde OPCIONES.
- **PWA:** incluye `manifest.webmanifest`, `sw.js` (precarga todo para jugar sin conexión) e íconos en `icons/`, generados por código con `tools/icons.html` y `tools/make-icons.js`. Solo funciona servido por http(s); abriendo `index.html` directamente, el juego anda igual, pero sin instalación.
- **Google y nube (opcional):** `firebase-config.js`, `js/cloud.js`, `firebase.json`, `.firebaserc` y `firestore.rules`. Sin configuración, el juego queda en modo invitado. Con configuración, aparece el botón "Iniciar sesión con Google" en el título y la partida se sincroniza con Firestore (`saves/{uid}`) al descansar en una pira, al iniciar sesión y al CONTINUAR. Gana la copia con la marca de tiempo más reciente.
- **Publicar:** ver **DEPLOY.md** (Firebase Hosting gratis o itch.io).
- **Pruebas:** `tests_puppeteer.js` (escritorio) y `tests_mobile.js` (celular en horizontal con multitoque real, PWA, modo sin conexión y lógica de sincronización).
