# QA Tower Defense — Game Design Document

## Concepto central
Tower defense donde los enemigos son elementos HTML del DOM que invaden tu página.
Para atacarlos, escribes el locator correcto (CSS selector o Playwright selector) en el
input de la torre. Si el locator matchea el elemento, la torre dispara. Si falla, pierdes tiempo.
El jugador aprende Playwright locators de forma orgánica mientras defiende su sitio.

**Tagline:** "Si puedes seleccionarlo, puedes destruirlo."

---

## Loop de juego

```
Ola empieza → enemigos aparecen con su HTML visible
→ jugador inspecciona enemigo (hover = mini DevTools)
→ escribe locator en el input de la torre activa
→ torre valida el locator → dispara si matchea
→ enemigo recibe daño según precisión del selector
→ kill = XP → XP = upgrades de torre
→ si enemigo llega al final = pierde HP de base
→ siguiente ola con enemigos más complejos
```

---

## El sistema de locators (mecánica central)

Cada enemigo tiene un `domNode` visible al jugador:

```html
<!-- Enemigo básico (nivel 1) -->
<input id="user-name" type="text" placeholder="Username">

<!-- Enemigo intermedio (nivel 2) -->
<div class="inventory_item_price">$29.99</div>

<!-- Enemigo avanzado (nivel 3) -->
<button class="btn_primary" data-test="add-to-cart-sauce-labs-backpack">
  Add to cart
</button>

<!-- Enemigo boss (nivel 4) -->
<!-- El ID cambia cada ola: id="login-btn-1", id="login-btn-2"... -->
<button id="login-btn-7" class="submit-btn" type="submit">Login</button>
```

### Tipos de locator y daño

| Locator | Ejemplo | Daño | Desbloqueo |
|---------|---------|------|------------|
| `#id` | `#user-name` | 40 | Nivel 1 |
| `.class` | `.inventory_item_price` | 30 | Nivel 1 |
| `[attr]` | `[data-test="add-to-cart"]` | 50 | Nivel 2 |
| `getByRole` | `getByRole('button', {name:'Login'})` | 70 | Nivel 3 |
| `getByText` | `getByText('Add to cart')` | 60 | Nivel 3 |
| `getByLabel` | `getByLabel('Username')` | 65 | Nivel 3 |
| `getByTestId` | `getByTestId('add-to-cart-...')` | 80 | Nivel 4 |

### Reglas de precisión
- Locator muy genérico (`.btn` matchea 5 enemigos a la vez) = daño dividido entre todos
- Locator exacto y único = daño completo + bonus de precisión +20%
- Locator con `await` correcto en nivel 4 = disparo encadenado (2 balas seguidas)

### Sistema de combo
- 3 locators correctos seguidos = COMBO x2 (torre en fuego, doble cadencia)
- 5 correctos seguidos = CRITICAL SELECTOR (bala especial, mata de un hit)
- Un fallo = combo se rompe

---

## Torres

### Torre CSS (nivel 1 — desbloqueada al inicio)
- Acepta: `#id`, `.class`, `tag`
- Rango: corto
- Cadencia: lenta
- Visual: torre de madera con un selector `#` grabado
- Upgrade path: aumenta rango → aumenta cadencia → añade `.class`

### Torre Attribute (nivel 2)
- Acepta: `[attr="value"]`, `[type]`, `[placeholder]`
- Rango: medio
- Daño: medio-alto
- Visual: torre de piedra con corchetes `[ ]`
- Upgrade: multi-atributo, partial match

### Torre Playwright (nivel 3)
- Acepta: `getByRole`, `getByText`, `getByLabel`
- La más versátil — funciona contra boss enemies con ID dinámico
- Visual: torre metálica con el logo de Playwright (triángulo verde)
- Upgrade: chaining (`getByRole().filter()`)

### Torre Async (nivel 4 — torre final)
- Acepta: cualquier locator, pero dispara con `await`
- Mecánica especial: el jugador escribe `await tower.attack(locator)` 
- Si la sintaxis async es correcta, dispara x3 seguido
- Si falta el `await`, la bala sale pero no hace daño (bug simulado)
- Visual: torre dorada con símbolo `⚡`

---

## Enemigos

### Tier 1 — Static Elements (niveles 1-2)
- `InputEnemy` — input fields de login. Lento, poca HP. Debilidad: `#id`
- `ButtonEnemy` — botones simples. Velocidad media. Debilidad: `[type]`
- `DivEnemy` — divs con clase. Agrupa de a 3. Debilidad: `.class`

