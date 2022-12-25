import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**'],
  outDir: 'lib',
  sourcemap: true,
  dts: true,
  format: ['esm', 'cjs'],
  treeshake: true,
  shims: true,
  legacyOutput: false,
  bundle: false,
  splitting: true,
  tsconfig: 'tsconfig.build.json'
});
