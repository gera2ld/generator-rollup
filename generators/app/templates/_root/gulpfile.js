const path = require('path');
const gulp = require('gulp');
const log = require('fancy-log');
const rollup = require('rollup');
const del = require('del');
<% if (minify) { -%>
const { uglify } = require('rollup-plugin-uglify');
<% } -%>
const { getRollupPlugins, getExternal } = require('./scripts/util');

const DIST = 'dist';
const FILENAME = 'index';

<% const ext = ts ? '.ts' : '.js'; -%>
const rollupConfig = [
<% if (output.includes('cjs')) { -%>
  {
    input: {
      input: 'src/index<%= ext %>',
      plugins: getRollupPlugins(),
      external: getExternal(),
    },
    output: {
      format: 'cjs',
      file: `${DIST}/${FILENAME}.common.js`,
    },
  },
<% } -%>
<% if (output.includes('esm')) { -%>
  {
    input: {
      input: 'src/index<%= ext %>',
      plugins: getRollupPlugins(),
      external: getExternal(),
    },
    output: {
      format: 'esm',
      file: `${DIST}/${FILENAME}.esm.js`,
    },
  },
<% } -%>
<% if (output.includes('umd')) { -%>
  {
    input: {
      input: 'src/index<%= ext %>',
      plugins: getRollupPlugins({ browser: true }),
    },
    output: {
      format: 'umd',
      file: `${DIST}/${FILENAME}.js`,
      name: '<%= bundleName %>',
    },
<% if (minify) { -%>
    minify: true,
<% } -%>
  },
<% } -%>
<% if (output.includes('iife')) { -%>
  {
    input: {
      input: 'src/index<%= ext %>',
      plugins: getRollupPlugins({ browser: true }),
    },
    output: {
      format: 'iife',
      file: `${DIST}/${FILENAME}.iife.js`,
      name: '<%= bundleName %>',
    },
<% if (minify) { -%>
    minify: true,
<% } -%>
  },
<% } -%>
];
<% if (minify) { -%>
// Generate minified versions
Array.from(rollupConfig)
.filter(({ minify }) => minify)
.forEach(config => {
  rollupConfig.push({
    input: {
      ...config.input,
      plugins: [
        ...config.input.plugins,
        uglify(),
      ],
    },
    output: {
      ...config.output,
      file: config.output.file.replace(/\.js$/, '.min.js'),
    },
  });
});
<% } -%>
<% if (test) { -%>

const testConfig = [
  {
    input: {
      input: 'test/index.js',
      plugins: getRollupPlugins(),
      external: id => /node_modules/.test(id),
    },
    output: {
      format: 'cjs',
      file: `${DIST}/test.js`,
    },
  },
];
<% } -%>

function clean() {
  return del([DIST<% if (ts) { %>, 'types'<% } %>]);
}

function buildJs() {
  return Promise.all(rollupConfig.map(config => {
    return rollup.rollup(config.input)
    .then(bundle => bundle.write(config.output));
  }));
}
<% if (test) { -%>

function buildTest() {
  return Promise.all(testConfig.map(config => {
    return rollup.rollup(config.input)
    .then(bundle => bundle.write(config.output));
  }));
}
<% } -%>

function wrapError(handle) {
  const wrapped = () => handle()
  .catch(err => {
    log(err.toString());
  });
  wrapped.displayName = handle.name;
  return wrapped;
}

function watch() {
  gulp.watch('src/**', safeBuildJs);
}

const safeBuildJs = wrapError(buildJs);

exports.clean = clean;
exports.build = buildJs;
exports.dev = gulp.series(safeBuildJs, watch);
<% if (test) { -%>
exports.buildTest = buildTest;
<% } -%>
