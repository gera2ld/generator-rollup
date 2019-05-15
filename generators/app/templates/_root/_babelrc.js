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
    ['module-resolver', {
      alias: {
        '#': './src',
      },
    }],
<% if (jsx) { -%>

    // react
    ['@babel/plugin-transform-react-jsx', {
      pragma: 'React.createElement',
      pragmaFrag: 'React.Fragment',
    }],
<% } -%>
<% if (test) { -%>

    process.env.BABEL_ENV === 'test' && 'istanbul',
<% } -%>
  ].filter(Boolean),
};
