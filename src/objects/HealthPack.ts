import { ART } from '../assets/placeholderArt'

/**
 * One pack in the level. Restores shell health. Left on the platform if the
 * shell is already full, so it can be saved for later.
 */
export class HealthPack extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ART.healthPack)
    this.setDepth(5)
  }

  /** Call after the pack has been added to a physics group. */
  settle() {
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
    body.setImmovable(true)
    body.moves = false
    body.setSize(28, 28, true)
    this.scene.tweens.add({
      targets: this,
      angle: 8,
      duration: 500,
      yoyo: true,
      repeat: -1,
    })
  }
}
