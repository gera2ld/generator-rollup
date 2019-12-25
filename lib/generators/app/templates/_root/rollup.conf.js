const rollup = require('rollup');
<% if (minify) { -%>
const { terser } = require('rollup-plugin-terser');
<% } -%>
const { getRollupPlugins, getExternal, DIST } = require('./scripts/util');
const pkg = require('./package.json');

const FILENAME = 'index';
const BANNER = <% if (typeof banner === 'string') {
%><%- banner %><%
} else if (banner) {
%>`/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`<%
} else {
%>false<%
} %>;

<% const ext = ts ? '.ts' : '.js'; -%>
const external = getExternal();
const rollupConfig = [
<% if (output.includes('cjs')) { -%>
  {
    input: {
      input: 'src/index<%= ext %>',
      plugins: getRollupPlugins(),
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
      plugins: getRollupPlugins(),
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
      plugins: getRollupPlugins(),
    },
    output: {
      format: 'umd',
      file: `${DIST}/${FILENAME}.umd.js`,
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
      plugins: getRollupPlugins(),
    },
    output: {
      format: 'iife',
      file: `${DIST}/${FILENAME}.js`,
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
rollupConfig.filter(({ minify }) => minify)
.forEach(config => {
  rollupConfig.push({
    input: {
      ...config.input,
      plugins: [
        ...config.input.plugins,
        terser({
          output: {
            ...BANNER && {
              preamble: BANNER,
            },
          },
        }),
      ],
    },
    output: {
      ...config.output,
      file: config.output.file.replace(/\.js$/, '.min.js'),
    },
  });
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
