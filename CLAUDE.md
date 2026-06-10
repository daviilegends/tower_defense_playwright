# QA Tower Defense — CLAUDE.md

## Qué es este proyecto
Tower defense educativo donde los enemigos son elementos HTML/CSS del DOM.
El jugador escribe Playwright locators para atacarlos. Aprende QA automation jugando.
Sitio de práctica: SauceDemo (saucedemo.com).

## Stack
- **Phaser 3** — motor de juego (canvas/WebGL)
- **TypeScript** — lenguaje principal
- **Vite** — bundler y dev server
- **Node 18+** requerido

## Comandos
```bash
npm install        # instalar dependencias
npm run dev        # servidor local (localhost:5173)
npm run build      # build de producción
npm run typecheck  # verificar tipos sin compilar
```

## Estructura de carpetas
```
src/
  scenes/          # Phaser Scenes (Boot, Menu, Game, UI)
  entities/        # Tower, Enemy, Bullet (clases base)
  data/            # enemies.ts, levels.ts, towers.ts (datos puros)
  systems/         # LocatorSystem, WaveSystem, UpgradeSystem
  ui/              # HUD, InspectorPanel, LocatorInput
  utils/           # helpers, constants
public/
  assets/
    sprites/       # imágenes (Kenney + generados con IA)
    tilemaps/      # mapas de Tiled
    audio/         # sfx y música
docs/
  GAME_DESIGN.md   # GDD completo — leer antes de añadir mecánicas
  curriculum.md    # progresión educativa por nivel
```

## Arquitectura clave
- Cada `Enemy` tiene una propiedad `domNode: DomElement` con tag, id, classes y attrs
- `LocatorSystem.validate(input, enemy)` evalúa si el locator matchea al enemigo
- Las torres se diferencian por `locatorType` permitido (css | role | text | playwright)
- El mapa es SauceDemo reconstruido como tilemap — mismos selectores del sitio real

## Convenciones
- Un archivo por clase. Nombres en PascalCase para clases, camelCase para utils
- Los datos de niveles y enemigos van en `src/data/` — nunca hardcodeados en escenas
- Toda la lógica educativa (qué enseña cada nivel) vive en `docs/curriculum.md`
- Comentarios en español. Código en inglés

## Contexto del desarrollador
- Perfil: QA manual en transición a automation con Playwright
- Objetivo del juego: aprender JS + Playwright locators de forma progresiva
- Ver docs/GAME_DESIGN.md para mecánicas completas
