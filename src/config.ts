/**
 * All the numbers that change how the game feels live here.
 * Tweak these and refresh the browser — you should not have to hunt through scenes.
 *
 * Speeds are pixels per second. Jump and throw lifts are instant velocity (pixels/second).
 * Gravity is pixels per second squared, positive = down.
 */

export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720

/** The garden is wider than the screen. The camera follows the snail along it. */
export const WORLD_WIDTH = 3200

/** Top edge of the grass. Sprites with their origin at the bottom stand on this line. */
export const GROUND_TOP = 640
export const GROUND_HEIGHT = 80

export const GRAVITY = 1100

export const FONT = 'Trebuchet MS, Verdana, sans-serif'

export const SCENES = {
  boot: 'Boot',
  intro: 'Intro',
  game: 'Game',
  ui: 'UI',
  end: 'End',
} as const

export const SNAIL = {
  crawlSpeed: 210,
  /** Negative Y is up. */
  jumpVelocity: -580,
  flySpeed: 240,
  /**
   * Downward pull while gliding, in the same units as GRAVITY.
   * Phaser adds a body's own gravity on top of the world gravity, so the
   * snail sets its body gravity to (glideGravity - GRAVITY) to end up here.
   */
  glideGravity: 260,
  /** Slowest the snail falls while gliding, so a high roof is a float, not a plummet. */
  glideMaxFall: 90,
  maxHealth: 3,
  hurtDamage: 1,
  /** After a hit the shell flashes and ignores more damage for this long. */
  hurtInvulnMs: 1100,
  maxEnergy: 100,
  energyDrainPerSecond: 18,
  energyRefillPerSecond: 40,
  /** You need a little energy left before another flight can start. */
  minEnergyToFly: 8,
  /**
   * How many tomatoes the snail can hold at once.
   * A later upgrade can raise this. The tomato meter draws one slot per point,
   * and plants keep their fruit when the snail is already full.
   */
  maxTomatoes: 2,
}

export const TOMATO = {
  /** Speed along the aim, pixels per second. */
  throwSpeed: 580,
  /**
   * Degrees above horizontal. A shallow lob meets the boy.
   * A steep one sails over his head.
   */
  throwAngle: 20,
  /**
   * Added on top of world gravity. A little under full gravity keeps the
   * arc readable without turning the throw into a mortar.
   * Net gravity is GRAVITY + extraGravity.
   */
  extraGravity: -200,
  lifeMs: 2500,
  /** How much of the boy's meter one hit fills. 3 hits fill a meter of 100. */
  annoyance: 34,
  /** A collected tomato grows back, so a few missed throws cannot trap you. */
  respawnMs: 8000,
}

export const BOY = {
  patrolSpeed: 60,
  chaseSpeed: 115,
  /** How close the snail must be before he stops patrolling and comes over. */
  chaseRange: 430,
  /** Close enough, and on the ground, to be stomped. */
  stompRange: 86,
  /** Close enough, and flying low, to be swiped. */
  swipeRange: 110,
  /** A flying snail higher than this above his feet is safe from the swipe. */
  swipeHeight: 170,
  attackCooldownMs: 900,
  maxAnnoyance: 100,
  leaveSpeed: 280,
}

export const HEALTH = {
  /** The pack restores the shell up to this much. It is left alone when already full. */
  healAmount: 3,
}

/** What the snail wants to do this frame. Filled by the keyboard and the touch controls. */
export interface PlayerInput {
  /** -1 left, 1 right, 0 still. Joystick values can be in between. */
  moveX: number
  /** -1 up, 1 down. Only used while flying. */
  moveY: number
  jumpPressed: boolean
  throwPressed: boolean
}

export const IDLE_INPUT: PlayerInput = {
  moveX: 0,
  moveY: 0,
  jumpPressed: false,
  throwPressed: false,
}

/** Numbers the HUD draws. The game scene writes this every frame. */
export interface HudState {
  health: number
  energy: number
  annoyance: number
  tomatoes: number
  /** Big message in the middle of the screen. Empty string hides it. */
  banner: string
}

export const EMPTY_HUD: HudState = {
  health: SNAIL.maxHealth,
  energy: SNAIL.maxEnergy,
  annoyance: 0,
  tomatoes: 0,
  banner: '',
}
