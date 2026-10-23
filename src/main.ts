import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY } from './config'
import { BootScene } from './scenes/BootScene'
import { EndScene } from './scenes/EndScene'
import { GameScene } from './scenes/GameScene'
import { IntroScene } from './scenes/IntroScene'
import { UIScene } from './scenes/UIScene'

/**
 * Landscape game that scales to fit the tablet or the browser window.
 * FIT keeps the whole 1280×720 view visible. CENTER_BOTH letterboxes it.
 * The width is greater than the height, which is the landscape layout.
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#87ceeb',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  input: {
    // Mouse + a few fingers: stick and Jump at the same time.
    activePointers: 4,
  },
  scene: [BootScene, IntroScene, GameScene, UIScene, EndScene],
}

const game = new Phaser.Game(config)

declare global {
  interface Window {
    game?: Phaser.Game
  }
}

// Landscape is the Scale Manager default, and the game canvas is wider than it is tall.
// Setting it explicitly matches a tablet held sideways.
game.scale.orientation = Phaser.Scale.Orientation.LANDSCAPE

// Handy while learning: in the browser console, `game` is this instance.
window.game = game