### Tier 2 — Dynamic Elements (niveles 2-3)
- `ListItemEnemy` — `<li>` repetidos, vienen en array de 6. Debes usar `:nth-child` o índice
- `PriceEnemy` — precio cambia cada ola (+$1). `getByText` no sirve con número exacto
- `FormEnemy` — formulario completo. Necesitas locator por `getByLabel`

### Tier 3 — Tricky Elements (nivel 3-4)
- `HiddenEnemy` — elemento con `display:none` al inicio, aparece después. Necesita `waitFor`
- `DynamicIdEnemy` — ID cambia cada ola. Boss recurrente. Solo muere con `getByRole`
- `ShadowDomEnemy` — dentro de web component. Locator normal no funciona. Bonus challenge

### Boss — The SPA (final de campaña)
- Página entera que se recarga dinámicamente
- Múltiples tipos de elementos a la vez
- Requiere chaining: `getByRole('region', {name:'Products'}).getByRole('button')`
- Mecánica: tienes 30 segundos, escribe el locator más específico posible

---

## Progresión de niveles (mapeado al roadmap de JS)

### Nivel 1 — SauceDemo: Login Page
**Concepto JS:** variables, const, let, tipos de dato  
**Mapa:** login form de SauceDemo  
**Enemigos:** InputEnemy (username, password), ButtonEnemy (login)  
**Torre disponible:** CSS Tower  
**Enseña:** `#user-name`, `#password`, `#login-button` — identificadores únicos como `const`  
**Frase motivacional:** "Un ID es como un `const` — único e irrepetible."

### Nivel 2 — SauceDemo: Inventory
**Concepto JS:** arrays, loops, map/filter  
**Mapa:** página de productos  
**Enemigos:** DivEnemy ×6 (inventory items), PriceEnemy, ListItemEnemy  
**Torre nueva:** Attribute Tower  
**Enseña:** `.inventory_item`, `[data-test]`, nth selectors — una clase = muchos elementos = array  
**Frase motivacional:** "`.class` devuelve un array. Igual que `filter()` en JS."

### Nivel 3 — SauceDemo: Cart + Checkout
**Concepto JS:** funciones, parámetros, return  
**Mapa:** carrito y formulario de checkout  
**Enemigos:** FormEnemy, DynamicIdEnemy (primer boss)  
**Torre nueva:** Playwright Tower  
**Enseña:** `getByRole('button', {name:'...'})` — una función con nombre y parámetros  
**Frase motivacional:** "`getByRole` es una función. Le pasas parámetros, te devuelve el elemento."

### Nivel 4 — SauceDemo: Checkout Step 2
**Concepto JS:** async/await, Promises  
**Mapa:** confirmación de orden  
**Enemigos:** HiddenEnemy, ShadowDomEnemy  
**Torre nueva:** Async Tower  
**Enseña:** `await page.click(locator)` — sin await, la acción no espera  
**Frase motivacional:** "Sin `await`, Playwright no espera. El enemigo pasa de largo."

### Nivel 5 — Boss: The SPA
**Concepto JS:** todo junto  
**Mapa:** SauceDemo completo, dinámico  
**Enemigos:** todos los tipos, aleatorios  
**Enseña:** chaining, locators robustos, buenas prácticas  

---

## UI y pantallas

### HUD durante el juego
```
┌─────────────────────────────────────────────────┐
│  ❤️ Base: 100  |  💰 XP: 340  |  Ola: 3/5      │
├─────────────────────────────────────────────────┤
│                                                 │
│              [MAPA + TORRES + ENEMIGOS]         │
│                                                 │
├─────────────────────────────────────────────────┤
│  Torre activa: CSS Tower  |  COMBO: ●●●○○       │
│  > getByRole('button', {name: '...'})_          │  ← input
│  [Disparar ↵]   [Inspector 🔍]   [Upgrade ⬆]   │
└─────────────────────────────────────────────────┘
```

### Inspector Panel (al hacer hover en enemigo)
Simula el DevTools de Chrome:
```
Elements | Console | Network

▼ <div class="inventory_item">
    <div class="inventory_item_img">...</div>
    <div class="inventory_item_name">Sauce Labs Backpack</div>
    <div class="inventory_item_price">$29.99</div>
    <button data-test="add-to-cart-sauce-labs-backpack"
            class="btn_primary btn_inventory">
      Add to cart
    </button>
  </div>

Computed styles: display: flex, flex-direction: column...
```

