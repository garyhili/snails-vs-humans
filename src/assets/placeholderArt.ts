/**
 * Coloured shapes used until real art exists.
 *
 * Every picture is stored under a short key ('snail', 'boy', ...).
 * BootScene is the only place that creates them. Later, delete the call to
 * createPlaceholderTextures and load files from public/assets/ with the same keys:
 *
 *   this.load.image('snail', 'assets/snail.png')
 *   this.load.image('boy', 'assets/boy.png')
 *   this.load.audio('hit', 'assets/hit.wav')
 *
 * Kenney.nl CC0 packs are an easy swap: drop the file in public/assets and
 * keep the key the rest of the game already uses.
 */

export const ART = {
  snail: 'snail',
  boy: 'boy',
  tomato: 'tomato',
  healthPack: 'health-pack',
  ground: 'ground',
  fence: 'fence',
  pot: 'pot',
  shedRoof: 'shed-roof',
  shedWall: 'shed-wall',
  cloud: 'cloud',
  hill: 'hill',
  bush: 'bush',
  flower: 'flower',
  wing: 'wing',
  catapult: 'catapult',
  tomatoPlant: 'tomato-plant',
} as const

type Draw = (g: Phaser.GameObjects.Graphics) => void

function paint(scene: Phaser.Scene, key: string, width: number, height: number, draw: Draw) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false)
  draw(g)
  g.generateTexture(key, width, height)
  g.destroy()
}

export function createPlaceholderTextures(scene: Phaser.Scene) {
  paint(scene, ART.snail, 96, 72, drawSnail)
  paint(scene, ART.boy, 80, 128, drawBoy)
  paint(scene, ART.tomato, 40, 40, drawTomato)
  paint(scene, ART.healthPack, 40, 40, drawHealthPack)
  paint(scene, ART.ground, 64, 64, drawGround)
  paint(scene, ART.fence, 64, 36, drawFence)
  paint(scene, ART.pot, 64, 64, drawPot)
  paint(scene, ART.shedRoof, 64, 40, drawShedRoof)
  paint(scene, ART.shedWall, 80, 100, drawShedWall)
  paint(scene, ART.cloud, 120, 56, drawCloud)
  paint(scene, ART.hill, 420, 140, drawHill)
  paint(scene, ART.bush, 70, 40, drawBush)
  paint(scene, ART.flower, 28, 40, drawFlower)
  paint(scene, ART.wing, 56, 32, drawWing)
  paint(scene, ART.catapult, 44, 28, drawCatapult)
  paint(scene, ART.tomatoPlant, 48, 56, drawTomatoPlant)
}

function drawSnail(g: Phaser.GameObjects.Graphics) {
  // Body and head face right, so flipX turns the snail to the left.
  g.fillStyle(0xc4a574, 1)
  g.fillEllipse(58, 52, 70, 26)
  g.fillCircle(78, 46, 12)

  g.fillStyle(0x8d6e63, 1)
  g.fillCircle(40, 36, 24)
  g.fillStyle(0xa1887f, 1)
  g.fillCircle(40, 36, 14)
  g.lineStyle(3, 0x5d4037, 1)
  g.beginPath()
  g.arc(40, 36, 10, 0.4, 4.2, false)
  g.strokePath()

  g.fillStyle(0x6b8f71, 1)
  g.fillCircle(74, 28, 3)
  g.fillCircle(84, 24, 3)
  g.fillStyle(0xffffff, 1)
  g.fillCircle(74, 26, 4)
  g.fillCircle(84, 22, 4)
  g.fillStyle(0x222222, 1)
  g.fillCircle(75, 26, 2)
  g.fillCircle(85, 22, 2)
}

function drawWing(g: Phaser.GameObjects.Graphics) {
  // Tip points right. A blue edge keeps the wing visible against the sky.
  g.fillStyle(0xfffde7, 1)
  g.fillEllipse(32, 16, 46, 20)
  g.fillStyle(0xe1f5fe, 1)
  g.fillEllipse(26, 17, 22, 10)
  g.lineStyle(3, 0x4fc3f7, 1)
  g.strokeEllipse(32, 16, 46, 20)
  g.fillStyle(0x81d4fa, 1)
  g.fillCircle(8, 16, 5)
}

function drawCatapult(g: Phaser.GameObjects.Graphics) {
  // Arm points right. Origin is set on the mount so it can flick.
  g.fillStyle(0x8d6e63, 1)
  g.fillRoundedRect(6, 14, 24, 6, 2)
  g.fillStyle(0x6d4c41, 1)
  g.fillCircle(8, 17, 5)
  g.fillStyle(0xd7ccc8, 1)
  g.fillEllipse(36, 13, 14, 10)
  g.lineStyle(2, 0x6d4c41, 1)
  g.strokeEllipse(36, 13, 14, 10)
}

function drawTomatoPlant(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0x2e7d32, 1)
  g.fillRect(22, 24, 4, 32)
  g.fillEllipse(14, 36, 16, 8)
  g.fillEllipse(34, 34, 16, 8)
  g.fillStyle(0x43a047, 1)
  g.fillEllipse(24, 18, 28, 16)
  g.fillEllipse(16, 22, 14, 10)
  g.fillEllipse(32, 20, 14, 10)
}

