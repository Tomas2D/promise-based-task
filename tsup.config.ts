import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  sourcemap: true,
  dts: true,
  format: ['esm', 'cjs'],
  treeshake: true,
  shims: true,
  legacyOutput: false,
  bundle: true,
  splitting: true,
  tsconfig: 'tsconfig.build.json'
});
