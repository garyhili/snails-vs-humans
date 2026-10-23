import { ART } from '../assets/placeholderArt'
import { GRAVITY, SNAIL, TOMATO, type PlayerInput } from '../config'

/**
 * The player.
 *
 * On the ground the snail crawls left and right, and Jump makes it hop.
 * Pressing Jump again in the air starts flying: the stick steers in every
 * direction and the energy bar drains. Landing, or running out of energy,
 * ends the flight. If that happens in the air, the snail glides down slowly
 * instead of dropping. Energy refills while standing on something.
 */
export class Snail extends Phaser.Physics.Arcade.Sprite {
  health = SNAIL.maxHealth
  energy = SNAIL.maxEnergy
  tomatoes = 0

  private flying = false
  private gliding = false
  /** 1 = right, -1 = left. Throws leave in this direction. */
  private facing: 1 | -1 = 1
  private hurtUntil = 0
  /** Degrees. Negative aims the cup up. placeGear applies this every frame. */
  private catapultAngle = -TOMATO.throwAngle
  private catapultTween?: Phaser.Tweens.Tween
  private backWing!: Phaser.GameObjects.Image
  private frontWing!: Phaser.GameObjects.Image
  private catapult!: Phaser.GameObjects.Image
  /** A tomato sitting in the cup. Hidden when the snail is not carrying any. */
  private loaded!: Phaser.GameObjects.Image

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ART.snail)
    // Origin at the feet, so `y` is the ground line the snail stands on.
    this.setOrigin(0.5, 1)
    this.setDepth(7)
    scene.add.existing(this)
    scene.physics.add.existing(this)

    const body = this.arcade()
    // The picture includes eyestalks. The body used for collisions is the shell
    // and belly, sitting on the bottom of the picture.
    body.setSize(50, 36, false)
    body.setOffset((this.width - 50) / 2, this.height - 36)
    body.setCollideWorldBounds(true)
    body.setBounce(0)
    body.setFriction(0, 0)
    body.updateFromGameObject()

    // Wings and the catapult are separate pictures so they can flap and flick
    // without changing the body used for collisions.
    this.backWing = scene.add.image(x, y, ART.wing).setOrigin(0.1, 0.5).setScale(1.15)
    this.frontWing = scene.add.image(x, y, ART.wing).setOrigin(0.1, 0.5).setScale(1.15)
    this.catapult = scene.add.image(x, y, ART.catapult).setOrigin(8 / 44, 17 / 28).setScale(1.5)
    this.loaded = scene.add.image(x, y, ART.tomato).setScale(0.55)
    this.placeGear()

    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.placeGear, this)
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.placeGear, this)
    })
  }

  isOnGround(): boolean {
    const body = this.arcade()
    return body.blocked.down || body.touching.down
  }

  /** Flying or gliding counts as "in the air on purpose", which the boy can swipe. */
  isAirborne(): boolean {
    return this.flying || this.gliding
  }

  /**
   * @returns true when the shell actually took damage (not during the flash).
   *          The scene checks `health` afterwards to see if the shell broke.
   */
  hurt(amount: number): boolean {
    if (this.scene.time.now < this.hurtUntil) return false

    this.health = Math.max(0, this.health - amount)
    this.hurtUntil = this.scene.time.now + SNAIL.hurtInvulnMs
    this.setTint(0xff6b6b)
    this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      duration: 80,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.setAlpha(1)
        this.refreshLook()
      },
    })
    return true
  }

  /** @returns true if a point of health was restored. */
  heal(amount: number): boolean {
    if (this.health >= SNAIL.maxHealth) return false
    this.health = Math.min(SNAIL.maxHealth, this.health + amount)
    this.refreshLook()
    this.setTint(0xb2ff59)
    this.scene.time.delayedCall(180, () => this.refreshLook())
    return true
  }

  /** @returns false when the snail is already carrying as many as it can. */
  addTomato(): boolean {
    if (this.tomatoes >= SNAIL.maxTomatoes) return false
    this.tomatoes += 1
    return true
  }

  /**
   * Spends one carried tomato.
   * @returns the facing direction, or null if the snail has nothing to throw.
   */
  consumeTomato(): 1 | -1 | null {
    if (this.tomatoes <= 0) return null
    this.tomatoes -= 1
    this.flickCatapult()
    return this.facing
  }

  /** Where a thrown tomato should appear: the cup of the catapult. */
  catapultMouth(): { x: number; y: number } {
    this.placeGear()
    return { x: this.loaded.x, y: this.loaded.y }
  }

  /** Called once per frame by the game scene with this frame's controls. */
  applyInput(delta: number, input: PlayerInput) {
    const body = this.arcade()
    const seconds = delta / 1000
    const onGround = this.isOnGround()

    if (Math.abs(input.moveX) > 0.2) {
      this.facing = input.moveX > 0 ? 1 : -1
    }
    this.setFlipX(this.facing < 0)

    // Jump only from a surface. A second press, later, while airborne, starts flying.
    // `onGround` is still true on the frame you leave the floor, so the hop and the
    // flight can never start from the same press.
    let justJumped = false
    if (input.jumpPressed && onGround) {
      this.flying = false
      this.gliding = false
      body.setAllowGravity(true)
      body.setGravityY(0)
      body.setVelocityY(SNAIL.jumpVelocity)
      justJumped = true
    } else if (input.jumpPressed && !onGround && !this.flying && this.energy >= SNAIL.minEnergyToFly) {
      this.startFlying()
    }

    // Touching a surface ends the flight before we steer, so the stick can't push
    // the snail through the floor on the landing frame.
    if (!justJumped && onGround && (this.flying || this.gliding)) this.land()

    if (this.flying) {
      body.setVelocity(input.moveX * SNAIL.flySpeed, input.moveY * SNAIL.flySpeed)
      this.energy = Math.max(0, this.energy - SNAIL.energyDrainPerSecond * seconds)
      if (this.energy <= 0) this.stopFlying()
    } else if (Math.abs(input.moveX) > 0.2) {
      body.setVelocityX(input.moveX * SNAIL.crawlSpeed)
    } else if (onGround) {
      body.setVelocityX(0)
    }

    if (!justJumped && onGround) {
      this.energy = Math.min(SNAIL.maxEnergy, this.energy + SNAIL.energyRefillPerSecond * seconds)
    } else if (this.gliding && body.velocity.y > SNAIL.glideMaxFall) {
      body.setVelocityY(SNAIL.glideMaxFall)
    }

    this.refreshLook()
  }

  private startFlying() {
    const body = this.arcade()
    this.flying = true
    this.gliding = false
    body.setAllowGravity(false)
    body.setGravityY(0)
  }

  private stopFlying() {
    if (!this.flying) return
    this.flying = false
    const body = this.arcade()
    body.setAllowGravity(true)
    if (this.isOnGround()) {
      this.land()
      return
    }
    // Still in the air: float down instead of falling at full speed.
    this.gliding = true
    body.setGravityY(SNAIL.glideGravity - GRAVITY)
    if (body.velocity.y > SNAIL.glideMaxFall) body.setVelocityY(SNAIL.glideMaxFall)
  }

  private land() {
    const body = this.arcade()
    this.flying = false
    this.gliding = false
    body.setAllowGravity(true)
    body.setGravityY(0)
  }

  /** A cracked shell (1 health left) stays a little red so the danger is visible. */
  private refreshLook() {
    if (this.scene.time.now < this.hurtUntil) return
    if (this.health <= 1) this.setTint(0xffab91)
    else this.clearTint()
  }

  private flickCatapult() {
    this.catapultTween?.stop()
    // Snap forward along the throw, then settle back on the aim.
    this.catapultAngle = -TOMATO.throwAngle
    this.catapultTween = this.scene.tweens.add({
      targets: this,
      catapultAngle: -6,
      duration: 70,
      yoyo: true,
      hold: 40,
      ease: 'Quad.easeOut',
    })
  }

  /**
   * Keeps the wings and catapult glued to the shell after physics has moved the snail.
   * Wings show while flying or gliding. The cup shows a tomato whenever one is carried.
   */
  private placeGear = () => {
    if (!this.active) return

    const dir = this.facing
    const shellX = this.x + dir * -6
    const shellY = this.y - 38
    const airborne = this.flying || this.gliding
    const flap = airborne ? Math.sin(this.scene.time.now / (this.flying ? 70 : 140)) * (this.flying ? 26 : 12) : 0

    for (const wing of [this.backWing, this.frontWing]) {
      wing.setVisible(airborne)
      wing.setAlpha(this.alpha)
      wing.setDepth(6)
    }

    this.backWing.setPosition(shellX - dir * 30, shellY - 10)
    this.backWing.setFlipX(dir > 0)
    this.backWing.setAngle(dir > 0 ? flap : -flap)

    this.frontWing.setPosition(shellX + dir * 28, shellY - 8)
    this.frontWing.setFlipX(dir < 0)
    this.frontWing.setAngle(dir > 0 ? -flap : flap)

    // Sit the mount on top of the shell so the cup sticks out past the head.
    this.catapult.setPosition(shellX + dir * 4, shellY - 22)
    this.catapult.setFlipX(dir < 0)
    this.catapult.setAngle(dir < 0 ? -this.catapultAngle : this.catapultAngle)
    this.catapult.setAlpha(this.alpha)
    this.catapult.setDepth(8)

    const rad = Phaser.Math.DegToRad(this.catapult.angle)
    const reach = 34
    const flip = this.catapult.flipX ? -1 : 1
    const along = flip * reach
    this.loaded.setPosition(this.catapult.x + Math.cos(rad) * along, this.catapult.y + Math.sin(rad) * along)
    this.loaded.setVisible(this.tomatoes > 0)
    this.loaded.setAlpha(this.alpha)
    this.loaded.setDepth(9)
  }

  private arcade(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body
  }
}
