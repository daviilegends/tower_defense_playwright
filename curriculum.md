# QA Tower Defense — Curricula por nivel

## Cómo usar este archivo
Cada nivel del juego enseña UN concepto de JavaScript/Playwright.
Este archivo define qué aprende el jugador en cada nivel, qué mensaje
mostrar cuando falla, y qué tooltip educativo aparece al ganar.

---

## Nivel 1 — Variables y tipos

### Concepto JS
`const`, `let`, tipos de dato (string, number, boolean)

### Conexión con el juego
Un `#id` en HTML es como un `const` en JavaScript:
- Es único — no puede haber dos iguales en la misma página
- No cambia — el ID `user-name` siempre es `user-name`
- Si intentas usar el mismo ID dos veces, falla (como reasignar un `const`)

### Mensajes educativos
**Al usar #id correctamente:**
> "¡Exacto! `#user-name` es único en toda la página, igual que una variable `const`.
> En Playwright: `page.locator('#user-name')`"

**Al usar selector demasiado genérico:**
> "Ese selector matchea más de un elemento. En QA, los locators ambiguos
> son bugs esperando pasar. Sé más específico."

**Al fallar 3 veces seguidas:**
> "Tip: el ID del elemento está en el atributo `id=\"...\"` del HTML.
> Escríbelo así: `#valor-del-id`"

### Locators enseñados en este nivel
- `#id` — selector de ID
- `.class` — selector de clase (intro)
- `input[type="text"]` — combinación tag + atributo

### Enemies de este nivel y sus locators correctos
| Enemigo | HTML | Locator óptimo |
|---------|------|----------------|
| Username input | `<input id="user-name">` | `#user-name` |
| Password input | `<input id="password">` | `#password` |
| Login button | `<input id="login-button">` | `#login-button` |

---

## Nivel 2 — Arrays y múltiples elementos

### Concepto JS
Arrays, `.map()`, `.filter()`, `.find()` — colecciones de elementos

### Conexión con el juego
Una clase CSS devuelve múltiples elementos, igual que un array en JavaScript.
`document.querySelectorAll('.inventory_item')` → NodeList de 6 items.
`.filter()` en JS = añadir más condiciones al selector.

### Mensajes educativos
**Al usar .class que matchea 6 enemigos a la vez:**
> "¡Eso es un array! `.inventory_item` selecciona los 6 a la vez.
> El daño se divide entre todos — como hacer `forEach` sin elegir uno."

**Al usar :nth-child correctamente:**
> "Perfecto — `.inventory_item:nth-child(2)` es como `array[1]` en JavaScript.
> En Playwright: `page.locator('.inventory_item').nth(1)`"

### Locators enseñados en este nivel
- `.class` — múltiples elementos
- `.parent .child` — selector descendente
- `[data-test="..."]` — atributo data
- `:nth-child(n)` — índice dentro de lista

### Enemies de este nivel y sus locators correctos
| Enemigo | HTML | Locator óptimo |
|---------|------|----------------|
| Inventory item ×6 | `<div class="inventory_item">` | `.inventory_item` (splash) o `.inventory_item:nth-child(n)` (preciso) |
| Item price | `<div class="inventory_item_price">` | `.inventory_item_price` |
| Add to cart | `<button data-test="add-to-cart-sauce-labs-backpack">` | `[data-test="add-to-cart-sauce-labs-backpack"]` |

---

## Nivel 3 — Funciones y parámetros

### Concepto JS
`function`, arrow functions, parámetros, return value

### Conexión con el juego
`getByRole('button', {name: 'Add to cart'})` es una función con parámetros.
- `getByRole` = nombre de la función
- `'button'` = primer parámetro (el tipo)
- `{name: 'Add to cart'}` = segundo parámetro (opciones) — como un objeto de configuración

Igual que: `function atacar(tipo, opciones) { ... }`

### Mensajes educativos
**Al escribir getByRole correctamente:**
> "¡Bien! `getByRole` es la forma recomendada por Playwright.
> Funciona aunque cambie el ID o la clase — porque usa el rol semántico del elemento."

**Al olvidar el segundo parámetro:**
> "`getByRole('button')` matchea TODOS los botones de la página — son varios.
> Añade `{name: '...'}` para ser específico. Como pasar argumentos a una función."

**Al intentar usar #id en DynamicIdEnemy:**
> "Este enemigo cambia su ID en cada ola. Los IDs dinámicos son
> anti-pattern en QA. Usa `getByRole` o `getByText` — son estables."

### Locators enseñados en este nivel
- `getByRole('role', {name: '...'})`
- `getByText('texto exacto')`
- `getByLabel('label del campo')`
- `getByPlaceholder('placeholder text')`

### Enemies de este nivel y sus locators correctos
| Enemigo | HTML | Locator óptimo |
|---------|------|----------------|
| Checkout button | `<button class="btn_action">Checkout</button>` | `getByRole('button', {name: 'Checkout'})` |
| First name field | `<input placeholder="First Name">` | `getByPlaceholder('First Name')` |
| Dynamic boss | `<button id="login-btn-N">Login</button>` | `getByRole('button', {name: 'Login'})` |

---

## Nivel 4 — Async / Await

### Concepto JS
`async`, `await`, Promises, operaciones asíncronas

### Conexión con el juego
En Playwright, CASI TODA ACCIÓN es async. Si olvidas `await`, el código
sigue ejecutándose sin esperar que la acción termine.

Mecánica del juego: la torre Async dispara correctamente solo si
la sintaxis incluye `await`. Sin él, la bala sale pero atraviesa al enemigo sin daño
(simulando un test que pasa sin verificar nada).

### Mensajes educativos
**Al escribir `await` correctamente:**
> "Correcto. `await` le dice a JavaScript 'espera aquí hasta que esto termine'.
> Sin él, tu test termina antes de que Playwright haga el click."

**Al olvidar `await`:**
> "¡Sin `await`! La bala salió pero no hizo daño.
> Esto es un false positive — tu test 'pasó' sin verificar nada.
> El enemigo más peligroso en QA automation."

**Al completar el nivel 4:**
> "Ahora entiendes por qué cada línea de Playwright empieza con `await`.
> No es decoración — es la diferencia entre un test real y uno fantasma."

### Locators enseñados en este nivel
- `await page.click(locator)`
- `await page.fill(locator, value)`
- `await expect(locator).toBeVisible()`
- `await page.waitForSelector(locator)`

### Enemies de este nivel y sus locators correctos
| Enemigo | Comportamiento | Locator correcto |
|---------|---------------|-----------------|
| HiddenEnemy | Aparece después de 2 seg | `await page.waitForSelector('.confirmation')` |
| AsyncFormEnemy | Formulario que carga con fetch | `await expect(page.getByText('Order confirmed')).toBeVisible()` |
| ShadowDomEnemy | Dentro de web component | Bonus challenge — investigación libre |

---

## Resumen de progresión

```
Nivel 1: #id y .class    →  const, let, tipos únicos
Nivel 2: [attr] y nth    →  arrays, colecciones, índices
Nivel 3: getByRole/Text  →  funciones, parámetros, APIs
Nivel 4: await + expect  →  async/await, Promises
Nivel 5: todo combinado  →  test real de SauceDemo completo
```

Al terminar el nivel 5, el jugador puede escribir el test de Playwright
para el flujo completo de SauceDemo (login → cart → checkout) sin ayuda.
Ese test es la recompensa final del juego.
