import Phaser from 'phaser'
import { Bullet } from './Bullet'
import type { Enemy } from './Enemy'

export interface TowerConfig {
  id: string
  name: string
  symbol: string      // short label shown under tower
  color: number
  range: number
  fireRate: number
  atlasKey: string    // texture atlas key
  frameKey: string    // frame inside atlas
  spriteScale: number
  bulletHeavy?: boolean
  locatorTypes: string[]
}

export const TOWER_DEFS: Record<string, TowerConfig> = {
  'css-tower': {
    id: 'css-tower',
    name: 'CSS Tower',
    symbol: '#{  }',
    color: 0x80cbc4,
    range: 170,
    fireRate: 1500,
    atlasKey: 'towers-grey',
    frameKey: 'tower_51.png',
    spriteScale: 0.85,
    locatorTypes: ['id', 'class', 'tag', 'attr']
  },
  'attr-tower': {
    id: 'attr-tower',
    name: 'Attribute Tower',
    symbol: '[  ]',
    color: 0xffcc80,
    range: 210,
    fireRate: 1200,
    atlasKey: 'towers-brown',
    frameKey: 'tower_40.png',
    spriteScale: 0.85,
    bulletHeavy: true,
    locatorTypes: ['attr', 'role', 'text', 'label']
  }
}

export class Tower extends Phaser.GameObjects.Container {
  config: TowerConfig
  private cooldown: number = 0
  private rangeGfx: Phaser.GameObjects.Graphics
  private shadowGfx: Phaser.GameObjects.Graphics
  private towerSprite: Phaser.GameObjects.Image
  private selectionGfx: Phaser.GameObjects.Graphics
  private labelText: Phaser.GameObjects.Text
  isSelected: boolean = false

  constructor(scene: Phaser.Scene, x: number, y: number, config: TowerConfig) {
    super(scene, x, y)
    this.config = config

    // Layered from back to front
    this.rangeGfx    = scene.add.graphics()
    this.shadowGfx   = scene.add.graphics()
    this.towerSprite = scene.add.image(0, 0, config.atlasKey, config.frameKey)
    this.selectionGfx = scene.add.graphics()
    this.labelText   = scene.add.text(0, 0, config.symbol, {
      fontSize: '9px', color: '#ffffffcc',
      fontFamily: '"JetBrains Mono", monospace', align: 'center',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5)

    this.towerSprite.setScale(config.spriteScale)

    // Position shadow slightly offset for depth illusion
    this.shadowGfx.fillStyle(0x000000, 0.25)
    this.shadowGfx.fillEllipse(4, 18, 52, 16)

    // Label below tower
    const spriteH = (this.towerSprite.height * config.spriteScale) / 2
    this.labelText.setY(spriteH + 8)

    this.add([this.rangeGfx, this.shadowGfx, this.towerSprite, this.selectionGfx, this.labelText])
    scene.add.existing(this)
    this.setDepth(20)
    this.setSize(56, 56)
    this.setInteractive()
  }

  select(on: boolean) {
    this.isSelected = on
    this.selectionGfx.clear()
    if (on) {
      // Glowing ring
      this.selectionGfx.lineStyle(3, this.config.color, 0.9)
      this.selectionGfx.strokeCircle(0, 0, 32)
      this.selectionGfx.lineStyle(1, 0xffffff, 0.3)
      this.selectionGfx.strokeCircle(0, 0, 29)
    }
    this.showRange(on)
  }

  showRange(show: boolean) {
    this.rangeGfx.clear()
    if (show) {
      this.rangeGfx.lineStyle(1, this.config.color, 0.35)
      this.rangeGfx.strokeCircle(0, 0, this.config.range)
      this.rangeGfx.fillStyle(this.config.color, 0.06)
      this.rangeGfx.fillCircle(0, 0, this.config.range)
    }
  }

  fireAt(enemy: Enemy, damage: number): Bullet {
    this.cooldown = this.config.fireRate * 0.5
    return new Bullet(
      this.scene, this.x, this.y,
      enemy, damage, this.config.color, this.config.bulletHeavy
    )
  }
}
