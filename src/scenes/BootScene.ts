import Phaser from 'phaser'
import { createPlaceholderTextures } from '../assets/placeholderArt'
import { SCENES } from '../config'

/**
 * First scene. It puts every picture into the texture cache under a fixed key,
 * then opens the intro screen.
 *
 * The pictures are drawn in code so the game runs with nothing in public/assets.
 * To use real files later, replace createPlaceholderTextures with this.load.image
 * calls that use the same keys (see placeholderArt.ts). Sounds can be loaded
 * here too, for example:
 *   this.load.audio('hit', 'assets/hit.wav')
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot)
  }

  preload() {
    createPlaceholderTextures(this)
  }

  create() {
    this.scene.start(SCENES.intro)
  }
}
