import Phaser from 'phaser'

export class TutorialScene extends Phaser.Scene {
  constructor() { super('TutorialScene') }

  create() {
    const W = 960, H = 540
    this.cameras.main.fadeIn(450)

    // ── Background ────────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1117)

    // Top bar
    this.add.rectangle(W / 2, 0, W, 58, 0x161b22).setOrigin(0.5, 0)
    this.add.rectangle(W / 2, 58, W, 2, 0x238636).setOrigin(0.5, 0)

    // Column divider
    this.add.rectangle(472, 295, 2, 390, 0x21262d)

    // ── Header ────────────────────────────────────────────────────────────────
    this.add.text(W / 2, 12, '⚡  QA TOWER DEFENSE', {
      fontSize: '25px', color: '#58a6ff', fontFamily: '"JetBrains Mono", monospace',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5, 0)

    this.add.text(W / 2, 40, 'aprende Playwright locators jugando · Nivel 1: SauceDemo Login', {
      fontSize: '10px', color: '#8b949e', fontFamily: '"JetBrains Mono", monospace'
    }).setOrigin(0.5, 0)

    // ── Left column ───────────────────────────────────────────────────────────
    this.buildLeft()

    // ── Right column ──────────────────────────────────────────────────────────
    this.buildRight()

    // ── Start button ──────────────────────────────────────────────────────────
    const btn = this.add.nineslice(W / 2, H - 33, 'btn-green', undefined, 240, 50, 12, 12, 12, 12)
    btn.setOrigin(0.5).setInteractive()
    btn.on('pointerover', () => btn.setScale(1.06))
    btn.on('pointerout',  () => btn.setScale(1.0))
    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(280)
      this.time.delayedCall(300, () => this.scene.start('GameScene'))
    })
    this.add.text(W / 2, H - 33, '▶  Empezar Nivel 1', {
      fontSize: '17px', color: '#ffffff', fontFamily: '"JetBrains Mono", monospace',
      stroke: '#00000066', strokeThickness: 2
    }).setOrigin(0.5)

    // Keyboard shortcut hint
    this.add.text(W / 2, H - 8, 'o pulsa Enter', {
      fontSize: '9px', color: '#484f58', fontFamily: '"JetBrains Mono", monospace'
    }).setOrigin(0.5)

