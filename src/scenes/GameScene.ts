import Phaser from 'phaser'
import { Enemy } from '../entities/Enemy'
import { Tower, TOWER_DEFS } from '../entities/Tower'
import { Bullet } from '../entities/Bullet'
import { WaveSystem } from '../systems/WaveSystem'
import { evaluateLocator } from '../systems/LocatorSystem'
import { ENEMY_DEFS } from '../data/enemies'
import { LEVELS } from '../data/levels'
import type { DomElement } from '../types'

const LEVEL_INDEX = 0

// ── 2D top-down path ─────────────────────────────────────────────────────────
// Canvas 960×540. HUD 44px top, locator panel 86px bottom.
// Playfield: y = 44 → 454.
// S-curve path from left edge to base on the right.

const PATH_W = 62   // path width in pixels

// Path waypoints (entry → base)
const V2 = Phaser.Math.Vector2
const PATH_POINTS: Phaser.Math.Vector2[] = [
  new V2(-30, 375),    // spawn off-screen left
  new V2(145, 375),    // → right
  new V2(145, 215),    // ↑ up
  new V2(400, 215),    // → right
  new V2(400, 365),    // ↓ down
  new V2(630, 365),    // → right
  new V2(630, 185),    // ↑ up
  new V2(840, 185),    // → base
]

// Tower position: grass area between the two horizontal path segments
const TOWER_POS = { x: 270, y: 295 }

// Base position: end of path
const BASE_POS  = { x: 840, y: 185 }

// ── Decorations (landscape atlas) placed on grass areas ─────────────────────
// [x, y, frame, scale]
const DECOS: [number, number, string, number][] = [
  // Top grass strip (between HUD y=44 and path y=215)
  [60,  100, 'trees_8.png',  0.40],
  [220, 150, 'trees_11.png', 0.38],
  [330, 145, 'trees_3.png',  0.39],
  [505, 140, 'trees_9.png',  0.40],
  [720, 130, 'trees_1.png',  0.39],
  [895, 105, 'trees_7.png',  0.38],

  // Bottom grass strip (between path y=365 and locator panel y=454)
  [68,  420, 'trees_6.png',  0.38],
  [270, 420, 'rocks_2.png',  0.38],
  [500, 418, 'trees_4.png',  0.39],
  [760, 415, 'trees_12.png', 0.38],
  [920, 420, 'rocks_3.png',  0.37],

  // Middle grass: between x=176 and x=369, y=246..334
  [50,  285, 'rocks_1.png',  0.37],
  [295, 280, 'trees_5.png',  0.39],
  [490, 275, 'rocks_5.png',  0.36],
  [755, 275, 'trees_2.png',  0.39],
]

export class GameScene extends Phaser.Scene {
  private enemies:  Enemy[]  = []
  private towers:   Tower[]  = []
  private bullets:  Bullet[] = []
  private waveSystem!: WaveSystem
  private selectedTower: Tower | null = null

  private baseHp   = 100
  private xp       = 0
  private combo    = 0
  private maxCombo = 0

  private hudHp!:    Phaser.GameObjects.Text
  private hudXp!:    Phaser.GameObjects.Text
  private hudWave!:  Phaser.GameObjects.Text
  private hudCombo!: Phaser.GameObjects.Text
  private hudMsg!:   Phaser.GameObjects.Text
  private msgTimer:  Phaser.Time.TimerEvent | null = null

  private inspectorBg!:    Phaser.GameObjects.Graphics
  private inspectorText!:  Phaser.GameObjects.Text
  private inspectorLabel!: Phaser.GameObjects.Text
  private hoveredEnemy:    Enemy | null = null

  private locatorInputEl!: HTMLInputElement
  private locatorFeedback!: Phaser.GameObjects.Text

  private waveBtn!:      Phaser.GameObjects.Container
  private waveBtnLabel!: Phaser.GameObjects.Text
  private wavePending = false

  private baseHpGfx!: Phaser.GameObjects.Graphics

  constructor() { super('GameScene') }

  // ── LIFECYCLE ──────────────────────────────────────────────────────────────

