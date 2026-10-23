import { defineConfig } from 'vite'

// host: true listens on your LAN address as well as localhost,
// so a tablet on the same Wi-Fi can open the game.
export default defineConfig({
  // Phaser is one large library. This only hides the "chunk over 500 kB" note.
  build: {
    chunkSizeWarningLimit: 1600,
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
