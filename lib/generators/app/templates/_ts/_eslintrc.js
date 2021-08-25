module.exports = {
  root: true,
  extends: [
    require.resolve('@gera2ld/plaid-common-ts/eslint'),
<% if (features.includes('jsxDom')) { -%>
    require.resolve('@gera2ld/plaid-common-react/eslint'),
<% } -%>
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
};
