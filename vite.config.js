import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/merchant/',
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://49.235.130.42:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    clearMocks: true,
    restoreMocks: true,
  },
})

