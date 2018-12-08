module.exports = {
  extends: 'airbnb-base',
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
  },
  plugins: [
    'import',
<% if (jsx) { -%>
    'react',
<% } -%>
  ],
  rules: {
    'no-use-before-define': ['error', 'nofunc'],
    'no-mixed-operators': 0,
    'arrow-parens': 0,
    'no-plusplus': 0,
    'no-param-reassign': 0,
    'consistent-return': 0,
    'no-console': ['warn', {
      allow: ['error', 'warn', 'info'],
    }],
    'no-bitwise': ['error', { int32Hint: true }],
    indent: ['error', 2, { MemberExpression: 0 }],
<% if (jsx) { -%>
    'react/jsx-uses-react': 'error',
    'react/react-in-jsx-scope': 'error',
<% } -%>
  },
  settings: {
    'import/resolver': {
      'babel-module': {},
    },
<% if (jsx) { -%>
    react: {
      pragma: 'h',
    },
<% } -%>
  },
};