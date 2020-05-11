const { terser } = require('rollup-plugin-terser');
const { getRollupPlugins, defaultOptions, isProd } = require('@gera2ld/plaid');

const DIST = 'public';
const FILENAME = 'app';

<% const ext = ts ? '.ts' : '.js'; -%>
const rollupConfig = [
  {
    input: {
      input: 'src/index<%= ext %>',
      plugins: [
        ...getRollupPlugins({
          esm: true,
          extensions: defaultOptions.extensions,
          postcss: (config => ({
            ...config,
            extract: true,
            minimize: isProd,
            plugins: [
              ...config.plugins || [],
            ].filter(Boolean),
          }))(require('@gera2ld/plaid/config/postcssrc')),
        }),
        isProd && terser(),
        !isProd && serve(),
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

function serve() {
  let started = false;

  return {
    writeBundle() {
      if (!started) {
        started = true;

        require('child_process').spawn('npm', ['run', 'serve'], {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true
        });
      }
    }
  };
}
