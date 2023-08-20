import plaid from '@gera2ld/plaid';
import pkg from './package.json' assert { type: 'json' };

const {
  defaultOptions,
  getRollupExternal,
  getRollupPlugins,
} = plaid;

const DIST = defaultOptions.distDir;
const FILENAME = 'index';
const BANNER = `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`;

const external = getRollupExternal();
const bundleOptions = {
  extend: true,
  esModule: false,
};
const postcssOptions = {
  inject: false,
};
const rollupConfig = [
<% if (output.includes('cjs')) { -%>
  {
    input: 'src/index.ts',
    plugins: getRollupPlugins({
      minimize: false,
      extensions: defaultOptions.extensions,
      postcss: postcssOptions,
    }),
    external,
    output: {
      format: 'cjs',
      file: `${DIST}/${FILENAME}.cjs`,
    },
  },
<% } -%>
<% if (output.includes('esm')) { -%>
  {
    input: 'src/index.ts',
    plugins: getRollupPlugins({
      esm: true,
      minimize: false,
      extensions: defaultOptions.extensions,
      postcss: postcssOptions,
    }),
    external,
    output: {
      format: 'esm',
      file: `${DIST}/${FILENAME}.mjs`,
    },
  },
<% } -%>
<% if (output.includes('umd')) { -%>
  {
    input: 'src/index.ts',
    plugins: getRollupPlugins({
      esm: true,
      extensions: defaultOptions.extensions,
      postcss: {
        ...postcssOptions,
        extract: 'style.css',
      },
    }),
    output: {
      format: 'umd',
      file: `${DIST}/${FILENAME}.umd.js`,
      name: '<%= bundleName %>',
      ...bundleOptions,
    },
  },
<% } -%>
<% if (output.includes('iife')) { -%>
  {
    input: 'src/index.ts',
    plugins: getRollupPlugins({
      esm: true,
      extensions: defaultOptions.extensions,
      postcss: {
        ...postcssOptions,
        extract: 'style.css',
      },
    }),
    output: {
      format: 'iife',
      file: `${DIST}/${FILENAME}.js`,
      name: '<%= bundleName %>',
      ...bundleOptions,
    },
  },
<% } -%>
];

rollupConfig.forEach((item) => {
  item.output = {
    indent: false,
    // If set to false, circular dependencies and live bindings for external imports won't work
    externalLiveBindings: false,
    ...item.output,
    ...BANNER && {
      banner: BANNER,
    },
  };
});

export default rollupConfig;
