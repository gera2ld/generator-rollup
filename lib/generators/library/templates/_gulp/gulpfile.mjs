import log from 'fancy-log';
import rollup from 'rollup';
import del from 'del';
import plaid from '@gera2ld/plaid';

const { defaultOptions } = plaid;

const DIST = defaultOptions.distDir;

function loadConfig() {
  const rollupConfig = require('./rollup.conf');
  return rollupConfig;
}

export function clean() {
  return del([DIST<% if (ts) { %>, 'types'<% } %>]);
}

export function build() {
  const rollupConfig = loadConfig();
  return Promise.all(rollupConfig.map(async (config) => {
    const bundle = await rollup.rollup(config);
    await bundle.write(config.output);
  }));
}

function watchJs() {
  const rollupConfig = loadConfig();
  const watcher = rollup.watch(rollupConfig);
  watcher.on('event', e => {
    if (e.code === 'ERROR') {
      console.error();
      console.error(`${e.error}`);
      console.error();
    } else if (e.code === 'BUNDLE_END') {
      log(`Compilation success after ${e.duration}ms`);
    }
  });
}

function wrapError(handle) {
  const wrapped = () => handle()
  .catch(err => {
    log(err.toString());
  });
  wrapped.displayName = handle.name;
  return wrapped;
}

export function dev() {
  watchJs();
}