### Pantalla de upgrade
Al subir de nivel la torre, aparece un árbol de upgrades visual.
Tres rutas posibles — el jugador elige cuál es más útil para la siguiente ola.

---

## Sistemas de progresión

### XP y kills
- Kill básico: 10 XP
- Kill con combo activo: 15-25 XP
- Kill con locator perfecto (único match): +5 XP bonus
- Ola completa sin dejar pasar ninguno: +50 XP

### Upgrades de torre (ejemplo: CSS Tower)
```
Nivel 1: #id y .class básicos
    ↓
Nivel 2A: +rango     |  Nivel 2B: +cadencia de disparo
    ↓                        ↓
Nivel 3A: añade [attr]  |  Nivel 3B: splash damage (.class múltiple)
    ↓
Nivel 4: desbloquea Attribute Tower gratis
```

### Achievements (engancha la replayabilidad)
- "CSS Master" — completa nivel 1 sin fallar un locator
- "Array Slayer" — destruye 6 DivEnemies con un solo `.class`
- "No more var" — nunca uses un selector demasiado genérico (`*`, `div`)
- "Playwright Pro" — usa `getByRole` en 10 kills seguidos
- "Async Veteran" — completa nivel 4 con torre Async sin olvidar el `await`

---

## Assets necesarios

### Sprites (Kenney + IA)
- `tower-css.png` — torre madera con `#`
- `tower-attr.png` — torre piedra con `[ ]`
- `tower-playwright.png` — torre metal verde
- `tower-async.png` — torre dorada con `⚡`
- Enemigos: generados con Midjourney, prompt sugerido abajo
- Tileset del mapa: `kenney.nl/assets/tower-defense-kit`
- UI icons: `kenney.nl/assets/ui-pack`

**Prompt Midjourney para enemigos:**
```
cute pixel art enemy shaped like a glowing HTML element tag,
tower defense game sprite sheet, 4 frames walk animation,
transparent background, 32x32px, 8-bit style, teal and amber colors
```

### Audio (freesound.org — licencia CC0)
- Disparo de torre: corto, digital
- Kill de enemigo: "pop" satisfactorio
- Combo activado: acorde ascendente
- Enemy llega a la base: error de terminal (beep triste)
- Nivel completado: fanfare breve

---

## Hoja de ruta de desarrollo

### Fase 1 — Prototipo jugable (2-3 semanas)
- [ ] Setup Phaser 3 + TypeScript + Vite
- [ ] Mapa básico con path predefinido
- [ ] Una torre (CSS), un tipo de enemigo (InputEnemy)
- [ ] Sistema de locator validation funcionando
- [ ] Input para escribir el locator

### Fase 2 — Mecánicas core (3-4 semanas)
- [ ] Sistema de olas (WaveSystem)
- [ ] Todos los tipos de enemigos del nivel 1-2
- [ ] Inspector Panel (hover = ver DOM)
- [ ] Sistema de XP y upgrades
- [ ] Sistema de combo

### Fase 3 — Contenido educativo (2-3 semanas)
- [ ] Niveles 1-4 completos con su curricula
- [ ] Tooltips educativos al ganar/perder con un locator
- [ ] Pantalla post-nivel con resumen de lo aprendido

### Fase 4 — Polish (1-2 semanas)
- [ ] Sprites finales y animaciones
- [ ] Audio
- [ ] Achievements
- [ ] Pantalla de menú y de game over
- [ ] Deploy en GitHub Pages

---

## Referencia técnica rápida

### Validación de locator (lógica central)
```typescript
// src/systems/LocatorSystem.ts
export function validateLocator(input: string, enemy: DomElement): boolean {
  // Para CSS selectors: parsear y comparar contra domNode del enemigo
  // Para Playwright locators: simular la API con nuestro DOM falso
  // Retorna true si el locator matchea exactamente este enemigo
}
```

### Estructura de un enemigo
```typescript
interface DomElement {
  tag: string           // 'input', 'button', 'div'
  id?: string           // 'user-name'
  classes: string[]     // ['btn_primary', 'btn_inventory']
  attrs: Record<string, string>  // { 'data-test': 'add-to-cart-...' }
  text?: string         // 'Add to cart'
  role?: string         // 'button', 'textbox', 'link'
  ariaLabel?: string
}
```

Ver `docs/curriculum.md` para la progresión educativa detallada por nivel.
