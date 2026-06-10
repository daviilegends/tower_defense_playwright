import type { DomElement } from '../types'

export interface Suggestion {
  label: string
  value: string
  type: 'id' | 'class' | 'attr' | 'role' | 'text' | 'label' | 'placeholder'
  dmg: number
}

const TYPE_COLOR: Record<string, string> = {
  id:          '#7ee787',
  class:       '#79c0ff',
  attr:        '#ffa657',
  role:        '#d2a8ff',
  text:        '#f0883e',
  label:       '#ffa657',
  placeholder: '#79c0ff',
}

// Generates all valid locator suggestions from a list of DOM elements
export function buildSuggestions(doms: DomElement[]): Suggestion[] {
  const out: Suggestion[] = []
  const seen = new Set<string>()

  const add = (value: string, type: Suggestion['type'], dmg: number) => {
    if (seen.has(value)) return
    seen.add(value)
    out.push({ label: value, value, type, dmg })
  }

  for (const d of doms) {
    if (d.id)             add(`#${d.id}`,                              'id',          40)
    for (const c of d.classes) add(`.${c}`,                           'class',       30)
    for (const [k, v] of Object.entries(d.attrs))
                          add(`[${k}="${v}"]`,                         'attr',        50)
    if (d.role)           add(`getByRole('${d.role}')`,               'role',        70)
    if (d.attrs.placeholder)
                          add(`getByPlaceholder('${d.attrs.placeholder}')`, 'placeholder', 55)
    if (d.ariaLabel)      add(`getByLabel('${d.ariaLabel}')`,         'label',       65)
    if (d.text)           add(`getByText('${d.text}')`,               'text',        60)
  }
  return out
}

// ── Dropdown UI component ─────────────────────────────────────────────────────

export class LocatorAutocomplete {
  private input: HTMLInputElement
  private box: HTMLDivElement
  private all: Suggestion[] = []
  private visible: Suggestion[] = []
  private activeIdx = 0

  constructor(input: HTMLInputElement, container: HTMLElement) {
    this.input = input

    this.box = document.createElement('div')
    this.box.style.cssText = `
      position:absolute;
      left:8px;
      bottom:90px;
      width:calc(100% - 148px);
      background:#161b22;
      border:1px solid #30363d;
      border-top:1px solid #388bfd;
      border-radius:6px 6px 0 0;
      font-family:'JetBrains Mono',monospace;
      font-size:11.5px;
      z-index:1000;
      display:none;
      overflow:hidden;
      box-shadow:0 -6px 24px rgba(0,0,0,0.6);
    `
    container.appendChild(this.box)

    input.addEventListener('input', () => this.refresh())
    input.addEventListener('keydown', e => this.onKey(e))
    input.addEventListener('blur', () => setTimeout(() => this.hide(), 150))
  }

  update(suggestions: Suggestion[]) {
    this.all = suggestions
    this.refresh()
  }

  // Called when input value is set programmatically (e.g., after firing)
  clear() { this.hide() }

  private refresh() {
    const q = this.input.value.trim().toLowerCase()
    if (!q) { this.hide(); return }

    this.visible = this.all
      .filter(s => s.value.toLowerCase().includes(q))
      .slice(0, 7)

    if (!this.visible.length) { this.hide(); return }

    if (this.activeIdx >= this.visible.length) this.activeIdx = 0
    this.render()
  }

  private render() {
    const q = this.input.value.trim()
    this.box.innerHTML = ''

    this.visible.forEach((s, i) => {
      const row = document.createElement('div')
      row.style.cssText = `
        padding:5px 12px;
        cursor:pointer;
        display:flex;
        justify-content:space-between;
        align-items:center;
        border-bottom:1px solid #21262d;
        background:${i === this.activeIdx ? '#1c2128' : 'transparent'};
      `

      const col = TYPE_COLOR[s.type] ?? '#e6edf3'
      row.innerHTML =
        `<span style="color:${col}">${highlight(s.value, q)}</span>` +
        `<span style="color:#484f58;font-size:10px">DMG&nbsp;${s.dmg}</span>`

      row.addEventListener('mouseenter', () => { this.activeIdx = i; this.render() })
      row.addEventListener('click', () => this.select(i))
      this.box.appendChild(row)
    })

    // Small header
    const hint = document.createElement('div')
    hint.style.cssText = `
      padding:3px 12px;
      font-size:9px;
      color:#484f58;
      background:#0d1117;
      border-bottom:1px solid #21262d;
    `
    hint.textContent = '↑↓ navegar  ·  Tab seleccionar  ·  Esc cerrar'
    this.box.insertBefore(hint, this.box.firstChild)

    this.box.style.display = 'block'
  }

  private onKey(e: KeyboardEvent) {
    if (this.box.style.display === 'none') return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      this.activeIdx = (this.activeIdx + 1) % this.visible.length
      this.render()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      this.activeIdx = (this.activeIdx - 1 + this.visible.length) % this.visible.length
      this.render()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      this.select(this.activeIdx)
    } else if (e.key === 'Escape') {
      this.hide()
    }
    // Enter is handled by the parent (fireLocator)
  }

  private select(i: number) {
    const s = this.visible[i]
    if (!s) return
    this.input.value = s.value
    this.hide()
    this.input.focus()
    // Trigger input event so the parent knows value changed
    this.input.dispatchEvent(new Event('input'))
  }

  hide() {
    this.box.style.display = 'none'
  }

  destroy() { this.box.remove() }
}

function highlight(text: string, query: string): string {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    text.slice(0, idx) +
    `<mark style="background:#264f78;color:#e6edf3;border-radius:2px">${text.slice(idx, idx + query.length)}</mark>` +
    text.slice(idx + query.length)
  )
}
