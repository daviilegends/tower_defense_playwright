import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { TutorialScene } from './scenes/TutorialScene'
import { GameScene } from './scenes/GameScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width:  960,
  height: 540,
  backgroundColor: '#0d1117',
  parent: 'game-container',
  scene: [BootScene, TutorialScene, GameScene],

  antialias:   true,
  antialiasGL: true,
  roundPixels: false,
  pixelArt:    false,

  audio: { disableWebAudio: false },

  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

new Phaser.Game(config)
