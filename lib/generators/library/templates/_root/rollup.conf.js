const { getRollupPlugins, getRollupExternal, defaultOptions, rollupMinify } = require('@gera2ld/plaid');
const pkg = require('./package.json');

const DIST = defaultOptions.distDir;
const FILENAME = 'index';
const BANNER = <% if (typeof banner === 'string') {
%><%- banner %><%
} else if (banner) {
%>`/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`<%
} else {
%>false<%
} %>;

<% const ext = ts ? '.ts' : '.js'; -%>
const external = getRollupExternal();
const bundleOptions = {
  extend: true,
  esModule: false,
};
const postcssConfig = require('@gera2ld/plaid/config/postcssrc');
const postcssOptions = {
  ...postcssConfig,
  inject: false,
  minimize: true,
};
const rollupConfig = [
<% if (output.includes('cjs')) { -%>
  {
    input: {
      input: 'src/index<%= ext %>',
      plugins: getRollupPlugins({
        extensions: defaultOptions.extensions,
        postcss: postcssOptions,
      }),
      external,
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
      plugins: getRollupPlugins({
        esm: true,
        extensions: defaultOptions.extensions,
        postcss: postcssOptions,
      }),
      external,
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
      plugins: getRollupPlugins({
        esm: true,
        extensions: defaultOptions.extensions,
        postcss: postcssOptions,
      }),
    },
    output: {
      format: 'umd',
      file: `${DIST}/${FILENAME}.umd.js`,
      name: '<%= bundleName %>',
      ...bundleOptions,
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
      plugins: getRollupPlugins({
        esm: true,
        extensions: defaultOptions.extensions,
        postcss: postcssOptions,
      }),
    },
    output: {
      format: 'iife',
      file: `${DIST}/${FILENAME}.js`,
      name: '<%= bundleName %>',
      ...bundleOptions,
    },
<% if (minify) { -%>
    minify: true,
<% } -%>
  },
<% } -%>
];
<% if (minify) { -%>
// Generate minified versions
rollupConfig.filter(({ minify }) => minify)
.forEach(config => {
  rollupConfig.push(rollupMinify(config));
});
<% } -%>

rollupConfig.forEach((item) => {
  item.output = {
    indent: false,
    // If set to false, circular dependencies and live bindings for external imports won't work
    externalLiveBindings: false,
    ...item.output,
    ...BANNER && {
      banner: BANNER,
    },
  };
});

module.exports = rollupConfig.map(({ input, output }) => ({
  ...input,
  output,
}));
