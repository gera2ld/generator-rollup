module.exports = {
  extends: require.resolve('@gera2ld/plaid/config/babelrc-base'),
  presets: [
<% if (ts) { -%>
<% if (features.includes('jsxDom')) { -%>
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
<% if (features.includes('jsxDom')) { -%>

    // react
    '@babel/plugin-transform-react-jsx',
<% } -%>
  ].filter(Boolean),
};