  create() {
    this.enemies = []; this.towers = []; this.bullets = []
    this.baseHp = 100; this.xp = 0; this.combo = 0; this.maxCombo = 0

    this.cameras.main.fadeIn(400)

    const W = this.scale.width, H = this.scale.height

    this.buildMap()
    this.buildBase()
    this.placeTower()
    this.buildHUD(W, H)
    this.buildInspector()
    this.buildLocatorPanel(W, H)
    this.buildWaveButton(W, H)

    const level = LEVELS[LEVEL_INDEX]
    this.waveSystem = new WaveSystem(
      this, level.waves,
      id => this.spawnEnemy(id),
      ()  => this.onWaveEnd(),
      ()  => this.onAllWavesDone()
    )

    this.showMessage(`Ola 1 de 3 — escribe locators para atacar`, 4000, '#80cbc4')
    this.wavePending = true
    this.refreshWaveBtn()
  }

  // ── 2D FLAT MAP ────────────────────────────────────────────────────────────

  private buildMap() {
    const W = this.scale.width, H = this.scale.height
    const playY  = 44           // below HUD
    const playH  = H - 44 - 86  // above locator panel
    const gfx    = this.add.graphics().setDepth(0)

    // ── Grass background ────────────────────────────────────────────────────
    gfx.fillStyle(0x4a7c2f).fillRect(0, playY, W, playH)

    // Subtle grass stripes for texture
    gfx.fillStyle(0x3f6e28, 0.45)
    for (let xi = 0; xi < W; xi += 48) {
      gfx.fillRect(xi, playY, 22, playH)
    }

    // ── Path border (darker) ─────────────────────────────────────────────────
    const borderGfx = this.add.graphics().setDepth(1)
    borderGfx.fillStyle(0x7a5c32)
    this.drawPathSegments(borderGfx, PATH_W + 8)

    // ── Path fill (sandy dirt) ────────────────────────────────────────────────
    const pathGfx = this.add.graphics().setDepth(2)
    pathGfx.fillStyle(0xc4975a)
    this.drawPathSegments(pathGfx, PATH_W)

    // ── Path edge highlights (light top edge on horizontal, left on vertical) ─
    const edgeGfx = this.add.graphics().setDepth(3).setAlpha(0.25)
    edgeGfx.fillStyle(0xffdba0)
    this.drawPathEdges(edgeGfx, PATH_W)

    // ── Decorations ───────────────────────────────────────────────────────────
    for (const [dx, dy, frame, sc] of DECOS) {
      const spr = this.add.image(dx, dy, 'landscape', frame)
      spr.setScale(sc).setOrigin(0.5, 1.0).setDepth(dy)
    }
  }

