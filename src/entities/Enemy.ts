import Phaser from 'phaser'
import type { EnemyData } from '../types'

// Maps enemy data ID → robot color + animation key
const ENEMY_ANIM: Record<string, { animKey: string; tint: number }> = {
  'input-username': { animKey: 'walk-blue',   tint: 0x4fc3f7 },
  'input-password': { animKey: 'walk-blue',   tint: 0x81d4fa },
  'button-login':   { animKey: 'walk-red',    tint: 0xef9a9a },
}

const FALLBACK_ANIM = { animKey: 'walk-yellow', tint: 0xffd54f }

export class Enemy extends Phaser.GameObjects.Container {
  domData: EnemyData
  currentHp: number
  maxHp: number
  speed: number
  pathPoints: Phaser.Math.Vector2[]
  pathIndex: number = 0
  alive: boolean = true
  xpValue: number

  private robotSprite: Phaser.GameObjects.Sprite
  private hpBar: Phaser.GameObjects.Graphics
  private tagLabel: Phaser.GameObjects.Text
  private lastDirX: number = 1  // +1 = right, -1 = left

  constructor(scene: Phaser.Scene, data: EnemyData, path: Phaser.Math.Vector2[]) {
    super(scene, path[0].x, path[0].y)

    this.domData = data
    this.currentHp = data.hp
    this.maxHp = data.hp
    this.speed = data.speed
    this.pathPoints = path
    this.xpValue = data.xp

    const { animKey, tint } = ENEMY_ANIM[data.id] ?? FALLBACK_ANIM

    // Robot sprite from atlas
    this.robotSprite = scene.add.sprite(0, 4, 'robots')
    this.robotSprite.setScale(0.24)
    this.robotSprite.setTint(tint)
    this.robotSprite.play(animKey)

    // Tag label below robot
    const tagText = `<${data.domNode.tag}>`
    this.tagLabel = scene.add.text(0, 26, tagText, {
      fontSize: '8px',
      color: '#cccccc',
      fontFamily: '"JetBrains Mono", monospace',
      align: 'center',
      backgroundColor: '#00000066',
      padding: { x: 2, y: 1 }
    }).setOrigin(0.5)

    // HP bar
    this.hpBar = scene.add.graphics()
    this.updateHpBar()

    this.add([this.robotSprite, this.tagLabel, this.hpBar])
    scene.add.existing(this)
    this.setDepth(10)
  }

  takeDamage(amount: number): boolean {
    this.currentHp = Math.max(0, this.currentHp - amount)
    this.updateHpBar()

    // Flash white on hit
    this.robotSprite.setTint(0xffffff)
    this.scene.time.delayedCall(80, () => {
      const { tint } = ENEMY_ANIM[this.domData.id] ?? FALLBACK_ANIM
      if (this.alive) this.robotSprite.setTint(tint)
    })

    if (this.currentHp <= 0) this.alive = false
    return !this.alive
  }

  private updateHpBar() {
    this.hpBar.clear()
    const w = 36
    const pct = this.currentHp / this.maxHp
    this.hpBar.fillStyle(0x222222, 0.8)
    this.hpBar.fillRect(-w / 2, -26, w, 4)
    const col = pct > 0.5 ? 0x4caf50 : pct > 0.25 ? 0xffc107 : 0xf44336
    this.hpBar.fillStyle(col, 1)
    this.hpBar.fillRect(-w / 2, -26, Math.floor(w * pct), 4)
  }

  update(delta: number) {
    if (!this.alive) return
    if (this.pathIndex >= this.pathPoints.length - 1) return

    const target = this.pathPoints[this.pathIndex + 1]
    const dx = target.x - this.x
    const dy = target.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const move = this.speed * (delta / 1000)

    // Flip sprite to face movement direction
    if (Math.abs(dx) > 2) {
      const newDir = dx > 0 ? 1 : -1
      if (newDir !== this.lastDirX) {
        this.lastDirX = newDir
        this.robotSprite.setFlipX(newDir < 0)
      }
    }

    if (move >= dist) {
      this.x = target.x
      this.y = target.y
      this.pathIndex++
    } else {
      this.x += (dx / dist) * move
      this.y += (dy / dist) * move
    }
  }

  hasReachedEnd(): boolean {
    return this.pathIndex >= this.pathPoints.length - 1
  }

  getDomHtml(): string {
    const d = this.domData.domNode
    let attrs = ''
    if (d.id) attrs += ` id="${d.id}"`
    if (d.classes.length) attrs += ` class="${d.classes.join(' ')}"`
    for (const [k, v] of Object.entries(d.attrs)) attrs += ` ${k}="${v}"`
    const inner = d.text ?? ''
    if (d.tag === 'input') return `<${d.tag}${attrs}>`
    return `<${d.tag}${attrs}>${inner}</${d.tag}>`
  }

  die() {
    this.alive = false
    // Death spin + fade
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      angle: 360,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 350,
      ease: 'Power2',
      onComplete: () => { if (this.scene) this.destroy() }
    })
  }
}
