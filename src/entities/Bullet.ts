import Phaser from 'phaser'
import type { Enemy } from './Enemy'

export class Bullet extends Phaser.GameObjects.Image {
  private target: Enemy
  speed: number = 500
  damage: number
  active_bullet: boolean = true
  onKill?: () => void
  onHit?: () => void

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: Enemy,
    damage: number,
    _color: number = 0xffeb3b,
    heavy: boolean = false
  ) {
    super(scene, x, y, heavy ? 'bullet-heavy' : 'bullet')
    this.target = target
    this.damage = damage
    this.setScale(heavy ? 0.35 : 0.28)
    this.setDepth(20)
    scene.add.existing(this)
  }

  update(delta: number): 'killed' | 'hit' | 'flying' | 'done' {
    if (!this.active_bullet) return 'done'
    if (!this.target?.alive) {
      this.active_bullet = false
      this.destroy()
      return 'done'
    }

    const dx = this.target.x - this.x
    const dy = this.target.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const move = this.speed * (delta / 1000)

    // Point bullet toward target
    this.setRotation(Math.atan2(dy, dx))

    if (move >= dist) {
      const killed = this.target.takeDamage(this.damage)
      this.active_bullet = false
      this.destroy()
      if (killed) {
        this.target.die()
        return 'killed'
      }
      return 'hit'
    }

    this.x += (dx / dist) * move
    this.y += (dy / dist) * move
    return 'flying'
  }
}
