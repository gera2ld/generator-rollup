const fs = require('mz/fs');
const Generator = require('yeoman-generator');

module.exports = class WebpackGenerator extends Generator {
  async prompting() {
    let pkg;
    try {
      pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
      delete pkg.scripts;
      delete pkg.dependencies;
      delete pkg.devDependencies;
    } catch (err) {
      // ignore
    }
    pkg = pkg || {};
    const answers = await this.prompt([
      {
        name: 'name',
        type: 'input',
        message: 'Your project name',
        default: pkg.name || this.appname,
      },
      {
        name: 'output',
        type: 'checkbox',
        message: 'Which types of output would you like to generate?',
        choices: [
          { name: 'UMD', value: 'umd' },
          { name: 'CommonJS', value: 'cjs' },
          { name: 'IIFE', value: 'iife' },
        ],
        default: ['umd'],
      },
      {
        name: 'outputDir',
        type: 'input',
        message: 'The name of your output directory',
        default: 'dist',
        validate(value) {
          return /^[\w-]+$/.test(value) || 'Invalid directory name!';
        },
      },
      {
        name: 'hasMain',
        type: 'confirm',
        message: 'Would you like to add a main script?',
        default: true,
      },
    ]);
    if (answers.output.includes('umd')) {
      Object.assign(answers, await this.prompt([
        {
          name: 'bundleName',
          type: 'input',
          message: 'Bundle name for UMD',
          validate(value) {
            return /^\w+$/.test(value) || 'Invalid bundle name!';
          },
        },
      ]));
    }
    Object.assign(answers, await this.prompt([
      {
        name: 'minify',
        type: 'confirm',
        message: 'Do you want to generate minified version?',
        default: false,
      },
      {
        name: 'jsx',
        type: 'confirm',
        message: 'Do you want to enable JSX support?',
        default: false,
      },
      {
        name: 'css',
        type: 'confirm',
        message: 'Would you like to import CSS as string?',
        default: false,
      },
    ]));
    if (answers.css) {
      Object.assign(answers, await this.prompt([
        {
          name: 'cssModules',
          type: 'confirm',
          message: 'Would you like to use CSS modules?',
          default: false,
        },
      ]));
    }
    this.state = Object.assign(answers, { pkg });
  }

  async rootFiles() {
    const rootFileDir = this.templatePath('_root');
    const files = await fs.readdir(rootFileDir);
    files.forEach(name => {
      if (name.startsWith('.')) return;
      this.fs.copyTpl(`${rootFileDir}/${name}`, this.destinationPath(name.replace(/^_/, '.')), this.state);
    });
    this.fs.extendJSON(this.destinationPath('package.json'), Object.assign({
      name: this.state.name.replace(/\s+/g, '-').toLowerCase(),
    }, this.state.pkg));
  }

  app() {
    this.fs.copyTpl(this.templatePath('src/index.js'), this.destinationPath('src/index.js'), this.state);
    if (this.state.css) {
      this.fs.copy(this.templatePath('src/style.css'), this.destinationPath('src/style.css'));
    }
  }

  install() {
    const devDeps = [
      'cross-env',
      'del',
      'gulp@next',
      'fancy-log',
      'rollup',
      'rollup-plugin-babel@beta',
      'rollup-plugin-replace',
      'rollup-plugin-node-resolve',
      'rollup-plugin-commonjs',
      'husky@next',
      'eslint',
      'eslint-config-airbnb-base',
      'eslint-plugin-import',
      'babel-eslint',
      '@babel/core',
      '@babel/preset-env',

      // stage-2
      '@babel/plugin-proposal-decorators',
      '@babel/plugin-proposal-function-sent',
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-numeric-separator',
      '@babel/plugin-proposal-throw-expressions',

      // stage-3
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-syntax-import-meta',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-json-strings',
    ];
    const deps = [];
    if (this.state.css) {
      devDeps.push(...[
        'postcss',
        'autoprefixer',
        'precss',
        'postcss-modules',
        'cssnano@next', // use cssnano v4 with safe preset
      ]);
    }
    if (this.state.minify) {
      devDeps.push(...[
        'rollup-plugin-uglify',
      ]);
    }
    if (this.state.jsx) {
      devDeps.push(...[
        '@babel/plugin-transform-react-jsx',
        'eslint-plugin-react',
      ]);
      deps.push(...[
        '@gera2ld/jsx-dom',
      ]);
    }
    if (this.state.output.includes('cjs')) {
      devDeps.push(...[
        '@babel/plugin-transform-runtime',
      ]);
      deps.push(...[
        '@babel/runtime',
      ]);
    }
    const res = this.spawnCommandSync('yarn', ['--version']);
    if (res.error && res.error.code === 'ENOENT') {
      this.npmInstall(devDeps, {saveDev: true});
      this.npmInstall(deps);
    } else {
      this.yarnInstall(devDeps, {dev: true});
      this.yarnInstall(deps);
    }
  }
}
