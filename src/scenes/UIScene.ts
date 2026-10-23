import Phaser from 'phaser'
import {
  EMPTY_HUD,
  BOY,
  FONT,
  GAME_WIDTH,
  SCENES,
  SNAIL,
  type HudState,
  type PlayerInput,
} from '../config'
import { TouchControls } from '../ui/TouchControls'

/**
 * Drawn on top of the level. The camera does not follow the snail, so the bars
 * and buttons stay put while the garden scrolls underneath.
 *
 * This scene also reads the keyboard. TouchControls reads fingers. Both are
 * combined into one PlayerInput for the game scene.
 */
export class UIScene extends Phaser.Scene {
  private controls!: TouchControls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private jumpKey!: Phaser.Input.Keyboard.Key
  private throwKey!: Phaser.Input.Keyboard.Key
  private bars!: Phaser.GameObjects.Graphics
  private banner!: Phaser.GameObjects.Text

  constructor() {
    super(SCENES.ui)
  }

  create() {
    // A solid camera here would paint over the garden. Transparent leaves the
    // game scene visible and only draws our bars and buttons.
    this.cameras.main.transparent = true

    const keyboard = this.input.keyboard
    if (!keyboard) throw new Error('Keyboard input is not available')

    this.cursors = keyboard.createCursorKeys()
    this.jumpKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.throwKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X)
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.X,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ])

    this.controls = new TouchControls(this)
    this.createHud()

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy()
      this.input.keyboard?.removeAllKeys()
    })
  }

  /** Stick + buttons, with the arrow keys / Space / X winning when they are held. */
  getInput(): PlayerInput {
    const touch = this.controls.read()
    let moveX = touch.moveX
    let moveY = touch.moveY

    if (this.cursors.left.isDown) moveX = -1
    if (this.cursors.right.isDown) moveX = 1
    if (this.cursors.up.isDown) moveY = -1
    if (this.cursors.down.isDown) moveY = 1

    return {
      moveX,
      moveY,
      jumpPressed: touch.jumpPressed || Phaser.Input.Keyboard.JustDown(this.jumpKey),
      throwPressed: touch.throwPressed || Phaser.Input.Keyboard.JustDown(this.throwKey),
    }
  }

  update() {
    const hud = (this.registry.get('hud') as HudState | undefined) ?? EMPTY_HUD
    this.bars.clear()
    this.paintBar(24, 36, 230, 18, hud.health / SNAIL.maxHealth, 0x66bb6a)
    this.paintBar(24, 86, 230, 18, hud.energy / SNAIL.maxEnergy, 0x29b6f6)
    this.paintBar(GAME_WIDTH - 254, 36, 230, 18, hud.annoyance / BOY.maxAnnoyance, 0xffb300)
    this.paintTomatoMeter(24, 138, hud.tomatoes)
    this.banner.setText(hud.banner)
    this.banner.setVisible(hud.banner.length > 0)
  }

  private createHud() {
    const style = {
      fontFamily: FONT,
      fontSize: '18px',
      color: '#17324d',
      fontStyle: 'bold',
    }

    this.add.text(24, 12, 'Shell', style).setDepth(20)
    this.add.text(24, 62, 'Flight', style).setDepth(20)
    this.add.text(GAME_WIDTH - 254, 12, 'Annoyance', style).setDepth(20)
    this.add.text(24, 112, 'Tomatoes', style).setDepth(20)

    this.banner = this.add
      .text(GAME_WIDTH / 2, 170, '', {
        fontFamily: FONT,
        fontSize: '32px',
        color: '#17324d',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#fff8e1',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(20)

    this.bars = this.add.graphics().setDepth(20)
  }

  /**
   * One slot per tomato the snail can carry. Filled slots are the ones already picked.
   * Raising SNAIL.maxTomatoes adds slots, which is how a later upgrade would show up.
   */
  private paintTomatoMeter(x: number, y: number, carried: number) {
    const size = 26
    const gap = 8
    for (let i = 0; i < SNAIL.maxTomatoes; i++) {
      const sx = x + i * (size + gap)
      this.bars.fillStyle(0x000000, 0.35)
      this.bars.fillRoundedRect(sx, y, size, size, 6)
      if (i >= carried) continue
      this.bars.fillStyle(0xc0392b, 1)
      this.bars.fillCircle(sx + size / 2, y + size / 2 + 1, 8)
      this.bars.fillStyle(0x27ae60, 1)
      this.bars.fillEllipse(sx + size / 2, y + 6, 6, 4)
    }
  }

  /** A track with a fill. Fraction comes from config maxes, so changing those still fits. */
  private paintBar(x: number, y: number, width: number, height: number, fraction: number, color: number) {
    const amount = Phaser.Math.Clamp(fraction, 0, 1)
    this.bars.fillStyle(0x000000, 0.35)
    this.bars.fillRoundedRect(x, y, width, height, 6)
    if (amount <= 0) return
    this.bars.fillStyle(color, 1)
    this.bars.fillRoundedRect(x + 2, y + 2, (width - 4) * amount, height - 4, 4)
  }
}
