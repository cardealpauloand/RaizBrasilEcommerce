import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Serve images from the sibling ../images directory as if they were in / (public root)
export default defineConfig({
  plugins: [react()],
  publicDir: resolve(__dirname, '../images'),
  server: {
    fs: {
      allow: [
        resolve(__dirname),
        resolve(__dirname, '../images')
      ]
    }
  }
})
