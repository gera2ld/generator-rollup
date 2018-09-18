const fs = require('fs');
const path = require('path');
const Generator = require('yeoman-generator');
const globby = require('globby');

module.exports = class BaseGenerator extends Generator {
  _copyDir(src, dest) {
    const files = globby.sync(`${this.templatePath(src)}/**`, { nodir: true });
    const dir = this.destinationPath(dest);
    for (const file of files) {
      const destFile = path.join(dir, path.basename(file).replace(/^_/, '.'));
      this.fs.copyTpl(file, destFile, this.state);
    }
  }

  async prompting() {
    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      delete pkg.dependencies;
      delete pkg.devDependencies;
      delete pkg.main;
      delete pkg.files;
      delete pkg.private;
    } catch (err) {
      // ignore
    }
    pkg = pkg || {};
    const whenExportBundle = answers => {
      const options = {
        ...this.options,
        ...answers,
      };
      const output = options.output || [];
      return ['umd', 'iife'].some(fmt => output.includes(fmt));
    };
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
          { name: 'CommonJS', value: 'cjs' },
          { name: 'ES Module', value: 'esm' },
          { name: 'UMD', value: 'umd' },
          { name: 'IIFE', value: 'iife' },
        ],
        default: ['cjs', 'esm'],
        when: !this.options.output,
      },
      {
        name: 'bundleName',
        type: 'input',
        message: 'Bundle name',
        validate(value) {
          return /^(\w+\.)*\w+$/.test(value) || 'Invalid bundle name!';
        },
        when: !this.options.bundleName && whenExportBundle,
      },
      {
        name: 'minify',
        type: 'confirm',
        message: 'Do you want to generate minified version?',
        default: false,
        when: whenExportBundle,
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
    ]);
    this.state = {
      bundleName: 'noname',
      minify: false,
      ...this.options,
      ...answers,
      pkg,
    };
  }

  async rootFiles() {
    this._copyDir('_root', '.');
    this._copyDir('_scripts', 'scripts');
    this.fs.extendJSON(this.destinationPath('package.json'), {
      name: this.state.name.replace(/\s+/g, '-').toLowerCase(),
      ...this.state.pkg,
    });
  }

  app() {
    this.fs.copyTpl(
      this.templatePath(this.state.jsx ? 'src/index-jsx.js' : 'src/index.js'),
      this.destinationPath('src/index.js'),
      this.state,
    );
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
      'rollup-plugin-babel',
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
      '@babel/plugin-transform-runtime',

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
    const deps = [
      '@babel/runtime',
    ];
    if (this.state.css) {
      devDeps.push(...[
        'postcss',
        'autoprefixer',
        'precss',
        'postcss-modules',
        'cssnano',
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
    const res = this.spawnCommandSync('yarn', ['--version']);
    if (res.error && res.error.code === 'ENOENT') {
      this.npmInstall(devDeps, { saveDev: true });
      this.npmInstall(deps);
    } else {
      this.yarnInstall(devDeps, { dev: true });
      this.yarnInstall(deps);
    }
  }
}
