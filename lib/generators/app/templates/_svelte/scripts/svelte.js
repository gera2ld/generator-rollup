const svelte = require('rollup-plugin-svelte');

function sveltePlugin({
  isProd,
  generate = 'dom',
}) {
  return svelte({
    emitCss: true,
    compilerOptions: {
      dev: !isProd,
      generate,
    },
  });
}

exports.sveltePlugin = sveltePlugin;
