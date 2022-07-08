module.exports = {
  extends: require.resolve('@gera2ld/plaid/config/babelrc-base'),
  presets: [
<% if (features.includes('jsxDom')) { -%>
    '@babel/preset-react',
<% } -%>
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
};
