import Phaser from 'phaser'
import { ART } from '../assets/placeholderArt'
import { FONT, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config'

/**
 * Win and lose share this scene. "Play again" starts a fresh garden.
 * Space or Enter does the same thing, which is handy when testing on a desktop.
 */
export class EndScene extends Phaser.Scene {
  private result: 'win' | 'lose' = 'lose'
  private left = false

  constructor() {
    super(SCENES.end)
  }

  init(data: { result?: 'win' | 'lose' }) {
    this.result = data?.result === 'win' ? 'win' : 'lose'
    this.left = false
  }

  create() {
    const won = this.result === 'win'
    this.cameras.main.setBackgroundColor('#8ecae6')

    this.add.image(180, 520, ART.hill).setScale(0.8).setAlpha(0.8)
    this.add.image(1100, 140, ART.cloud)
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 70, ART.ground).setDisplaySize(GAME_WIDTH, 140)

    if (won) {
      this.add.image(GAME_WIDTH / 2, 430, ART.snail).setScale(1.4)
    } else {
      this.add.image(GAME_WIDTH / 2 - 80, 400, ART.snail).setScale(1.2).setTint(0xb0bec5)
      this.add.image(GAME_WIDTH / 2 + 90, 390, ART.boy).setScale(1.1)
    }

    this.add
      .text(GAME_WIDTH / 2, 150, won ? 'Mum called him inside!' : 'Shell broken!', {
        fontFamily: FONT,
        fontSize: '52px',
        color: '#17324d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(
        GAME_WIDTH / 2,
        214,
        won ? 'The garden is yours.' : 'The boy cracked your shell.',
        { fontFamily: FONT, fontSize: '26px', color: '#17324d' },
      )
      .setOrigin(0.5)

    const button = this.add
      .rectangle(GAME_WIDTH / 2, 520, 280, 84, 0x2e7d32)
      .setInteractive({ useHandCursor: true })
    this.add
      .text(GAME_WIDTH / 2, 520, 'Play again', {
        fontFamily: FONT,
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    button.on('pointerdown', () => this.playAgain())
    button.on('pointerover', () => button.setFillStyle(0x388e3c))
    button.on('pointerout', () => button.setFillStyle(0x2e7d32))

    this.input.keyboard?.once('keydown-ENTER', () => this.playAgain())
    this.input.keyboard?.once('keydown-SPACE', () => this.playAgain())
  }

  private playAgain() {
    if (this.left) return
    this.left = true
    this.scene.start(SCENES.game)
  }
}
