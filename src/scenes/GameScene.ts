import Phaser from 'phaser'
import { ART } from '../assets/placeholderArt'
import {
  GAME_HEIGHT,
  GROUND_HEIGHT,
  GROUND_TOP,
  HEALTH,
  IDLE_INPUT,
  SCENES,
  TOMATO,
  WORLD_WIDTH,
  type HudState,
  type PlayerInput,
} from '../config'
import { Boy } from '../objects/Boy'
import { HealthPack } from '../objects/HealthPack'
import { Snail } from '../objects/Snail'
import { Tomato } from '../objects/Tomato'
import type { UIScene } from './UIScene'

/**
 * The garden level.
 *
 * The ground runs the full width. Flower pots, the fence and the shed roof are
 * platforms. Jump reaches the lower ones. The shed is a full jump up from the
 * fence beside it, or a flight up from the grass.
 *
 * Tomatoes are the goal. Throw them at the boy until his meter fills, then he
 * walks into the shed. If the shell hits 0 first, the level is lost.
 */

interface PlatformSpec {
  key: string
  x: number
  /** Y of the surface you stand on. */
  top: number
  w: number
  h: number
  /** The shed: we draw walls under the roof and send the boy here when he loses. */
  home?: boolean
}

const PLATFORMS: PlatformSpec[] = [
  { key: ART.pot, x: 520, top: 575, w: 110, h: 70 },
  { key: ART.fence, x: 860, top: 508, w: 280, h: 36 },
  { key: ART.pot, x: 1200, top: 560, w: 110, h: 70 },
  { key: ART.fence, x: 1500, top: 490, w: 240, h: 36 },
  { key: ART.shedRoof, x: 1960, top: 400, w: 420, h: 40, home: true },
  { key: ART.pot, x: 2360, top: 545, w: 120, h: 78 },
  { key: ART.fence, x: 2680, top: 485, w: 300, h: 36 },
]

const HINT = 'Pick tomatoes from the plants. Jump again in the air to fly, then throw.'

export class GameScene extends Phaser.Scene {
  private snail!: Snail
  private boy!: Boy
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private ground!: Phaser.GameObjects.Rectangle
  private tomatoPickups!: Phaser.Physics.Arcade.Group
  private projectiles!: Phaser.Physics.Arcade.Group
  private healthPack?: HealthPack

  private inputState: PlayerInput = { ...IDLE_INPUT }
  private banner = ''
  private hintUntil = 0
  private ending = false
  private finished = false
  private homeX = 1960

  constructor() {
    super(SCENES.game)
  }

  create() {
    // The scene object is reused when you press Play again, so reset the run here.
    this.ending = false
    this.finished = false
    this.banner = ''
    this.inputState = { ...IDLE_INPUT }
    this.hintUntil = this.time.now + 6500
    this.healthPack = undefined

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT)
    this.cameras.main.setBackgroundColor('#8ecae6')

    this.drawScenery()
    this.ground = this.createGround()
    this.platforms = this.physics.add.staticGroup()
    this.homeX = this.createPlatforms()

    this.tomatoPickups = this.physics.add.group({ allowGravity: false, immovable: true })
    this.projectiles = this.physics.add.group()
    this.placePickups()

    this.snail = new Snail(this, 180, GROUND_TOP)
    this.boy = new Boy(this, 1880, GROUND_TOP)
    this.boy.setRoute(1300, 2900, this.homeX)
    this.boy.onGone = () => this.endSoon('win')

    this.physics.add.collider(this.snail, this.ground)
    this.physics.add.collider(this.snail, this.platforms)
    this.physics.add.collider(this.boy, this.ground)
    this.physics.add.collider(this.projectiles, this.ground, this.splatter)
    this.physics.add.collider(this.projectiles, this.platforms, this.splatter)
    this.physics.add.overlap(this.projectiles, this.boy, this.hitBoy)
    this.physics.add.overlap(this.snail, this.tomatoPickups, this.collectTomato)
    if (this.healthPack) this.physics.add.overlap(this.snail, this.healthPack, this.collectHealth)

    // The world is exactly as tall as the screen, so the camera only scrolls sideways.
    // Vertical follow is clamped by the bounds, which keeps the grass along the bottom.
    this.cameras.main.startFollow(this.snail, true, 0.12, 0.08)

    if (!this.scene.isActive(SCENES.ui)) this.scene.launch(SCENES.ui)

