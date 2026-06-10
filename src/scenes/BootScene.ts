import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene') }

  preload() {
    const W = this.scale.width
    const H = this.scale.height

    // ── Loading screen ────────────────────────────────────────────────────
    this.add.graphics()
      .fillStyle(0x0f0f1a, 1).fillRect(0, 0, W, H)

    const barBg = this.add.graphics()
      .fillStyle(0x1a1a2e, 1)
      .fillRoundedRect(W / 2 - 180, H / 2 - 12, 360, 24, 8)

    const bar = this.add.graphics()
    const loadTxt = this.add.text(W / 2, H / 2 - 50, 'QA TOWER DEFENSE', {
      fontSize: '24px', color: '#4fc3f7', fontFamily: '"JetBrains Mono", monospace', align: 'center'
    }).setOrigin(0.5)
    const pctTxt = this.add.text(W / 2, H / 2 + 28, 'Cargando…', {
      fontSize: '11px', color: '#555', fontFamily: '"JetBrains Mono", monospace'
    }).setOrigin(0.5)

    void barBg

    this.load.on('progress', (v: number) => {
      bar.clear()
        .fillStyle(0x4fc3f7, 1)
        .fillRoundedRect(W / 2 - 180, H / 2 - 12, 360 * v, 24, 8)
      pctTxt.setText(`Cargando… ${Math.floor(v * 100)}%`)
    })
    this.load.on('complete', () => {
      loadTxt.setColor('#4caf50')
      pctTxt.setText('¡Todo listo!')
    })

    // ── Robots (enemies) ──────────────────────────────────────────────────
    this.load.atlasXML('robots',
      'assets/sprites/spritesheet_robotsSide.png',
      'assets/sprites/spritesheet_robotsSide.xml')

    // ── Landscape tiles ───────────────────────────────────────────────────
    this.load.atlasXML('landscape',
      'assets/sprites/landscape.png',
      'assets/sprites/landscape.xml')

    // ── Tower atlases ─────────────────────────────────────────────────────
    this.load.atlasXML('towers-grey',
      'assets/sprites/towers-grey.png',
      'assets/sprites/towers-grey.xml')
    this.load.atlasXML('towers-brown',
      'assets/sprites/towers-brown.png',
      'assets/sprites/towers-brown.xml')
    this.load.atlasXML('towers-red',
      'assets/sprites/towers-red.png',
      'assets/sprites/towers-red.xml')

    // ── UI buttons (NineSlice) ────────────────────────────────────────────
    this.load.image('btn-blue',   'assets/sprites/ui/btn-blue.png')
    this.load.image('btn-green',  'assets/sprites/ui/btn-green.png')
    this.load.image('btn-grey',   'assets/sprites/ui/btn-grey.png')
    this.load.image('btn-red',    'assets/sprites/ui/btn-red.png')
    this.load.image('input-bg',   'assets/sprites/ui/input-bg.png')

    // ── Bullets ───────────────────────────────────────────────────────────
    this.load.image('bullet',       'assets/sprites/bullet.png')
    this.load.image('bullet-heavy', 'assets/sprites/bullet-heavy.png')

    // ── Audio ─────────────────────────────────────────────────────────────
    this.load.audio('sfx-fire',  'assets/audio/sfx-fire.ogg')
    this.load.audio('sfx-miss',  'assets/audio/sfx-miss.ogg')
    this.load.audio('sfx-hit',   'assets/audio/sfx-hit.ogg')
    this.load.audio('sfx-kill',  'assets/audio/sfx-kill.ogg')
    this.load.audio('sfx-combo', 'assets/audio/sfx-combo.ogg')
    this.load.audio('sfx-wave',  'assets/audio/sfx-wave.ogg')
  }

  create() {
    // ── Robot walk animations ─────────────────────────────────────────────
    const anims = [
      { key: 'walk-blue',   f1: 'robot_blueDrive1.png',   f2: 'robot_blueDrive2.png'   },
      { key: 'walk-red',    f1: 'robot_redDrive1.png',    f2: 'robot_redDrive2.png'    },
      { key: 'walk-yellow', f1: 'robot_yellowDrive1.png', f2: 'robot_yellowDrive2.png' },
      { key: 'walk-green',  f1: 'robot_greenDrive1.png',  f2: 'robot_greenDrive2.png'  },
    ]
    for (const a of anims) {
      if (!this.anims.exists(a.key)) {
        this.anims.create({
          key: a.key,
          frames: [
            { key: 'robots', frame: a.f1 },
            { key: 'robots', frame: a.f2 },
          ],
          frameRate: 5,
          repeat: -1
        })
      }
    }

    this.time.delayedCall(200, () => this.scene.start('TutorialScene'))
  }
}
