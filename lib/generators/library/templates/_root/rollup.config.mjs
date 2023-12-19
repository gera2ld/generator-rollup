import { defineConfig } from 'rollup';
import { definePlugins, defineExternal } from '@gera2ld/plaid-rollup';
import pkg from './package.json' assert { type: 'json' };

const banner = `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`;

export default defineConfig({
  input: 'src/index.ts',
  plugins: definePlugins({
    esm: true,
    minimize: false,
    postcss: {
      inject: false,
    },
  }),
  external: defineExternal(Object.keys(pkg.dependencies)),
  output: [
    {
      format: 'es',
      file: 'dist/index.js',
      // If set to false, circular dependencies and live bindings for external imports won't work
      externalLiveBindings: false,
      banner,
    },
    {
      format: 'cjs',
      file: 'dist/index.cjs',
      // If set to false, circular dependencies and live bindings for external imports won't work
      externalLiveBindings: false,
      banner,
    },
  ],
});
