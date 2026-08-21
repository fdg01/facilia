import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const repoRoot = resolve(import.meta.dirname, '../..')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@modules': resolve(repoRoot, 'modules'),
    },
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      '../../modules/**/*.test.ts',
      '../../modules/**/*.test.tsx',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['../../modules/**/*.ts'],
      exclude: ['../../modules/**/*.test.ts', '../../modules/**/*.test.tsx'],
    },
  },
})
