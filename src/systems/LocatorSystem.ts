import type { DomElement } from '../types'

export type MatchResult = {
  matched: boolean
  isUnique: boolean   // locator solo matchea UN enemigo (bonus de precisión)
  locatorType: 'id' | 'class' | 'tag' | 'attr' | 'role' | 'text' | 'label' | 'placeholder' | 'unknown'
  damage: number
  message: string
}

// Normalizes getBy* methods to correct camelCase regardless of what the user typed
// e.g.  getbyrole  →  getByRole    GETBYTEXT  →  getByText
function normalizeInput(raw: string): string {
  const s = raw.trim()
  const lower = s.toLowerCase()
  const methods: [string, string][] = [
    ['getbyrole',        'getByRole'],
    ['getbytext',        'getByText'],
    ['getbylabel',       'getByLabel'],
    ['getbyplaceholder', 'getByPlaceholder'],
    ['getbytestid',      'getByTestId'],
    ['getbyalttext',     'getByAltText'],
    ['getbytitle',       'getByTitle'],
  ]
  for (const [wrong, correct] of methods) {
    if (lower.startsWith(wrong)) return correct + s.slice(wrong.length)
  }
  return s
}

// Evalúa si un locator matchea un DomElement concreto
export function matchLocator(input: string, dom: DomElement): boolean {
  const s = normalizeInput(input)

  // #id
  if (s.startsWith('#')) {
    const id = s.slice(1)
    return dom.id === id
  }

  // .class  (también .class1.class2)
  if (s.startsWith('.')) {
    const classes = s.split('.').filter(Boolean)
    return classes.every(c => dom.classes.includes(c))
  }

  // [attr="value"] o [attr]
  if (s.startsWith('[')) {
    return matchAttr(s, dom)
  }

  // getByRole('role', {name: '...'}) o getByRole('role')
  if (s.startsWith('getByRole')) {
    return matchGetByRole(s, dom)
  }

  // getByText('...')
  if (s.startsWith('getByText')) {
    const text = extractFirstString(s)
    if (!text) return false
    return !!(dom.text && dom.text.toLowerCase().includes(text.toLowerCase()))
  }

  // getByLabel('...')
  if (s.startsWith('getByLabel')) {
    const label = extractFirstString(s)
    if (!label) return false
    return dom.ariaLabel?.toLowerCase() === label.toLowerCase()
  }

  // getByPlaceholder('...')
  if (s.startsWith('getByPlaceholder')) {
    const ph = extractFirstString(s)
    if (!ph) return false
    return dom.attrs['placeholder']?.toLowerCase() === ph.toLowerCase()
  }

  // tag selector (input, button, div)
  if (/^[a-z][a-z0-9]*$/i.test(s)) {
    return dom.tag === s.toLowerCase()
  }

  // tag#id  (input#user-name)
  const tagId = s.match(/^([a-z][a-z0-9]*)#([\w-]+)$/i)
  if (tagId) {
    return dom.tag === tagId[1].toLowerCase() && dom.id === tagId[2]
  }

  // tag.class  (input.form-input)
  const tagClass = s.match(/^([a-z][a-z0-9]*)(\.[\w-]+)+$/i)
  if (tagClass) {
    const [tagPart, ...rest] = s.split('.')
    const classes = rest
    return dom.tag === tagPart.toLowerCase() && classes.every(c => dom.classes.includes(c))
  }

  return false
}

function matchAttr(s: string, dom: DomElement): boolean {
  // [attr="value"]
  const full = s.match(/^\[([^=\]]+)="([^"]+)"\]$/)
  if (full) {
    const [, attr, val] = full
    if (attr === 'id') return dom.id === val
    if (attr === 'class') return dom.classes.includes(val)
    return dom.attrs[attr] === val
  }
  // [attr]
  const bare = s.match(/^\[([\w-]+)\]$/)
  if (bare) {
    const [, attr] = bare
    if (attr === 'id') return !!dom.id
    if (attr === 'class') return dom.classes.length > 0
    return attr in dom.attrs
  }
  return false
}