function drawBoy(g: Phaser.GameObjects.Graphics) {
  // Shoes and legs.
  g.fillStyle(0x3e2723, 1)
  g.fillRoundedRect(18, 108, 16, 12, 3)
  g.fillRoundedRect(46, 108, 16, 12, 3)
  g.fillStyle(0x37474f, 1)
  g.fillRect(22, 78, 12, 32)
  g.fillRect(46, 78, 12, 32)

  // Shirt and arms. The forward arm (right) shows which way he faces.
  g.fillStyle(0xf1c27d, 1)
  g.fillRoundedRect(8, 58, 14, 28, 6)
  g.fillRoundedRect(56, 52, 14, 32, 6)
  g.fillStyle(0x1e88e5, 1)
  g.fillRoundedRect(20, 52, 40, 36, 8)

  // Head, hair, cap brim pointing right.
  g.fillStyle(0xf1c27d, 1)
  g.fillCircle(40, 34, 18)
  g.fillStyle(0x6d4c41, 1)
  g.fillEllipse(38, 20, 34, 18)
  g.fillRect(22, 20, 28, 10)
  g.fillStyle(0x1565c0, 1)
  g.fillRoundedRect(48, 24, 16, 6, 2)

  g.fillStyle(0x222222, 1)
  g.fillCircle(34, 34, 2)
  g.fillCircle(46, 34, 2)
  g.lineStyle(2, 0x222222, 1)
  g.beginPath()
  g.arc(40, 38, 6, 0.3, Math.PI - 0.3, false)
  g.strokePath()
}

function drawTomato(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0xc0392b, 1)
  g.fillCircle(20, 22, 14)
  g.fillStyle(0x922b21, 1)
  g.fillCircle(14, 24, 3)
  g.fillCircle(24, 26, 2.5)
  g.fillCircle(18, 16, 2)
  g.fillStyle(0x27ae60, 1)
  g.fillEllipse(20, 8, 8, 6)
  g.fillTriangle(16, 10, 20, 2, 24, 10)
}

function drawHealthPack(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0xffffff, 1)
  g.fillRoundedRect(2, 2, 36, 36, 8)
  g.fillStyle(0xe74c3c, 1)
  g.fillRect(17, 8, 6, 24)
  g.fillRect(8, 17, 24, 6)
}

function drawGround(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0x8d6e63, 1)
  g.fillRect(0, 0, 64, 64)
  g.fillStyle(0x6ab04c, 1)
  g.fillRect(0, 0, 64, 16)
  g.fillStyle(0x4caf50, 1)
  g.fillRect(0, 0, 64, 8)
  // A lighter path so the garden floor reads as somewhere to walk.
  g.fillStyle(0xc4a574, 0.45)
  g.fillRect(0, 28, 64, 14)
}

function drawFence(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0xa1887f, 1)
  g.fillRect(0, 8, 64, 8)
  g.fillRect(0, 22, 64, 8)
  g.fillStyle(0x8d6e63, 1)
  for (let x = 4; x < 64; x += 16) {
    g.fillRect(x, 0, 8, 36)
  }
}

function drawPot(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0x2e7d32, 1)
  g.fillEllipse(32, 18, 40, 18)
  g.fillStyle(0x43a047, 1)
  g.fillEllipse(22, 16, 16, 12)
  g.fillEllipse(40, 14, 18, 14)
  g.fillStyle(0xd35400, 1)
  g.fillTriangle(18, 28, 46, 28, 42, 60)
  g.fillTriangle(18, 28, 22, 60, 42, 60)
  g.fillRect(16, 26, 32, 8)
  g.fillStyle(0xe67e22, 1)
  g.fillRect(18, 28, 28, 4)
}

function drawShedRoof(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0x607d8b, 1)
  g.fillTriangle(0, 40, 32, 0, 64, 40)
  g.fillStyle(0x455a64, 1)
  g.fillRect(0, 32, 64, 8)
}

function drawShedWall(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0xffe0b2, 1)
  g.fillRect(4, 0, 72, 100)
  g.fillStyle(0x6d4c41, 1)
  g.fillRect(32, 40, 22, 60)
  g.fillStyle(0x90caf9, 1)
  g.fillRect(12, 18, 16, 16)
  g.fillStyle(0xfdd835, 1)
  g.fillCircle(50, 72, 2)
}

function drawCloud(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0xffffff, 0.95)
  g.fillEllipse(40, 32, 50, 28)
  g.fillEllipse(70, 30, 60, 32)
  g.fillEllipse(96, 34, 36, 22)
}

function drawHill(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0x7cb342, 1)
  g.fillEllipse(210, 120, 420, 160)
  g.fillStyle(0x9ccc65, 1)
  g.fillEllipse(150, 110, 180, 80)
}

function drawBush(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0x2e7d32, 1)
  g.fillCircle(18, 24, 14)
  g.fillCircle(36, 18, 16)
  g.fillCircle(54, 24, 14)
}

function drawFlower(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(0x66bb6a, 1)
  g.fillRect(12, 16, 4, 24)
  g.fillStyle(0xf06292, 1)
  g.fillCircle(14, 10, 6)
  g.fillCircle(8, 16, 5)
  g.fillCircle(20, 16, 5)
  g.fillStyle(0xffee58, 1)
  g.fillCircle(14, 14, 3)
}
