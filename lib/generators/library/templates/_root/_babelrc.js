module.exports = {
  extends: require.resolve('@gera2ld/plaid/config/babelrc-base'),
  presets: [
<% if (ts) { -%>
<% if (jsx) { -%>
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true,
    }],
<% } else { -%>
    '@babel/preset-typescript',
<% } -%>
<% } -%>
  ],
  plugins: [
<% if (jsx) { -%>

    // react
    '@babel/plugin-transform-react-jsx',
<% } -%>
  ].filter(Boolean),
};
