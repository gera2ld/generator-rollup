module.exports = {
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
    ['@babel/preset-env', {
<% if (test) { -%>
      ...process.env.BABEL_ENV !== 'test' && {
        modules: false,
      },
<% } else { -%>
      modules: false,
<% } -%>
      loose: true,
    }],
  ],
  plugins: [
    // stage-1
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-proposal-export-default-from',
    ['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }],

    // stage-2
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    '@babel/plugin-proposal-function-sent',
    '@babel/plugin-proposal-numeric-separator',
    '@babel/plugin-proposal-throw-expressions',

    // stage-3
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-syntax-import-meta',
    // Use loose mode: facebook/create-react-app#4263
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    '@babel/plugin-proposal-json-strings',

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
