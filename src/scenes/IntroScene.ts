import Phaser from 'phaser'
import { ART } from '../assets/placeholderArt'
import { FONT, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config'

/**
 * Title screen. Shows once, before the garden. Play again skips it.
 * Start, Space, or Enter begins the level.
 */
export class IntroScene extends Phaser.Scene {
  private left = false

  constructor() {
    super(SCENES.intro)
  }

  create() {
    this.left = false
    this.cameras.main.setBackgroundColor('#8ecae6')

    this.add.image(200, 150, ART.cloud).setAlpha(0.9)
    this.add.image(1080, 110, ART.cloud)
    this.add.image(160, 560, ART.hill).setScale(0.7).setAlpha(0.75)
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 50, ART.ground).setDisplaySize(GAME_WIDTH, 100)

    this.add.image(150, 500, ART.snail).setScale(1.5)
    this.add.image(280, 548, ART.tomatoPlant).setOrigin(0.5, 1).setScale(2.1)
    this.add.image(280, 430, ART.tomato).setScale(1.15)
    this.add.image(1130, 480, ART.boy).setScale(1.15)

    this.add
      .text(GAME_WIDTH / 2, 78, 'Flying Snails vs Human', {
        fontFamily: FONT,
        fontSize: '52px',
        color: '#17324d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_WIDTH / 2, 140, 'Pelt the boy with tomatoes until his mum calls him inside.', {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#17324d',
      })
      .setOrigin(0.5)

    const lines = [
      'Move with the stick, or the arrow keys.',
      'Jump, then jump again in the air to fly.',
      'Pick tomatoes from the plants. You can carry 2.',
      'Throw with the button, or the X key.',
    ]
    lines.forEach((line, index) => {
      this.add
        .text(GAME_WIDTH / 2, 230 + index * 46, line, {
          fontFamily: FONT,
          fontSize: '28px',
          color: '#17324d',
        })
        .setOrigin(0.5)
    })

    const button = this.add
      .rectangle(GAME_WIDTH / 2, 470, 240, 80, 0x2e7d32)
      .setInteractive({ useHandCursor: true })
    this.add
      .text(GAME_WIDTH / 2, 470, 'Start', {
        fontFamily: FONT,
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    button.on('pointerdown', () => this.startGame())
    button.on('pointerover', () => button.setFillStyle(0x388e3c))
    button.on('pointerout', () => button.setFillStyle(0x2e7d32))

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame())
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame())
  }

  private startGame() {
    if (this.left) return
    this.left = true
    this.scene.start(SCENES.game)
  }
}
