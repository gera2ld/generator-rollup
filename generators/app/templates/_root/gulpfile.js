const path = require('path');
const gulp = require('gulp');
const log = require('fancy-log');
const rollup = require('rollup');
const del = require('del');
const babel = require('rollup-plugin-babel');
const replace = require('rollup-plugin-replace');
<% if (minify) { -%>
const uglify = require('rollup-plugin-uglify');
<% } -%>
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

const commonConfig = {
  input: {
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
      babel({
        exclude: 'node_modules/**',
        externalHelpers: true,
      }),
      replace({ values }),
    ],
  },
};
const rollupConfig = [
<% output.forEach((format, i) => { -%>
  {
    input: {
      ...commonConfig.input,
      input: 'src/index.js',
    },
    output: {
      ...commonConfig.output,
      format: '<%= format %>',
<% if (format === 'umd') { -%>
      name: '<%= bundleName %>',
<% } -%>
      file: `${DIST}/index<%= i ? `.${format}` : '' %>.js`,
    },
<% if (minify && format !== 'cjs') { -%>
    minify: true,
<% } -%>
  },
<% }) -%>
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

function clean() {
  return del(DIST);
}

function buildJs() {
  return Promise.all(rollupConfig.map(config => {
    return rollup.rollup(config.input)
    .then(bundle => bundle.write(config.output))
    .catch(err => {
      log(err.toString());
    });
  }));
}

function watch() {
  gulp.watch('src/**', buildJs);
}

exports.clean = clean;
exports.build = buildJs;
exports.dev = gulp.series(buildJs, watch);
