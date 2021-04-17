const { terser } = require('rollup-plugin-terser');
const {
  defaultOptions,
  getRollupPlugins,
  isProd,
  loadConfigSync,
} = require('@gera2ld/plaid');
const { browserSyncPlugin } = require('./scripts/browser-sync');
<% if (features.includes('svelte')) { -%>
const { sveltePlugin } = require('./scripts/svelte');
<% } -%>

const DIST = 'dist';
const FILENAME = 'app';

const postcssConfig = loadConfigSync('postcss') || require('@gera2ld/plaid/config/postcssrc');
const postcssOptions = {
  ...postcssConfig,
  extract: true,
};

<% const ext = ts ? '.ts' : '.js'; -%>
const rollupConfig = [
  {
    input: {
      input: 'src/index<%= ext %>',
      plugins: [
<% if (features.includes('svelte')) { -%>
        sveltePlugin({ isProd }),
<% } -%>
        ...getRollupPlugins({
          minimize: isProd,
          esm: true,
          extensions: defaultOptions.extensions,
          postcss: postcssOptions,
        }),
        isProd && terser(),
        !isProd && browserSyncPlugin({ dist: DIST }),
      ].filter(Boolean),
    },
    output: {
      format: 'iife',
      file: `${DIST}/${FILENAME}.js`,
    },
  },
];

rollupConfig.forEach((item) => {
  item.output = {
    indent: false,
    // If set to false, circular dependencies and live bindings for external imports won't work
    externalLiveBindings: false,
    ...item.output,
  };
});

module.exports = rollupConfig.map(({ input, output }) => ({
  ...input,
  output,
}));
