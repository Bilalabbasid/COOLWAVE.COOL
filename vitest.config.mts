import { defineConfig } from 'vitest/config';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import path from 'node:path';

export default defineConfig({
  plugins: [mdx({ remarkPlugins: [remarkGfm, remarkFrontmatter] })],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, '.') },
  },
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
    environment: 'node',
  },
});
