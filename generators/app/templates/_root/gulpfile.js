const path = require('path');
const gulp = require('gulp');
const log = require('fancy-log');
const rollup = require('rollup');
const del = require('del');
<% if (css) { -%>
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const precss = require('precss');
const cssModules = require('postcss-modules');
const cssnano = require('cssnano');
<% } -%>
const pkg = require('./package.json');

const DIST = 'dist';
const IS_PROD = process.env.NODE_ENV === 'production';
<% if (css) { -%>
const USE_CSS_MODULES = <%= !!cssModules %>;
<% } -%>
const values = {
  'process.env.VERSION': pkg.version,
  'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
};

<% if (css) { -%>
const cssExportMap = {};
const postcssPlugins = [
  precss(),
  autoprefixer(),
  USE_CSS_MODULES && cssModules({
    getJSON(id, json) {
      cssExportMap[id] = json;
    },
  }),
  IS_PROD && cssnano(),
].filter(Boolean);
<% } -%>

const rollupOptions = {
  plugins: [
<% if (css) { -%>
    {
      transform(code, id) {
        if (path.extname(id) !== '.css') return;
        return postcss(postcssPlugins).process(code, { from: id })
        .then(result => {
          const classMap = cssExportMap[id];
          return [
            `export const css = ${JSON.stringify(result.css)};`,
            classMap && `export const classMap = ${JSON.stringify(classMap)};`,
          ].filter(Boolean).join('\n');
        });
      },
    },
<% } -%>
    require('rollup-plugin-babel')({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
    }),
    require('rollup-plugin-replace')({ values }),
  ],
};

function clean() {
  return del(DIST);
}

function buildJs() {
  return rollup.rollup(Object.assign({
    input: 'src/index.js',
  }, rollupOptions))
  .then(bundle => bundle.write({
<% if (locals.bundleName) { -%>
    name: '<%= bundleName %>',
<% } -%>
    file: `${DIST}/index.js`,
    format: '<%= output %>',
  }))
  .catch(err => {
    log(err.toString());
  });
}

function watch() {
  gulp.watch('src/**', buildJs);
}

exports.clean = clean;
exports.build = buildJs;
exports.dev = gulp.series(buildJs, watch);
