module.exports = {
  root: true,
  extends: [
    require.resolve('@gera2ld/plaid/eslint'),
<% if (ts) { -%>
    require.resolve('@gera2ld/plaid-common-ts/eslint'),
<% } -%>
<% if (features.includes('jsxDom')) { -%>
    require.resolve('@gera2ld/plaid-common-react/eslint'),
<% } -%>
<% if (features.includes('svelte')) { -%>
    require.resolve('@gera2ld/plaid-common-svelte/eslint'),
<% } -%>
  ],
<% if (ts) { -%>
  parserOptions: {
    project: './tsconfig.json',
  },
<% } -%>
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
  },
};
