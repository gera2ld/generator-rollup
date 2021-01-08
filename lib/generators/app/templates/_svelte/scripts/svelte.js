const svelte = require('rollup-plugin-svelte');
const { postcss: sveltePostcss } = require('svelte-preprocess');

function sveltePlugin({
  postcssConfig,
  generate,
}) {
  return svelte({
    compilerOptions: {
      generate,
    },
    emitCss: true,
    preprocess: [
      sveltePostcss(postcssConfig),
    ],
  });
}

exports.sveltePlugin = sveltePlugin;
