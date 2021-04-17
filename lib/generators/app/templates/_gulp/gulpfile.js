const gulp = require('gulp');
const log = require('fancy-log');
const rollup = require('rollup');
const del = require('del');

const DIST = 'dist';

function loadConfig() {
  const rollupConfig = require('./rollup.conf');
  return rollupConfig;
}

function clean() {
  return del([DIST<% if (ts) { %>, 'types'<% } %>]);
}

function copy() {
  return gulp.src('src/public/**')
    .pipe(gulp.dest(DIST));
}

function buildJs() {
  const rollupConfig = loadConfig();
  return Promise.all(rollupConfig.map(async (config) => {
    const bundle = await rollup.rollup(config);
    await bundle.write(config.output);
  }));
}

function watchJs() {
  const rollupConfig = loadConfig();
  rollup.watch(rollupConfig);
}

function wrapError(handle) {
  const wrapped = () => handle()
    .catch(err => {
      log(err.toString());
    });
  wrapped.displayName = handle.name;
  return wrapped;
}

function watch() {
  watchJs();
}

exports.clean = clean;
exports.build = gulp.series(copy, buildJs);
exports.dev = gulp.series(copy, watch);
