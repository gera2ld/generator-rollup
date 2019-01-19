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
      delete pkg.module;
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
        name: 'ts',
        type: 'confirm',
        message: 'Do you want to use TypeScript?',
        default: false,
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
      {
        name: 'test',
        type: 'confirm',
        message: 'Would you like to add tests?',
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
    const pkg = {
      name: this.state.name.replace(/\s+/g, '-').toLowerCase(),
      ...this.state.pkg,
      scripts: {
        ...this.state.pkg.scripts,
        dev: 'gulp dev',
        prebuild: 'npm run ci && gulp clean',
        ci: 'npm run lint',
      },
    };
    let hasFiles = false;
    if (this.state.output.includes('cjs')) {
      pkg.main = 'dist/index.common.js';
      hasFiles = true;
    } else if (this.state.output.includes('umd')) {
      pkg.main = 'dist/index.js';
      hasFiles = true;
    }
    if (this.state.output.includes('esm')) {
      pkg.module = 'dist/index.esm.js';
      hasFiles = true;
    }
    if (hasFiles) {
      pkg.files = ['dist'];
    }
    if (this.state.ts) {
      pkg.files = [
        ...pkg.files || [],
        'types',
      ];
      pkg.typings = 'types/index.d.ts';
      pkg.scripts = {
        ...pkg.scripts,
        build: 'tsc && gulp build',
        lint: 'tslint -c tslint.json \'src/**/*.ts\'',
      };
      this._copyDir('_ts', '.');
    } else {
      pkg.scripts = {
        ...pkg.scripts,
        build: 'gulp build',
        lint: 'eslint .',
      };
      this._copyDir('_js', '.');
    }
    if (this.state.test) {
      pkg.scripts = {
        ...pkg.scripts,
        ci: 'npm run lint && npm run test',
        test: 'cross-env BABEL_ENV=test tape -r ./test/mock/register \'test/**/*.test.js\'',
        cov: 'nyc --reporter=text --reporter=html npm test',
        'cov:open': 'open coverage/index.html',
      };
      pkg.nyc = {
        include: [
          'src/**',
        ],
      };
    }
    this.fs.extendJSON(this.destinationPath('package.json'), pkg);
  }

  app() {
    const ext = this.state.ts ? '.ts' : '.js';
    this.fs.copyTpl(this.templatePath('src/index.js'), this.destinationPath(`src/index${ext}`), this.state);
    this.fs.copy(this.templatePath('src/util.js'), this.destinationPath(`src/util${ext}`));
    if (this.state.ts) {
      this.fs.copy(this.templatePath('src/index.d.ts'), this.destinationPath('src/index.d.ts'));
    }
    if (this.state.css) {
      this.fs.copy(this.templatePath('src/style.css'), this.destinationPath('src/style.css'));
    }
    if (this.state.test) {
      this.fs.copy(this.templatePath('test'), this.destinationPath('test'));
    }
  }

  install() {
    const devDeps = [
      'cross-env',
      'del',
      'gulp',
      'fancy-log',
      'rollup',
      'rollup-plugin-babel',
      'rollup-plugin-replace',
      'rollup-plugin-node-resolve',
      'rollup-plugin-commonjs',
      'rollup-plugin-alias',
      'husky',
      '@babel/core',
      '@babel/preset-env',
      '@babel/plugin-transform-runtime',
      'babel-plugin-module-resolver',

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
    if (this.state.ts) {
      devDeps.push(
        '@babel/preset-typescript',
        'typescript',
        'tslint',
      );
    } else {
      devDeps.push(
        'eslint',
        'eslint-config-airbnb-base',
        'eslint-plugin-import',
        'babel-eslint',
        'eslint-import-resolver-babel-module@beta',
      );
    }
    if (this.state.css) {
      devDeps.push(
        'postcss',
        'postcss-scss',
        'precss',
        'postcss-color-function',
        'postcss-calc',
        'postcss-modules',
        'cssnano',
      );
    }
    if (this.state.minify) {
      devDeps.push(
        'rollup-plugin-uglify',
      );
    }
    if (this.state.jsx) {
      devDeps.push(
        '@babel/plugin-transform-react-jsx',
        'eslint-plugin-react',
      );
      deps.push(
        '@gera2ld/jsx-dom',
      );
    }
    if (this.state.test) {
      devDeps.push(
        'tape',
        '@babel/register',
        'babel-plugin-istanbul',
        'nyc',
      );
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
