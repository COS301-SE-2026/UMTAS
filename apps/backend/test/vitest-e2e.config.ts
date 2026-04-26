import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    environment: 'node',
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
