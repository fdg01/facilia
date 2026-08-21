import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./apps/web/src/test/setup.ts'],
    include: [
      'modules/**/*.test.ts',
      'modules/**/*.test.tsx',
      'apps/web/src/**/*.test.ts',
      'apps/web/src/**/*.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['modules/**/*.ts'],
      exclude: ['modules/**/*.test.ts', 'modules/**/*.test.tsx'],
    },
  },
})
