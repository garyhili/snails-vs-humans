import { ART } from '../assets/placeholderArt'
import { BOY, SNAIL } from '../config'
import type { Snail } from './Snail'

/**
 * The boy walks a stretch of the garden. When the snail comes close he chases.
 * On the ground and in reach, he stomps. Flying or gliding low, he swipes.
 * Tomatoes fill his annoyance. When the meter is full he walks to the shed
 * and goes inside — that is the win.
 */
export class Boy extends Phaser.Physics.Arcade.Sprite {
  annoyance = 0
  /** The game scene sets this to open the win screen once he has gone inside. */
  onGone: () => void = () => {}

  private patrolMin = 0
  private patrolMax = 0
  private patrolDir: 1 | -1 = -1
  private homeX = 0
  private nextAttackAt = 0
  private goingHome = false
  private gone = false
  private reportedGone = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ART.boy)
    this.setOrigin(0.5, 1)
    this.setDepth(6)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const body = this.arcade()
    body.setSize(44, 110, false)
    body.setOffset((this.width - 44) / 2, this.height - 110)
    body.setCollideWorldBounds(true)
    body.setBounce(0)
    body.setFriction(0, 0)
    body.updateFromGameObject()
  }

  /** Left and right ends of his patrol, and the shed door he walks to when he gives up. */
  setRoute(patrolMin: number, patrolMax: number, homeX: number) {
    this.patrolMin = patrolMin
    this.patrolMax = patrolMax
    this.homeX = homeX
  }

  /**
   * @returns true the moment the meter first fills, so the scene can show the message.
   */
  addAnnoyance(amount: number): boolean {
    if (this.goingHome || this.gone) return false
    this.annoyance = Math.min(BOY.maxAnnoyance, this.annoyance + amount)
    this.flash(0xffb703)
    if (this.annoyance >= BOY.maxAnnoyance) {
      this.goingHome = true
      return true
    }
    return false
  }

  /** One frame of patrol, chase, and attacking. Named tick so it is not mixed up with Phaser's own update. */
  tick(snail: Snail) {
    if (this.gone) {
      this.arcade().setVelocity(0, 0)
      return
    }

    if (this.goingHome) {
      this.walkHome()
      return
    }

    this.chaseOrPatrol(snail)
    this.tryAttack(snail)
    this.faceVelocity()
  }

  private chaseOrPatrol(snail: Snail) {
    const body = this.arcade()
    const distance = Math.abs(snail.x - this.x)

    if (distance < BOY.chaseRange) {
      // Stop a little short so he attacks instead of standing inside the snail.
      if (distance > 36) body.setVelocityX(Math.sign(snail.x - this.x) * BOY.chaseSpeed)
      else body.setVelocityX(0)
      return
    }

    body.setVelocityX(this.patrolDir * BOY.patrolSpeed)
    if (this.x < this.patrolMin) this.patrolDir = 1
    if (this.x > this.patrolMax) this.patrolDir = -1
  }

  private tryAttack(snail: Snail) {
    const now = this.scene.time.now
    if (now < this.nextAttackAt) return

    const distance = Math.abs(snail.x - this.x)
    const feetGap = Math.abs(snail.y - this.y)

    if (snail.isOnGround() && distance < BOY.stompRange && feetGap < 48) {
      this.nextAttackAt = now + BOY.attackCooldownMs
      this.flash(0xff8a65)
      snail.hurt(SNAIL.hurtDamage)
      return
    }

    const flyingLow = snail.isAirborne() && snail.y > this.y - BOY.swipeHeight
    if (flyingLow && distance < BOY.swipeRange) {
      this.nextAttackAt = now + BOY.attackCooldownMs
      this.flash(0x90caf9)
      snail.hurt(SNAIL.hurtDamage)
    }
  }

  private walkHome() {
    const body = this.arcade()
    const dx = this.homeX - this.x
    if (Math.abs(dx) < 14) {
      body.setVelocity(0, 0)
      this.goingHome = false
      this.gone = true
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          if (this.reportedGone) return
          this.reportedGone = true
          this.onGone()
        },
      })
      return
    }

    body.setVelocityX(Math.sign(dx) * BOY.leaveSpeed)
    this.faceVelocity()
  }

  private faceVelocity() {
    const vx = this.arcade().velocity.x
    if (vx > 10) this.setFlipX(false)
    else if (vx < -10) this.setFlipX(true)
  }

  private flash(color: number) {
    this.setTint(color)
    this.scene.time.delayedCall(160, () => {
      if (this.active) this.clearTint()
    })
  }

  private arcade(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body
  }
}
