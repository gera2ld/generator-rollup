const { terser } = require('rollup-plugin-terser');
const browserSync = require('rollup-plugin-browsersync');
const svelte = require('rollup-plugin-svelte');
const { postcss } = require('svelte-preprocess');
const { getRollupPlugins, defaultOptions, isProd } = require('@gera2ld/plaid');

const DIST = 'public';
const FILENAME = 'app';

const postcssConfig = (config => ({
  ...config,
  plugins: [
    ...config.plugins || [],
  ].filter(Boolean),
}))(require('@gera2ld/plaid/config/postcssrc'));

<% const ext = ts ? '.ts' : '.js'; -%>
const rollupConfig = [
  {
    input: {
      input: 'src/index<%= ext %>',
      plugins: [
<% if (features.includes('svelte')) { -%>
        svelte({
          dev: !isProd,
          hydratable: true,
          emitCss: true,
          preprocess: [
            postcss(postcssConfig),
          ],
        }),
<% } -%>
        ...getRollupPlugins({
          esm: true,
          extensions: defaultOptions.extensions,
          postcss: {
            extract: true,
            minimize: isProd,
            ...postcssConfig,
          },
        }),
        isProd && terser(),
        !isProd && browserSync({
          server: DIST,
          notify: false,
          open: false,
        }),
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
