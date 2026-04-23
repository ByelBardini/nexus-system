/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    /** Integração (userEvent, Radix, App) estoura 5s em CI ou com suíte completa. */
    testTimeout: 10_000,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    alias: { '@': path.resolve(__dirname, './src') },
    coverage: {
      provider: 'v8',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.*',
        '**/src/__tests__/**',
        // Apenas declarações de tipo (sem statements em runtime no JS emitido).
        '**/src/types/equipamentos-config.ts',
        '**/src/types/pedidos-rastreador.ts',
        '**/src/pages/equipamentos/config/domain/equipamentos-config.types.ts',
      ],
    },
  },
} as Parameters<typeof defineConfig>[0])
