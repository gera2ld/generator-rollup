module.exports = {
  extends: require.resolve('@gera2ld/plaid/config/babelrc-base'),
  presets: [
<% if (ts) { -%>
<% if (jsx) { -%>
    ['@babel/preset-typescript', {
      isTSX: true,
      jsxPragma: 'h',
      allExtensions: true,
    }],
<% } else { -%>
    '@babel/preset-typescript',
<% } -%>
<% } -%>
  ],
  plugins: [
    ['module-resolver', {
      alias: {
        '#': './src',
      },
    }],
<% if (jsx) { -%>

    // react
    ['@babel/plugin-transform-react-jsx', {
      pragma: 'h',
    }],
<% } -%>
<% if (test) { -%>

    process.env.BABEL_ENV === 'test' && 'istanbul',
<% } -%>
  ].filter(Boolean),
};