  // Draws filled rectangles for each path segment.
  // Extends PW/2 past each endpoint so corners are fully covered by overlap.
  private drawPathSegments(gfx: Phaser.GameObjects.Graphics, pw: number) {
    const hw = pw / 2
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const p1 = PATH_POINTS[i], p2 = PATH_POINTS[i + 1]
      if (Math.abs(p1.y - p2.y) < 1) {
        // horizontal segment
        const xa = Math.min(p1.x, p2.x) - hw
        const xb = Math.max(p1.x, p2.x) + hw
        gfx.fillRect(xa, p1.y - hw, xb - xa, pw)
      } else {
        // vertical segment
        const ya = Math.min(p1.y, p2.y) - hw
        const yb = Math.max(p1.y, p2.y) + hw
        gfx.fillRect(p1.x - hw, ya, pw, yb - ya)
      }
    }
  }

  // Draws a thin highlight strip along the top/left edge of each path segment
  private drawPathEdges(gfx: Phaser.GameObjects.Graphics, pw: number) {
    const hw = pw / 2, ew = 4
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const p1 = PATH_POINTS[i], p2 = PATH_POINTS[i + 1]
      if (Math.abs(p1.y - p2.y) < 1) {
        const xa = Math.min(p1.x, p2.x)
        const xb = Math.max(p1.x, p2.x)
        gfx.fillRect(xa, p1.y - hw, xb - xa, ew)
      } else {
        const ya = Math.min(p1.y, p2.y)
        const yb = Math.max(p1.y, p2.y)
        gfx.fillRect(p1.x - hw, ya, ew, yb - ya)
      }
    }
  }

  // ── BASE ───────────────────────────────────────────────────────────────────

  private buildBase() {
    const { x, y } = BASE_POS

    const sprite = this.add.image(x, y - 12, 'towers-brown', 'tower_35.png')
    sprite.setScale(0.95).setDepth(y)

    this.add.text(x, y - 66, 'BASE', {
      fontSize: '9px', color: '#ffffff', fontFamily: '"JetBrains Mono", monospace', align: 'center',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(y + 1)

    this.baseHpGfx = this.add.graphics().setDepth(y + 2)
    this.redrawBaseHp()
  }

  private redrawBaseHp() {
    const { x, y } = BASE_POS
    this.baseHpGfx.clear()
    const pct = this.baseHp / 100
    const bw = 56, bx = x - bw / 2, by = y + 22
    this.baseHpGfx.fillStyle(0x000000, 0.6).fillRoundedRect(bx - 1, by - 1, bw + 2, 9, 3)
    const col = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xe3b341 : 0xf85149
    this.baseHpGfx.fillStyle(col).fillRoundedRect(bx, by, Math.floor(bw * pct), 7, 3)
  }

  // ── TOWER ──────────────────────────────────────────────────────────────────

  private placeTower() {
    const { x, y } = TOWER_POS
    const cfg   = TOWER_DEFS['css-tower']
    const tower = new Tower(this, x, y, cfg)
    tower.setDepth(y + 3)

    tower.on('pointerdown', () => this.selectTower(tower))
    tower.on('pointerover', () => { if (!tower.isSelected) tower.showRange(true) })
    tower.on('pointerout',  () => { if (!tower.isSelected) tower.showRange(false) })

    this.towers.push(tower)
    this.selectTower(tower)
  }

  private selectTower(t: Tower) {
    if (this.selectedTower && this.selectedTower !== t) this.selectedTower.select(false)
    this.selectedTower = t
    t.select(true)
    this.locatorInputEl?.focus()
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  private buildHUD(W: number, _H: number) {
    this.add.nineslice(0, 0, 'btn-grey', undefined, W, 44, 12, 12, 12, 12)
      .setOrigin(0, 0).setDepth(200).setAlpha(0.97)

    const t = (x: number, txt: string, col: string) =>
      this.add.text(x, 12, txt, {
        fontSize: '13px', color: col, fontFamily: '"JetBrains Mono", monospace',
        stroke: '#00000099', strokeThickness: 2
      }).setDepth(201)

    this.hudHp    = t(14,  '❤  HP: 100', '#ef5350')
    this.hudXp    = t(160, '⭐ XP: 0',   '#ffd54f')
    this.hudWave  = t(306, 'Ola: 1 / 3', '#80cbc4')
    this.hudCombo = t(456, 'COMBO ×0',   '#ce93d8')

    this.hudMsg = this.add.text(W / 2, 22, '', {
      fontSize: '11px', color: '#ffffff', fontFamily: '"JetBrains Mono", monospace', align: 'center',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(202).setVisible(false)

    // Locator type legend (right side of HUD)
    this.add.text(W - 14, 22,
      '#id  .class  [attr]  role  text  label',
      { fontSize: '9px', color: '#484f58', fontFamily: '"JetBrains Mono", monospace' }
    ).setOrigin(1, 0.5).setDepth(201)
  }

  // ── INSPECTOR ──────────────────────────────────────────────────────────────

  private buildInspector() {
    this.inspectorBg    = this.add.graphics().setDepth(160).setVisible(false)
    this.inspectorLabel = this.add.text(0, 0, '', {
      fontSize: '8px', color: '#80cbc4cc', fontFamily: '"JetBrains Mono", monospace'
    }).setDepth(161).setVisible(false)
    this.inspectorText  = this.add.text(0, 0, '', {
      fontSize: '10px', color: '#e6edf3', fontFamily: '"JetBrains Mono", monospace', lineSpacing: 3
    }).setDepth(161).setVisible(false)
  }

  private showInspector(enemy: Enemy) {
    this.hoveredEnemy = enemy
    const W = this.scale.width
    const d = enemy.domData.domNode
    const pw = 330, ph = 150
    const px = Math.min(enemy.x + 36, W - pw - 8)
    const py = Math.max(enemy.y - ph - 10, 50)

    const attrsStr = Object.entries(d.attrs).map(([k, v]) => `  ${k}="${v}"`).join('\n')
    const content =
      `// DevTools · Elements\n\n` +
      enemy.getDomHtml() + '\n\n' +
      `id:    ${d.id ? `"${d.id}"` : '—'}\n` +
      `class: [${d.classes.map(c => `"${c}"`).join(', ')}]\n` +
      `role:  "${d.role ?? 'implicit'}"\n` +
      (d.ariaLabel ? `aria:  "${d.ariaLabel}"\n` : '') +
      attrsStr

    this.inspectorBg.clear()
      .fillStyle(0x1c2128, 0.97).fillRoundedRect(px, py, pw, ph, 6)
      .lineStyle(1, 0x30363d).strokeRoundedRect(px, py, pw, ph, 6)
      .fillStyle(0x0d1117).fillRect(px + 1, py + 1, pw - 2, 20)
      .lineStyle(1, 0x30363d, 0.5).lineBetween(px, py + 21, px + pw, py + 21)
      .setVisible(true)

    this.inspectorLabel
      .setPosition(px + 8, py + 5)
      .setText('Elements  |  Console  |  Network')
      .setVisible(true)

    this.inspectorText
      .setPosition(px + 8, py + 28)
      .setText(content)
      .setVisible(true)
  }

  private hideInspector() {
    this.hoveredEnemy = null
    this.inspectorBg.setVisible(false)
    this.inspectorLabel.setVisible(false)
    this.inspectorText.setVisible(false)
  }

  // ── LOCATOR PANEL ──────────────────────────────────────────────────────────

  private buildLocatorPanel(W: number, H: number) {
    const PH = 86, PY = H - PH

    this.add.nineslice(0, PY, 'btn-grey', undefined, W, PH, 12, 12, 12, 12)
      .setOrigin(0, 0).setDepth(200).setAlpha(0.97)

    this.add.text(14, PY + 8, 'Torre CSS  ·  escribe un locator y presiona Enter:', {
      fontSize: '10px', color: '#80cbc4', fontFamily: '"JetBrains Mono", monospace',
      stroke: '#000', strokeThickness: 2
    }).setDepth(201)

    // HTML <input> overlaid on canvas
    const container = document.getElementById('game-container')!
    container.style.position = 'relative'

    this.locatorInputEl = document.createElement('input')
    this.locatorInputEl.type        = 'text'
    this.locatorInputEl.placeholder = `#user-name  |  .form-input  |  [type="text"]  |  getByRole('button',{name:'Login'})`
    this.locatorInputEl.spellcheck  = false
    this.locatorInputEl.autocomplete = 'off'
    Object.assign(this.locatorInputEl.style, {
      position: 'absolute',
      left: '8px',
      bottom: `${PH - 38}px`,
      width: `${W - 148}px`,
      height: '30px',
      background: '#161b22',
      border: '1.5px solid #30363d',
      borderRadius: '4px',
      color: '#e6edf3',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '12px',
      padding: '0 10px',
      outline: 'none',
      zIndex: '999',
      transition: 'border-color 0.15s',
    })
    container.appendChild(this.locatorInputEl)

    this.locatorInputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter')  this.fireLocator()
      if (e.key === 'Escape') this.locatorInputEl.blur()
    })
    this.locatorInputEl.addEventListener('focus', () => this.input.keyboard?.disableGlobalCapture())
    this.locatorInputEl.addEventListener('blur',  () => this.input.keyboard?.enableGlobalCapture())

    // Fire button
    this.kenBtn(W - 68, PY + 44, 120, 34, 'btn-green', '⚡ Disparar', () => this.fireLocator(), 201)

    this.locatorFeedback = this.add.text(14, H - 16, '', {
      fontSize: '10px', color: '#80cbc4', fontFamily: '"JetBrains Mono", monospace',
      stroke: '#000', strokeThickness: 2
    }).setDepth(201)

    // Hint
    this.add.text(14, PY - 18, '🔍 Hover sobre un enemigo para ver su HTML', {
      fontSize: '9px', color: '#484f58', fontFamily: '"JetBrains Mono", monospace'
    }).setDepth(199)
  }

  // ── WAVE BUTTON ────────────────────────────────────────────────────────────

  private buildWaveButton(W: number, H: number) {
    const cx = W / 2, cy = H / 2
    this.waveBtn = this.add.container(cx, cy).setDepth(300)

    const bg = this.add.nineslice(0, 0, 'btn-blue', undefined, 220, 56, 12, 12, 12, 12)
      .setOrigin(0.5)
    this.waveBtnLabel = this.add.text(0, 0, '▶  Iniciar Ola 1', {
      fontSize: '17px', color: '#ffffff', fontFamily: '"JetBrains Mono", monospace', align: 'center',
      stroke: '#00000099', strokeThickness: 2
    }).setOrigin(0.5)

    this.waveBtn.add([bg, this.waveBtnLabel])
    this.waveBtn.setSize(220, 56).setInteractive()
    this.waveBtn.on('pointerdown', () => { this.playSound('sfx-wave'); this.startWave() })
    this.waveBtn.on('pointerover', () => this.waveBtn.setScale(1.06))
    this.waveBtn.on('pointerout',  () => this.waveBtn.setScale(1.0))
  }

  private refreshWaveBtn() {
    if (this.wavePending) {
      const n = this.waveSystem ? this.waveSystem.waveNumber : 1
      this.waveBtnLabel.setText(`▶  Iniciar Ola ${n}`)
      this.waveBtn.setVisible(true)
    } else {
      this.waveBtn.setVisible(false)
    }
  }

  private startWave() {
    if (!this.wavePending) return
    this.wavePending = false
    this.waveBtn.setVisible(false)
    this.waveSystem.startWave()
    this.hudWave.setText(`Ola: ${this.waveSystem.waveNumber} / ${this.waveSystem.totalWaves}`)
  }

  // ── SPAWN ──────────────────────────────────────────────────────────────────

  private spawnEnemy(dataId: string): Enemy {
    const data  = ENEMY_DEFS[dataId]
    const enemy = new Enemy(this, data, [...PATH_POINTS.map(p => p.clone())])

    enemy.setInteractive(
      new Phaser.Geom.Rectangle(-22, -28, 44, 56),
      Phaser.Geom.Rectangle.Contains
    )
    enemy.on('pointerover', () => this.showInspector(enemy))
    enemy.on('pointerout',  () => this.hideInspector())

    this.enemies.push(enemy)
    return enemy
  }

  // ── LOCATOR LOGIC ──────────────────────────────────────────────────────────

  private fireLocator() {
    const input = this.locatorInputEl.value.trim()
    if (!input || !this.selectedTower) return

    const living = this.enemies.filter(e => e.alive)
    if (!living.length) { this.showFeedback('No hay enemigos activos.', '#666'); return }

    const allDoms: DomElement[] = living.map(e => e.domData.domNode)
    const target = (this.hoveredEnemy?.alive ? this.hoveredEnemy : null)
      ?? living.reduce((a, b) => a.pathIndex > b.pathIndex ? a : b)

    const result = evaluateLocator(input, target.domData.domNode, allDoms)

    if (result.matched) {
      const matched = living.filter(e => evaluateLocator(input, e.domData.domNode, allDoms).matched)
      for (const e of matched) this.bullets.push(this.selectedTower.fireAt(e, result.damage))

      this.playSound('sfx-fire')
      this.combo++
      if (this.combo > this.maxCombo) this.maxCombo = this.combo
      const comboCol = this.combo >= 5 ? '#f44336' : this.combo >= 3 ? '#ff9800' : '#ce93d8'
      this.hudCombo.setText(`COMBO ×${this.combo}`).setColor(comboCol)
      if (this.combo === 3) this.playSound('sfx-combo')

      const bonusTxt = result.isUnique ? ` · único +20%` : ` · splash ×${matched.length}`
      this.showFeedback(`✓  ${result.message}  [DMG ${result.damage}${bonusTxt}]`, result.isUnique ? '#3fb950' : '#ffc107')
      this.inputBorder('#2ea043', '#30363d', 500)
      this.locatorInputEl.value = ''
    } else {
      this.combo = 0
      this.hudCombo.setText('COMBO ×0').setColor('#ce93d8')
      this.playSound('sfx-miss')
      this.showFeedback(`✗  ${result.message}`, '#f85149')
      this.inputBorder('#f85149', '#30363d', 600)
    }
  }

  // ── MAIN LOOP ──────────────────────────────────────────────────────────────

  update(_t: number, delta: number) {
    const wasAlive = new Set(this.enemies.filter(e => e.alive))

    for (const e of this.enemies) {
      if (!e.alive || !e.scene) continue
      e.update(delta)
      e.setDepth(e.y + 2)  // depth by Y position (lower = in front)

      if (e.hasReachedEnd()) {
        this.baseHp = Math.max(0, this.baseHp - 20)
        this.hudHp.setText(`❤  HP: ${this.baseHp}`)
        if (this.baseHp <= 50) this.hudHp.setColor('#ff9800')
        if (this.baseHp <= 25) this.hudHp.setColor('#f85149')
        this.redrawBaseHp()
        e.alive = false
        e.destroy()
        this.waveSystem.notifyEnemyRemoved(e)
        if (this.baseHp <= 0) { this.showGameOver(); return }
      }
    }

    this.bullets = this.bullets.filter(b => b.active_bullet)
    for (const b of this.bullets) {
      const r = b.update(delta)
      if (r === 'hit')    this.playSound('sfx-hit')
      if (r === 'killed') this.playSound('sfx-kill')
    }

    for (const e of wasAlive) {
      if (!e.alive) {
        this.xp += e.xpValue * (this.combo >= 3 ? 2 : 1)
        this.hudXp.setText(`⭐ XP: ${this.xp}`)
        this.waveSystem.notifyEnemyRemoved(e)
      }
    }

    this.enemies = this.enemies.filter(e => e.alive && !!e.scene)
  }

  // ── WAVE EVENTS ────────────────────────────────────────────────────────────

  private onWaveEnd() {
    this.showMessage('¡Ola completada! 🎉  Prepárate...', 2500, '#4caf50')
    this.enemies = this.enemies.filter(e => e.alive && !!e.scene)
    if (!this.waveSystem.isLastWave) {
      this.wavePending = true
      this.waveBtnLabel.setText(`▶  Iniciar Ola ${this.waveSystem.waveNumber + 1}`)
      this.waveBtn.setVisible(true)
    }
  }

  private onAllWavesDone() {
    this.showMessage('¡NIVEL 1 COMPLETADO!  🏆', 5000, '#ffd54f')
    this.time.delayedCall(5200, () => this.showVictoryScreen())
  }

  // ── END SCREENS ────────────────────────────────────────────────────────────

  private showVictoryScreen() {
    const W = this.scale.width, H = this.scale.height
    const overlay = this.add.graphics().setDepth(500)
    overlay.fillStyle(0x000000, 0.82).fillRect(0, 0, W, H)

    const panel = this.add.graphics().setDepth(501)
    panel.fillStyle(0x161b22).fillRoundedRect(W / 2 - 300, H / 2 - 160, 600, 320, 10)
    panel.lineStyle(2, 0x238636).strokeRoundedRect(W / 2 - 300, H / 2 - 160, 600, 320, 10)

    this.add.text(W / 2, H / 2 - 130, '🏆  NIVEL 1 COMPLETADO', {
      fontSize: '26px', color: '#ffd54f', fontFamily: '"JetBrains Mono", monospace', align: 'center',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(502)

    this.add.text(W / 2, H / 2 - 92, `XP total: ${this.xp}   ·   Combo máximo: ×${this.maxCombo}`, {
      fontSize: '13px', color: '#8b949e', fontFamily: '"JetBrains Mono", monospace'
    }).setOrigin(0.5).setDepth(502)

    this.add.text(W / 2, H / 2 - 62, '─── Lo que aprendiste ───', {
      fontSize: '11px', color: '#58a6ff', fontFamily: '"JetBrains Mono", monospace'
    }).setOrigin(0.5).setDepth(502)

    this.add.text(W / 2, H / 2 - 10,
      '#user-name      → selector de ID — uno único por página\n' +
      '#password       → cada id="" es irrepetible en el DOM\n' +
      '#login-button   → Playwright: page.locator(\'#id\')\n\n' +
      'Tip: getByRole() es el locator más robusto en tests reales.',
      {
        fontSize: '12px', color: '#a5d6a7', fontFamily: '"JetBrains Mono", monospace',
        align: 'center', lineSpacing: 8
      }
    ).setOrigin(0.5).setDepth(502)

    this.kenBtn(W / 2 - 120, H / 2 + 110, 200, 46, 'btn-grey',  '← Menú',         () => this.goToMenu(),     502)
    this.kenBtn(W / 2 + 120, H / 2 + 110, 200, 46, 'btn-green', '↺  Jugar de nuevo', () => this.restartScene(), 502)
  }

  private showGameOver() {
    const W = this.scale.width, H = this.scale.height
    this.add.graphics().setDepth(500).fillStyle(0x000000, 0.85).fillRect(0, 0, W, H)

    const panel = this.add.graphics().setDepth(501)
    panel.fillStyle(0x161b22).fillRoundedRect(W / 2 - 260, H / 2 - 110, 520, 220, 10)
    panel.lineStyle(2, 0xf85149).strokeRoundedRect(W / 2 - 260, H / 2 - 110, 520, 220, 10)

    this.add.text(W / 2, H / 2 - 78, '💀  GAME OVER', {
      fontSize: '30px', color: '#f85149', fontFamily: '"JetBrains Mono", monospace',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(502)

    this.add.text(W / 2, H / 2 - 28,
      'La base fue destruida.\nPractica tus locators e inténtalo otra vez.', {
        fontSize: '13px', color: '#8b949e', fontFamily: '"JetBrains Mono", monospace', align: 'center', lineSpacing: 6
      }).setOrigin(0.5).setDepth(502)

    this.kenBtn(W / 2 - 110, H / 2 + 56, 190, 46, 'btn-grey',  '← Tutorial',    () => this.goToMenu(),     502)
    this.kenBtn(W / 2 + 110, H / 2 + 56, 190, 46, 'btn-red',   '↺  Reintentar', () => this.restartScene(), 502)
  }

  // ── UTILITIES ──────────────────────────────────────────────────────────────

  private kenBtn(
    cx: number, cy: number, w: number, h: number,
    tex: string, label: string, onClick: () => void, depth = 201
  ) {
    const ns = this.add.nineslice(cx, cy, tex, undefined, w, h, 12, 12, 12, 12)
      .setOrigin(0.5).setDepth(depth).setInteractive()
    ns.on('pointerdown', onClick)
    ns.on('pointerover', () => ns.setScale(1.05))
    ns.on('pointerout',  () => ns.setScale(1.0))
    this.add.text(cx, cy, label, {
      fontSize: '13px', color: '#fff', fontFamily: '"JetBrains Mono", monospace', align: 'center',
      stroke: '#00000077', strokeThickness: 2
    }).setOrigin(0.5).setDepth(depth + 1)
    return ns
  }

  private inputBorder(immediate: string, delayed: string, ms: number) {
    this.locatorInputEl.style.borderColor = immediate
    this.time.delayedCall(ms, () => { this.locatorInputEl.style.borderColor = delayed })
  }

  private showFeedback(msg: string, color = '#80cbc4') {
    this.locatorFeedback.setText(msg).setColor(color)
  }

  private showMessage(msg: string, duration = 2500, color = '#ffffff') {
    if (this.msgTimer) this.msgTimer.destroy()
    this.hudMsg.setText(msg).setColor(color).setVisible(true)
    this.msgTimer = this.time.delayedCall(duration, () => this.hudMsg.setVisible(false))
  }

  private playSound(key: string) {
    try { this.sound.play(key, { volume: 0.5 }) } catch (_) {}
  }

  private goToMenu() {
    this.cleanup()
    this.cameras.main.fadeOut(280)
    this.time.delayedCall(300, () => this.scene.start('TutorialScene'))
  }

  private restartScene() {
    this.cleanup()
    this.scene.restart()
  }

  private cleanup() {
    document.querySelector('#game-container input')?.remove()
  }

  shutdown() { this.cleanup() }
}