    this.game.events.on('prestep', this.sampleInput)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('prestep', this.sampleInput)
    })
  }

  update(_time: number, delta: number) {
    if (this.finished) return

    if (!this.ending) {
      this.snail.applyInput(delta, this.inputState)
      if (this.inputState.throwPressed) this.throwTomato()
      this.boy.tick(this.snail)
      if (this.snail.health <= 0) {
        this.banner = 'Shell broken!'
        this.snail.setVelocity(0, 0)
        this.endSoon('lose')
      }
    }

    this.writeHud()
  }

  /**
   * Read controls before either scene updates, so Jump and Throw land on this
   * frame instead of the next one. The UI scene owns the keyboard and the buttons.
   */
  private sampleInput = () => {
    if (this.ending || this.finished) {
      this.inputState = { ...IDLE_INPUT }
      return
    }
    const ui = this.scene.get(SCENES.ui) as UIScene | undefined
    if (!ui?.sys.isActive()) return
    this.inputState = ui.getInput()
  }

  private throwTomato() {
    const direction = this.snail.consumeTomato()
    if (direction === null) return
    const from = this.snail.catapultMouth()
    const tomato = new Tomato(this, from.x, from.y)
    // The second argument puts the sprite on screen. Group.add alone only adds physics.
    this.projectiles.add(tomato, true)
    tomato.setDepth(8)
    tomato.becomeProjectile(direction)
  }

  /** The plant stays put. Only the fruit is picked, then it grows back. */
  private addTomatoPlant(x: number, surface: number) {
    this.add.image(x, surface, ART.tomatoPlant).setOrigin(0.5, 1).setDepth(3)
    // The fruit sits above the leaves, so it reads as something to pick.
    this.spawnTomato({ x, y: surface - 62 })
  }

  private spawnTomato(spot: { x: number; y: number }) {
    const tomato = new Tomato(this, spot.x, spot.y)
    this.tomatoPickups.add(tomato, true)
    tomato.setDepth(6)
    tomato.becomePickup(spot)
  }

  private placePickups() {
    const shed = PLATFORMS.find((platform) => platform.home)!
    // `surface` is the ground or platform the plant stands on. The fruit grows on top.
    const surfaces = [
      { x: 320, surface: GROUND_TOP },
      { x: 700, surface: GROUND_TOP },
      { x: 520, surface: 575 },
      { x: 860, surface: 508 },
      { x: 1200, surface: 560 },
      { x: 1500, surface: 490 },
      { x: shed.x - 90, surface: shed.top },
      { x: shed.x + 110, surface: shed.top },
      { x: 2360, surface: 545 },
      { x: 2680, surface: 485 },
      { x: 2520, surface: GROUND_TOP },
    ]
    for (const spot of surfaces) this.addTomatoPlant(spot.x, spot.surface)

    const pack = new HealthPack(this, shed.x + 10, shed.top - 36)
    this.add.existing(pack)
    this.physics.add.existing(pack)
    pack.settle()
    this.healthPack = pack
  }

  private collectTomato: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_snail, tomatoObj) => {
    const tomato = tomatoObj as Tomato
    if (!this.snail.addTomato()) return
    const spot = tomato.pickupSpot
    tomato.destroy()
    if (!spot) return
    // The plant grows another tomato. Missed throws cannot empty the garden.
    this.time.delayedCall(TOMATO.respawnMs, () => {
      if (!this.sys.isActive() || this.ending) return
      this.spawnTomato(spot)
    })
  }

  private collectHealth = () => {
    if (!this.healthPack) return
    if (!this.snail.heal(HEALTH.healAmount)) return
    this.healthPack.destroy()
    this.healthPack = undefined
  }

  // Phaser passes the single sprite first and the group member second when a
  // group is one side of the check, so the tomato is not always argument 1.
  private hitBoy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (a, b) => {
    const tomato = this.asTomato(a, b)
    if (!tomato) return
    const x = tomato.x
    const y = tomato.y
    if (!tomato.consumeHit()) return
    this.splat(x, y)
    if (this.boy.addAnnoyance(TOMATO.annoyance)) this.banner = 'Mum called him inside!'
  }

  private splatter: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (a, b) => {
    const tomato = this.asTomato(a, b)
    if (!tomato) return
    const x = tomato.x
    const y = tomato.y
    if (!tomato.consumeHit()) return
    this.splat(x, y)
  }

  private asTomato(
    a: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody,
    b: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody,
  ): Tomato | undefined {
    if (a instanceof Tomato) return a
    if (b instanceof Tomato) return b
    return undefined
  }

  /** Pulp burst plus a stain that sits where the tomato landed. */
  private splat(x: number, y: number) {
    const stain = this.add.ellipse(x, y, 64, 26, 0xc0392b, 1).setDepth(9)
    const highlight = this.add.ellipse(x - 6, y - 2, 28, 12, 0xf5b7b1, 0.95).setDepth(9)
    this.tweens.add({
      targets: [stain, highlight],
      alpha: 0,
      duration: 450,
      delay: 650,
      onComplete: () => {
        stain.destroy()
        highlight.destroy()
      },
    })

    for (let i = 0; i < 8; i++) {
      const blob = this.add
        .circle(x, y, Phaser.Math.Between(5, 11), i % 2 === 0 ? 0xe74c3c : 0x7b241c)
        .setDepth(10)
      const spread = Phaser.Math.Between(-110, 110)
      const hop = Phaser.Math.Between(-90, -28)
      this.tweens.add({
        targets: blob,
        x: x + spread,
        y: y + hop,
        duration: 160,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: blob,
            x: x + spread * 1.3,
            y: y + hop + Phaser.Math.Between(40, 80),
            alpha: 0,
            scale: 0.4,
            duration: 280,
            ease: 'Quad.easeIn',
            onComplete: () => blob.destroy(),
          })
        },
      })
    }
  }

  private endSoon(result: 'win' | 'lose') {
    if (this.ending) return
    this.ending = true
    this.inputState = { ...IDLE_INPUT }
    this.time.delayedCall(result === 'lose' ? 800 : 600, () => this.finish(result))
  }

  private finish(result: 'win' | 'lose') {
    if (this.finished) return
    this.finished = true
    this.scene.stop(SCENES.ui)
    this.scene.start(SCENES.end, { result })
  }

  private writeHud() {
    const banner = this.banner || (this.time.now < this.hintUntil ? HINT : '')
    const hud: HudState = {
      health: this.snail.health,
      energy: this.snail.energy,
      annoyance: this.boy.annoyance,
      tomatoes: this.snail.tomatoes,
      banner,
    }
    this.registry.set('hud', hud)
  }

  private createGround() {
    this.add
      .tileSprite(0, GROUND_TOP, WORLD_WIDTH, GROUND_HEIGHT, ART.ground)
      .setOrigin(0, 0)
      .setDepth(2)

    const ground = this.add.rectangle(
      WORLD_WIDTH / 2,
      GROUND_TOP + GROUND_HEIGHT / 2,
      WORLD_WIDTH,
      GROUND_HEIGHT,
      0x000000,
      0,
    )
    this.physics.add.existing(ground, true)
    return ground
  }

  /** @returns the shed door, which is where the boy walks off to. */
  private createPlatforms() {
    let homeX = this.homeX
    for (const spec of PLATFORMS) {
      const sprite = this.platforms.create(spec.x, spec.top + spec.h / 2, spec.key) as Phaser.Physics.Arcade.Sprite
      sprite.setDisplaySize(spec.w, spec.h)
      sprite.refreshBody()
      sprite.setDepth(4)

      if (spec.home) {
        homeX = spec.x
        const wallHeight = GROUND_TOP - (spec.top + spec.h)
        this.add
          .image(spec.x, spec.top + spec.h, ART.shedWall)
          .setOrigin(0.5, 0)
          .setDisplaySize(spec.w * 0.7, wallHeight)
          .setDepth(3)
      }
    }
    return homeX
  }

  private drawScenery() {
    for (const [x, y] of [
      [180, 90],
      [640, 150],
      [1100, 70],
      [1680, 130],
      [2300, 80],
      [2900, 150],
    ] as const) {
      this.add.image(x, y, ART.cloud).setScrollFactor(0.25).setDepth(0)
    }

    // Sit the hills mostly behind the grass, so only the crests show on the horizon.
    for (let x = 200; x < WORLD_WIDTH; x += 520) {
      this.add
        .image(x, GROUND_TOP + 108, ART.hill)
        .setOrigin(0.5, 1)
        .setScrollFactor(0.45)
        .setDepth(0)
        .setAlpha(0.95)
    }

    for (let x = 120; x < WORLD_WIDTH; x += 210) {
      if (Math.abs(x - 1960) < 180) continue
      const flower = this.add.image(x, GROUND_TOP + 4, ART.flower).setOrigin(0.5, 1).setDepth(1)
      flower.setScale(0.85 + (x % 5) * 0.05)
    }

    for (let x = 260; x < WORLD_WIDTH; x += 480) {
      if (Math.abs(x - 1960) < 220) continue
      this.add.image(x, GROUND_TOP + 2, ART.bush).setOrigin(0.5, 1).setDepth(1)
    }
  }
}
