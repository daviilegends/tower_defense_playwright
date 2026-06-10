import type { WaveConfig } from '../types'
import { ENEMY_DEFS } from '../data/enemies'
import type { Enemy } from '../entities/Enemy'

export type SpawnCallback = (dataId: string) => Enemy

export class WaveSystem {
  private waves: WaveConfig[]
  private currentWave: number = 0
  private spawnTimers: Phaser.Time.TimerEvent[] = []
  private scene: Phaser.Scene
  private spawnCb: SpawnCallback
  private onWaveEnd: () => void
  private onAllDone: () => void
  private pendingSpawns: number = 0
  private activeEnemies: Set<Enemy> = new Set()
  running: boolean = false

  constructor(
    scene: Phaser.Scene,
    waves: WaveConfig[],
    spawnCb: SpawnCallback,
    onWaveEnd: () => void,
    onAllDone: () => void
  ) {
    this.scene = scene
    this.waves = waves
    this.spawnCb = spawnCb
    this.onWaveEnd = onWaveEnd
    this.onAllDone = onAllDone
  }

  startWave() {
    if (this.currentWave >= this.waves.length) {
      this.onAllDone()
      return
    }
    this.running = true
    const wave = this.waves[this.currentWave]
    this.pendingSpawns = wave.enemies.length
    this.activeEnemies.clear()

    for (const entry of wave.enemies) {
      const timer = this.scene.time.delayedCall(entry.delay, () => {
        const enemy = this.spawnCb(entry.dataId)
        this.activeEnemies.add(enemy)
      })
      this.spawnTimers.push(timer)
    }
  }

  notifyEnemyRemoved(enemy: Enemy) {
    this.activeEnemies.delete(enemy)
    this.checkWaveComplete()
  }

  private checkWaveComplete() {
    if (!this.running) return
    // Wave done when all spawned and all dead/escaped
    const allSpawned = this.spawnTimers.every(t => !t.hasDispatched === false || t.getProgress() >= 1)
    const allGone = this.activeEnemies.size === 0

    if (allGone && this.currentWave < this.waves.length) {
      // small delay to check if spawns are still pending
      this.scene.time.delayedCall(200, () => {
        if (this.activeEnemies.size === 0) {
          this.currentWave++
          this.running = false
          this.spawnTimers = []
          this.onWaveEnd()
        }
      })
    }
  }

  get waveNumber() { return this.currentWave + 1 }
  get totalWaves() { return this.waves.length }
  get isLastWave() { return this.currentWave >= this.waves.length - 1 }
}
