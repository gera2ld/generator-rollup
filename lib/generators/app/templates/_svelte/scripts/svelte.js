const svelte = require('rollup-plugin-svelte');
const { postcss: sveltePostcss } = require('svelte-preprocess');

function sveltePlugin({
  isProd,
  postcssConfig,
  generate,
}) {
  return svelte({
    dev: !isProd,
    emitCss: true,
    generate,
    preprocess: [
      sveltePostcss(postcssConfig),
    ],
  });
}

function generateSSR(app) {
}

exports.sveltePlugin = sveltePlugin;
