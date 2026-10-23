import { ART } from '../assets/placeholderArt'
import { TOMATO } from '../config'

/**
 * One class, two jobs:
 * - a pickup sitting in the garden (no gravity, a little bob)
 * - a projectile the snail has thrown (arc, then splat)
 *
 * Add the tomato to a physics group before calling becomePickup or becomeProjectile,
 * so it already has a body.
 */
export class Tomato extends Phaser.Physics.Arcade.Sprite {
  /** Where this pickup came from, so the level can grow another one later. */
  pickupSpot: { x: number; y: number } | null = null

  private spent = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ART.tomato)
    this.setDepth(5)
  }

  becomePickup(spot: { x: number; y: number }) {
    this.pickupSpot = spot
    const body = this.arcade()
    body.setAllowGravity(false)
    body.setImmovable(true)
    body.moves = false
    body.setCircle(14, 6, 6)
    // Bobbing is safe because `moves` is false: physics will not pull it back down.
    this.scene.tweens.add({
      targets: this,
      y: spot.y - 8,
      duration: 700,
      yoyo: true,
      repeat: -1,
    })
  }

  becomeProjectile(direction: 1 | -1) {
    this.pickupSpot = null
    this.setDepth(8)
    const body = this.arcade()
    const aim = Phaser.Math.DegToRad(TOMATO.throwAngle)
    body.setAllowGravity(true)
    body.setGravityY(TOMATO.extraGravity)
    body.setBounce(0)
    body.setVelocity(direction * Math.cos(aim) * TOMATO.throwSpeed, -Math.sin(aim) * TOMATO.throwSpeed)
    body.setAngularVelocity(direction * 220)
    body.setCircle(14, 6, 6)
    this.scene.time.delayedCall(TOMATO.lifeMs, () => {
      if (this.active) this.destroy()
    })
  }

  /**
   * First hit only. Overlap can fire more than once before the tomato is gone.
   * @returns true the first time, false after that.
   */
  consumeHit(): boolean {
    if (this.spent || !this.active) return false
    this.spent = true
    this.destroy()
    return true
  }

  /** Stops the pickup bob before Phaser removes the sprite. */
  override destroy(fromScene?: boolean) {
    if (this.scene) this.scene.tweens.killTweensOf(this)
    super.destroy(fromScene)
  }

  private arcade(): Phaser.Physics.Arcade.Body {
    if (!this.body) {
      throw new Error('Tomato has no body yet. Add it to a physics group first.')
    }
    return this.body as Phaser.Physics.Arcade.Body
  }
}
