const gulp = require('gulp');
const log = require('fancy-log');
const rollup = require('rollup');
const del = require('del');
const { defaultOptions } = require('@gera2ld/plaid');

const DIST = defaultOptions.distDir;

function loadConfig() {
  const rollupConfig = require('./rollup.conf');
  return rollupConfig;
}

function clean() {
  return del([DIST<% if (ts) { %>, 'types'<% } %>]);
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
exports.build = buildJs;
exports.dev = watch;
