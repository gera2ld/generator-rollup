const gulp = require('gulp');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const eslint = require('gulp-eslint');
const rollup = require('gulp-rollup');
const replace = require('gulp-replace');
const rename = require('gulp-rename');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const precss = require('precss');
const cssModules = require('postcss-modules');
const cssnano = require('cssnano');
const pkg = require('./package.json');

const DIST = 'dist';
const IS_PROD = process.env.NODE_ENV === 'production';
const BROWSERSLIST = [
  'last 2 Chrome versions',
];
const postcssPlugins = [
  precss(),
  autoprefixer({
    browsers: BROWSERSLIST,
  }),
  cssModules({
    getJSON(filename, json) {
      data.STYLES = JSON.stringify(json);
    },
  }),
  IS_PROD && cssnano(),
].filter(Boolean);
const data = {
  VERSION: pkg.version,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

const rollupOptions = {
  format: 'iife',
  plugins: [
    require('rollup-plugin-babel')({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
      presets: [
        [
          'env',
          {
            modules: false,
            targets: {
              browsers: BROWSERSLIST,
            },
          },
        ],
      ],
      plugins: [
        ['transform-runtime', { polyfill: false }],
      ],
    }),
    require('rollup-plugin-node-resolve')(),
    require('rollup-plugin-commonjs')({
      include: 'node_modules/**',
    }),
  ].filter(Boolean),
  allowRealFiles: true,
};

gulp.task('css', () => {
  const stream = gulp.src('src/style.css', {base: 'src'})
  .pipe(plumber(logError))
  .pipe(postcss(postcssPlugins));
  stream.on('data', file => {
    data.CSS = JSON.stringify(file.contents.toString());
  });
  return stream;
});

gulp.task('js', ['css'], () => {
  return gulp.src('src/app.js', {base: 'src'})
  .pipe(rollup(Object.assign({
    entry: 'src/app.js',
  }, rollupOptions)))
  .pipe(replace(/process\.env\.(\w+)/g, (m, key) => data[key] || null))
  .pipe(rename('app.user.js'))
  .pipe(gulp.dest(DIST));
});

gulp.task('lint', () => {
  return gulp.src('src/**/*.js')
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError());
});

gulp.task('build', ['js']);

gulp.task('watch', ['build'], () => {
  gulp.watch('src/**', ['js']);
});

function logError(err) {
  gutil.log(err.toString());
  return this.emit('end');
}