    // Allow Enter to start
    this.input.keyboard?.once('keydown-ENTER', () => {
      this.cameras.main.fadeOut(280)
      this.time.delayedCall(300, () => this.scene.start('GameScene'))
    })
  }

  // ── LEFT COLUMN: How it works + locator reference ─────────────────────────
  private buildLeft() {
    const lx = 20
    let y = 68

    const gfx = this.add.graphics()

    // ── HOW IT WORKS box ──────────────────────────────────────────────────────
    gfx.fillStyle(0x161b22).fillRoundedRect(lx - 4, y - 4, 444, 148, 6)
    gfx.lineStyle(1, 0x30363d).strokeRoundedRect(lx - 4, y - 4, 444, 148, 6)

    this.add.text(lx, y, '¿Cómo funciona?', {
      fontSize: '12px', color: '#e6edf3', fontFamily: '"JetBrains Mono", monospace', fontStyle: 'bold'
    })
    y += 20

    const steps: [string, string][] = [
      ['1.', 'Los enemigos son elementos HTML del DOM de SauceDemo'],
      ['2.', 'Cada enemigo avanza por el camino hacia tu base'],
      ['3.', 'Escribe un CSS/Playwright locator en el input'],
      ['4.', 'Pulsa Enter — si coincide, la torre dispara'],
      ['5.', 'Locator único → +20% daño.  Más rápido → más combo'],
    ]
    for (const [num, text] of steps) {
      this.add.text(lx, y, num, { fontSize: '11px', color: '#238636', fontFamily: '"JetBrains Mono", monospace' })
      this.add.text(lx + 18, y, text, { fontSize: '11px', color: '#8b949e', fontFamily: '"JetBrains Mono", monospace' })
      y += 16
    }

    // ── LOCATOR REFERENCE box ─────────────────────────────────────────────────
    y += 10
    gfx.fillStyle(0x161b22).fillRoundedRect(lx - 4, y - 4, 444, 244, 6)
    gfx.lineStyle(1, 0x30363d).strokeRoundedRect(lx - 4, y - 4, 444, 244, 6)

    this.add.text(lx, y, 'Locators disponibles', {
      fontSize: '12px', color: '#e6edf3', fontFamily: '"JetBrains Mono", monospace', fontStyle: 'bold'
    })
    y += 20

    // [selector,  description,  damage,  color]
    const locators: [string, string, string, string][] = [
      ['#id',                           '→ ID único del elemento',               'DMG 40', '#7ee787'],
      ['.class',                        '→ Clase CSS (puede afectar varios)',     'DMG 30', '#79c0ff'],
      ['[attr="val"]',                  '→ Atributo específico',                 'DMG 50', '#ffa657'],
      ["getByRole('button',{name:'…'})", '→ Rol ARIA + nombre accesible',        'DMG 70', '#d2a8ff'],
      ["getByText('Login')",            '→ Texto visible del elemento',          'DMG 60', '#f0883e'],
      ["getByPlaceholder('Username')",  '→ Placeholder de un input',             'DMG 55', '#79c0ff'],
      ["getByLabel('Username')",        '→ Label asociado al input',             'DMG 65', '#ffa657'],
      ['tag  o  tag#id  o  tag.class',  '→ Combinaciones CSS estándar',          'DMG 15', '#8b949e'],
    ]

    for (const [sel, desc, dmg, col] of locators) {
      this.add.text(lx + 4, y, sel, {
        fontSize: '10px', color: col, fontFamily: '"JetBrains Mono", monospace'
      })
      this.add.text(lx + 4, y + 12, desc, {
        fontSize: '9px', color: '#484f58', fontFamily: '"JetBrains Mono", monospace'
      })
      this.add.text(lx + 380, y + 2, dmg, {
        fontSize: '9px', color: '#f85149', fontFamily: '"JetBrains Mono", monospace'
      })
      y += 28
    }
  }

  // ── RIGHT COLUMN: Enemy cards ─────────────────────────────────────────────
  private buildRight() {
    const rx = 488
    let y = 68

    this.add.text(rx, y, 'Enemigos — Ola 1', {
      fontSize: '12px', color: '#e6edf3', fontFamily: '"JetBrains Mono", monospace', fontStyle: 'bold'
    })
    y += 22

    const enemies = [
      {
        tag: 'input', id: 'user-name', type: 'text', placeholder: 'Username',
        hp: 60, xp: 10, color: 0x4fc3f7, colorHex: '#4fc3f7',
        animKey: 'walk-blue', frame: 'robot_blueDrive1.png', tint: 0x4fc3f7,
        locators: ['#user-name', '.form-input', '[type="text"]', "[placeholder='Username']"],
        hint: 'getByPlaceholder(\'Username\')'
      },
      {
        tag: 'input', id: 'password', type: 'password', placeholder: 'Password',
        hp: 60, xp: 10, color: 0x81d4fa, colorHex: '#81d4fa',
        animKey: 'walk-blue', frame: 'robot_blueDrive1.png', tint: 0x81d4fa,
        locators: ['#password', '.form-input', '[type="password"]'],
        hint: 'getByRole(\'textbox\')'
      },
      {
        tag: 'input', id: 'login-button', type: 'submit', value: 'Login',
        hp: 100, xp: 20, color: 0xef9a9a, colorHex: '#ef9a9a',
        animKey: 'walk-red', frame: 'robot_redDrive1.png', tint: 0xef9a9a,
        locators: ['#login-button', '[type="submit"]'],
        hint: 'getByRole(\'button\',{name:\'Login\'})'
      }
    ]

    for (const e of enemies) {
      const CH = 120
      const gfx = this.add.graphics()

      // Card background
      gfx.fillStyle(0x161b22).fillRoundedRect(rx - 4, y - 4, 456, CH, 6)
      gfx.lineStyle(1, 0x21262d).strokeRoundedRect(rx - 4, y - 4, 456, CH, 6)
      // Color accent strip on left
      gfx.fillStyle(e.color, 0.6).fillRect(rx - 4, y - 4, 3, CH)

      // Robot preview (animated sprite, right side)
      const sprite = this.add.sprite(rx + 414, y + 48, 'robots', e.frame)
      sprite.setScale(0.34).setTint(e.tint)
      try { sprite.play(e.animKey) } catch (_) {}

      // HTML snippet
      const hasValue = (e as typeof e & { value?: string }).value
      const line1 = `<${e.tag} id="${e.id}"`
      const attrParts = [`type="${e.type}"`, e.placeholder ? `placeholder="${e.placeholder}"` : `value="${hasValue}"` ]
      const line2 = `      ${attrParts.join(' ')} />`

      this.add.text(rx + 4, y + 2, line1, {
        fontSize: '10px', color: '#7ee787', fontFamily: '"JetBrains Mono", monospace'
      })
      this.add.text(rx + 4, y + 14, line2, {
        fontSize: '10px', color: '#7ee787', fontFamily: '"JetBrains Mono", monospace'
      })

      // HP bar
      const barW = 180
      gfx.fillStyle(0x1c2128).fillRoundedRect(rx + 4, y + 34, barW, 7, 2)
      const hpColor = e.hp > 80 ? 0x3fb950 : e.hp > 40 ? 0xe3b341 : 0xf85149
      gfx.fillStyle(hpColor).fillRoundedRect(rx + 4, y + 34, Math.floor(barW * e.hp / 100), 7, 2)

      this.add.text(rx + 190, y + 32, `HP ${e.hp}   XP +${e.xp}`, {
        fontSize: '9px', color: '#8b949e', fontFamily: '"JetBrains Mono", monospace'
      })

      // Locator tags
      this.add.text(rx + 4, y + 50, 'Locators:', {
        fontSize: '9px', color: '#484f58', fontFamily: '"JetBrains Mono", monospace'
      })
      this.add.text(rx + 60, y + 50, e.locators.join('  '), {
        fontSize: '9px', color: '#58a6ff', fontFamily: '"JetBrains Mono", monospace'
      })

      // Best locator hint
      this.add.text(rx + 4, y + 65, '⭐ Más daño:', {
        fontSize: '9px', color: '#484f58', fontFamily: '"JetBrains Mono", monospace'
      })
      this.add.text(rx + 66, y + 65, e.hint, {
        fontSize: '9px', color: '#d2a8ff', fontFamily: '"JetBrains Mono", monospace'
      })

      y += CH + 8
    }

    // Bottom tip
    this.add.text(rx, y + 6,
      '💡 Hover sobre un enemigo en el juego\n   para ver su HTML en el inspector.',
      { fontSize: '10px', color: '#484f58', fontFamily: '"JetBrains Mono", monospace', lineSpacing: 4 }
    )
  }
}
