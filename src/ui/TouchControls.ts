import Phaser from 'phaser'

/**
 * On-screen controls for a tablet.
 *
 * The left half of the screen is a virtual joystick. It appears under the finger
 * (so you do not have to hit a tiny box), and the knob follows the drag.
 * Jump and Throw are two buttons on the right.
 *
 * Each finger has its own pointer id, so holding the stick does not stop
 * the other finger from pressing Jump. A mouse can use the same areas, but
 * a mouse has only one pointer — use the keyboard as well when testing on a desktop.
 */

const DEAD_ZONE = 0.18
const STICK_RADIUS = 78

export interface TouchState {
  moveX: number
  moveY: number
  jumpPressed: boolean
  throwPressed: boolean
}

export class TouchControls {
  private readonly hintParts: Array<Phaser.GameObjects.Arc | Phaser.GameObjects.Text>
  private readonly base: Phaser.GameObjects.Arc
  private readonly knob: Phaser.GameObjects.Arc
  private readonly jumpButton: Phaser.GameObjects.Arc
  private readonly throwButton: Phaser.GameObjects.Arc

  private stickPointerId: number | null = null
  private originX = 0
  private originY = 0
  private moveX = 0
  private moveY = 0
  private jumpEdge = false
  private throwEdge = false

  constructor(private readonly scene: Phaser.Scene) {
    const width = scene.scale.width
    const height = scene.scale.height

    // Extra pointers: Phaser starts with one, which is not enough for stick + button.
    scene.input.addPointer(3)

    const hintRing = scene.add.circle(160, height - 150, STICK_RADIUS, 0xffffff, 0.18).setDepth(10)
    const hintKnob = scene.add.circle(160, height - 150, 28, 0xffffff, 0.35).setDepth(10)
    const hintLabel = scene.add
      .text(160, height - 150 + STICK_RADIUS + 8, 'Move', {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0)
      .setDepth(10)
    this.hintParts = [hintRing, hintKnob, hintLabel]

    this.base = scene.add.circle(0, 0, STICK_RADIUS, 0xffffff, 0.22).setDepth(11).setVisible(false)
    this.knob = scene.add.circle(0, 0, 34, 0xffffff, 0.55).setDepth(12).setVisible(false)

    this.jumpButton = scene.add.circle(width - 130, height - 140, 72, 0xffffff, 0.28).setDepth(11)
    this.throwButton = scene.add.circle(width - 300, height - 250, 60, 0xffffff, 0.28).setDepth(11)

    this.label(this.jumpButton, 'Jump')
    this.label(this.throwButton, 'Throw')

    scene.tweens.add({
      targets: hintRing,
      alpha: 0.45,
      duration: 900,
      yoyo: true,
      repeat: -1,
    })

    scene.input.on('pointerdown', this.onDown)
    scene.input.on('pointermove', this.onMove)
    scene.input.on('pointerup', this.onUp)
    scene.input.on('pointerupoutside', this.onUp)
  }

  /**
   * Current stick position, plus whether Jump or Throw were pressed since last call.
   * Call once per frame.
   */
  read(): TouchState {
    const state: TouchState = {
      moveX: this.moveX,
      moveY: this.moveY,
      jumpPressed: this.jumpEdge,
      throwPressed: this.throwEdge,
    }
    this.jumpEdge = false
    this.throwEdge = false
    return state
  }

  destroy() {
    this.scene.input.off('pointerdown', this.onDown)
    this.scene.input.off('pointermove', this.onMove)
    this.scene.input.off('pointerup', this.onUp)
    this.scene.input.off('pointerupoutside', this.onUp)
  }

  private label(button: Phaser.GameObjects.Arc, text: string) {
    this.scene.add
      .text(button.x, button.y, text, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: '22px',
        color: '#17324d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(13)
  }

  private onDown = (pointer: Phaser.Input.Pointer) => {
    if (this.hits(pointer, this.jumpButton, 72)) {
      this.jumpEdge = true
      return
    }
    if (this.hits(pointer, this.throwButton, 60)) {
      this.throwEdge = true
      return
    }
    // Anywhere on the left half starts a stick, so a thumb can land comfortably.
    if (pointer.x < this.scene.scale.width * 0.5 && this.stickPointerId === null) {
      this.stickPointerId = pointer.id
      this.originX = pointer.x
      this.originY = pointer.y
      this.base.setPosition(pointer.x, pointer.y).setVisible(true)
      this.knob.setPosition(pointer.x, pointer.y).setVisible(true)
      this.setHintVisible(false)
      this.moveX = 0
      this.moveY = 0
    }
  }

  private onMove = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id !== this.stickPointerId) return

    const dx = pointer.x - this.originX
    const dy = pointer.y - this.originY
    const length = Math.hypot(dx, dy) || 1
    const clamped = Math.min(length, STICK_RADIUS)
    const knobX = (dx / length) * clamped
    const knobY = (dy / length) * clamped
    this.knob.setPosition(this.originX + knobX, this.originY + knobY)

    let x = knobX / STICK_RADIUS
    let y = knobY / STICK_RADIUS
    if (Math.hypot(x, y) < DEAD_ZONE) {
      x = 0
      y = 0
    }
    this.moveX = x
    this.moveY = y
  }

  private onUp = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id !== this.stickPointerId) return
    this.stickPointerId = null
    this.moveX = 0
    this.moveY = 0
    this.base.setVisible(false)
    this.knob.setVisible(false)
    this.setHintVisible(true)
  }

  private setHintVisible(visible: boolean) {
    for (const part of this.hintParts) part.setVisible(visible)
  }

  private hits(pointer: Phaser.Input.Pointer, button: Phaser.GameObjects.Arc, radius: number) {
    const dx = pointer.x - button.x
    const dy = pointer.y - button.y
    const reach = radius + 16
    return dx * dx + dy * dy <= reach * reach
  }
}
