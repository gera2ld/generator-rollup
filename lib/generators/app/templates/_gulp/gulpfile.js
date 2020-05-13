const gulp = require('gulp');
const log = require('fancy-log');
const rollup = require('rollup');
const del = require('del');
const { defaultOptions } = require('@gera2ld/plaid');
const rollupConfig = require('./rollup.conf');

const DIST = 'dist';

function clean() {
  return del([DIST<% if (ts) { %>, 'types'<% } %>]);
}

function copy() {
  return gulp.src('src/public/**')
    .pipe(gulp.dest(DIST));
}

function buildJs() {
  return Promise.all(rollupConfig.map(async (config) => {
    const bundle = await rollup.rollup(config);
    await bundle.write(config.output);
  }));
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
  gulp.watch('src/**', safeBuildJs);
}

const safeBuildJs = wrapError(buildJs);

exports.clean = clean;
exports.build = gulp.series(copy, buildJs);
exports.dev = gulp.series(copy, safeBuildJs, watch);
