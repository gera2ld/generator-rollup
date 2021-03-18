module.exports = {
  root: true,
  extends: [
    require.resolve('@gera2ld/plaid/eslint'),
<% if (jsx) { -%>
    require.resolve('@gera2ld/plaid-common-react/eslint'),
<% } -%>
  ],
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
<% if (jsx) { -%>
    react: {
      pragma: 'React',
    },
<% } -%>
  },
};
