const {
  defaultOptions,
  getRollupExternal,
  getRollupPlugins,
  loadConfigSync,
} = require('@gera2ld/plaid');
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
const postcssConfig = loadConfigSync('postcss') || require('@gera2ld/plaid/config/postcssrc');
const postcssOptions = {
  ...postcssConfig,
  inject: false,
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
      file: `${DIST}/${FILENAME}.mjs`,
    },
  },
<% } -%>
<% if (output.includes('umd')) { -%>
  ...[false<% if (minify) { -%>, true<% } -%>].map(minimize => ({
    input: {
      input: 'src/index<%= ext %>',
      plugins: getRollupPlugins({
        minimize,
        esm: true,
        extensions: defaultOptions.extensions,
        postcss: {
          ...postcssOptions,
          extract: 'style.css',
        },
      }),
    },
    output: {
      format: 'umd',
      file: `${DIST}/${FILENAME}.umd${minimize ? '.min' : ''}.js`,
      name: '<%= bundleName %>',
      ...bundleOptions,
    },
  })),
<% } -%>
<% if (output.includes('iife')) { -%>
  ...[false<% if (minify) { -%>, true<% } -%>].map(minimize => ({
    input: {
      input: 'src/index<%= ext %>',
      plugins: getRollupPlugins({
        minimize,
        esm: true,
        extensions: defaultOptions.extensions,
        postcss: {
          ...postcssOptions,
          extract: 'style.css',
        },
      }),
    },
    output: {
      format: 'iife',
      file: `${DIST}/${FILENAME}${minimize ? '.min' : ''}.js`,
      name: '<%= bundleName %>',
      ...bundleOptions,
    },
  })),
<% } -%>
];

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
