import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { TutorialScene } from './scenes/TutorialScene'
import { GameScene } from './scenes/GameScene'

// Render at device pixel ratio → sharp on Retina / HiDPI screens
const DPR = window.devicePixelRatio || 1

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width:  960,
  height: 540,
  backgroundColor: '#0d1117',
  parent: 'game-container',
  scene: [BootScene, TutorialScene, GameScene],

  // Sharp rendering
  antialias:    true,
  antialiasGL:  true,
  roundPixels:  false,
  pixelArt:     false,

  audio: { disableWebAudio: false },

  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Render the canvas at physical pixel density so it's sharp when CSS scales it
    zoom: DPR,
    width:  960,
    height: 540,
  },
}

const game = new Phaser.Game(config)

// After Phaser sets up the canvas, undo the zoom CSS so the canvas stays at
// its logical size — the DPR zoom made the internal buffer bigger, not the
// displayed canvas.
game.events.once(Phaser.Core.Events.READY, () => {
  const canvas = game.canvas
  canvas.style.width  = '960px'
  canvas.style.height = '540px'
})