function matchGetByRole(s: string, dom: DomElement): boolean {
  const roleMatch = s.match(/getByRole\(['"]([^'"]+)['"]\s*(?:,\s*\{[^}]*name\s*:\s*['"]([^'"]+)['"]\s*\})?\s*\)/)
  if (!roleMatch) return false
  const [, role, name] = roleMatch
  const domRole = dom.role ?? implicitRole(dom)
  if (domRole !== role) return false
  if (name) {
    const text = dom.text ?? dom.ariaLabel ?? dom.attrs['value'] ?? ''
    return text.toLowerCase().includes(name.toLowerCase())
  }
  return true
}

function implicitRole(dom: DomElement): string {
  if (dom.tag === 'button') return 'button'
  if (dom.tag === 'input' && dom.attrs['type'] === 'submit') return 'button'
  if (dom.tag === 'input' && dom.attrs['type'] === 'text') return 'textbox'
  if (dom.tag === 'input' && dom.attrs['type'] === 'password') return 'textbox'
  if (dom.tag === 'a') return 'link'
  if (dom.tag === 'input') return 'textbox'
  return ''
}

function extractFirstString(s: string): string | null {
  const m = s.match(/\(['"]([^'"]+)['"]/)
  return m ? m[1] : null
}

// Calcula daño y tipo según el locator
export function evaluateLocator(input: string, target: DomElement, allEnemyDoms: DomElement[]): MatchResult {
  const s = normalizeInput(input)
  if (!s) return { matched: false, isUnique: false, locatorType: 'unknown', damage: 0, message: 'Escribe un locator.' }

  const matched = matchLocator(s, target)
  if (!matched) {
    return { matched: false, isUnique: false, locatorType: 'unknown', damage: 0, message: badMessage(s, target) }
  }

  const matchCount = allEnemyDoms.filter(d => matchLocator(s, d)).length
  const isUnique = matchCount === 1
  const locatorType = detectType(s)
  const baseDamage = BASE_DAMAGE[locatorType] ?? 20
  const damage = isUnique ? Math.floor(baseDamage * 1.2) : Math.floor(baseDamage / matchCount)

  return {
    matched: true,
    isUnique,
    locatorType,
    damage,
    message: hitMessage(locatorType, isUnique, s)
  }
}

const BASE_DAMAGE: Record<string, number> = {
  id: 40,
  class: 30,
  tag: 15,
  attr: 50,
  role: 70,
  text: 60,
  label: 65,
  placeholder: 55,
  unknown: 20
}

function detectType(s: string): MatchResult['locatorType'] {
  if (s.startsWith('#')) return 'id'
  if (s.startsWith('.')) return 'class'
  if (s.startsWith('[')) return 'attr'
  if (s.startsWith('getByRole')) return 'role'
  if (s.startsWith('getByText')) return 'text'
  if (s.startsWith('getByLabel')) return 'label'
  if (s.startsWith('getByPlaceholder')) return 'placeholder'
  if (/^[a-z]/i.test(s)) return 'tag'
  return 'unknown'
}

function hitMessage(type: MatchResult['locatorType'], unique: boolean, s: string): string {
  if (type === 'id' && unique) return `¡Perfecto! \`${s}\` es único — como una variable const.`
  if (type === 'id') return `¡Bien! Selector de ID encontrado.`
  if (type === 'class' && !unique) return `\`${s}\` matchea múltiples enemigos — daño dividido.`
  if (type === 'class') return `¡Bien! Selector de clase específico.`
  if (type === 'attr') return `¡Excelente! Atributo exacto — máximo daño.`
  if (type === 'role') return `¡Playwright pro! getByRole es robusto y semántico.`
  if (type === 'tag' && !unique) return `El tag \`${s}\` matchea TODOS los ${s}s — daño muy dividido.`
  return `Locator válido.`
}

function badMessage(s: string, dom: DomElement): string {
  if (s.startsWith('#')) return `\`${s}\` no existe en este elemento. El id es "${dom.id ?? 'ninguno'}".`
  if (s.startsWith('.')) return `Clase no encontrada. Este elemento tiene: ${dom.classes.length ? dom.classes.join(', ') : 'ninguna'}.`
  if (s.startsWith('getByRole')) return `Rol incorrecto. Este elemento es role="${dom.role ?? implicitRole2(dom)}".`
  return `El locator \`${s}\` no matchea este elemento. Inspecciona el HTML.`
}

function implicitRole2(dom: DomElement): string {
  if (dom.tag === 'input' && dom.attrs['type'] === 'submit') return 'button'
  if (dom.tag === 'input') return 'textbox'
  if (dom.tag === 'button') return 'button'
  return dom.tag
}
