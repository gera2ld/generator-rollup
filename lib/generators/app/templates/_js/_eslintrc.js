module.exports = {
  root: true,
  extends: [
    require.resolve('@gera2ld/plaid/eslint'),
<% if (features.includes('jsxDom')) { -%>
    require.resolve('@gera2ld/plaid-common-react/eslint'),
<% } -%>
<% if (features.includes('svelte')) { -%>
    require.resolve('@gera2ld/plaid-common-svelte/eslint'),
<% } -%>
  ],
  parserOptions: {
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
  },
};
