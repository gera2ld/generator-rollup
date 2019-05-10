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
    const defaults = {
      bundleName: 'noname',
      banner: true,
      minify: false,
      pkg,
    };
    const state = {
      ...this.options,
    };
    const whenExportBundle = answers => {
      const { output } = {
        ...state,
        ...answers,
      };
      return output && ['umd', 'iife'].some(fmt => output.includes(fmt));
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
        name: 'gulp',
        type: 'confirm',
        message: 'Do you want to use Gulp?',
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
        when: !state.output,
      },
      {
        name: 'bundleName',
        type: 'input',
        message: 'Bundle name',
        validate(value) {
          return /^(\w+\.)*\w+$/.test(value) || 'Invalid bundle name!';
        },
        when: !state.bundleName && whenExportBundle,
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
      ...defaults,
      ...state,
      ...answers,
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
        ...this.state.gulp ? {
          dev: 'gulp dev',
          clean: 'gulp clean',
          'build:js': 'gulp build',
        } : {
          dev: 'rollup -wc rollup.conf.js',
          clean: `del dist${this.state.ts ? ' types' : ''}`,
          'build:js': 'rollup -c rollup.conf.js',
        },
        prebuild: 'npm run ci && npm run clean',
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
    if (this.state.output.includes('umd')) {
      const cdnEntry = this.state.minify ? 'dist/index.min.js' : 'dist/index.js';
      pkg.unpkg = cdnEntry;
      pkg.jsdelivr = cdnEntry;
    }
    if (this.state.output.includes('esm')) {
      pkg.module = 'dist/index.esm.js';
      hasFiles = true;
    }
    if (hasFiles) {
      pkg.files = ['dist'];
      pkg.publishConfig = {
        access: 'public',
      };
    }
    if (this.state.ts) {
      pkg.files = [
        ...pkg.files || [],
        'types',
      ];
      pkg.typings = 'types/index.d.ts';
      pkg.scripts = {
        ...pkg.scripts,
        build: 'tsc && npm run build:js',
        lint: 'tslint -c tslint.json \'src/**/*.ts\'',
      };
      this._copyDir('_ts', '.');
    } else {
      pkg.scripts = {
        ...pkg.scripts,
        build: 'npm run build:js',
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
      'rollup',
      'rollup-plugin-babel',
      'rollup-plugin-replace',
      'rollup-plugin-node-resolve',
      'rollup-plugin-commonjs',
      'rollup-plugin-alias',
      'husky',
      '@gera2ld/plaid@~1.4.0',
    ];
    const deps = [
      '@babel/runtime',
    ];
    if (this.state.gulp) {
      devDeps.push(
        'gulp',
        'del',
        'fancy-log',
      );
    } else {
      devDeps.push(
        'del-cli',
      );
    }
    if (this.state.ts) {
      devDeps.push(
        '@babel/preset-typescript',
        'typescript',
        'tslint',
      );
    } else {
      devDeps.push(
        'eslint',
        'babel-eslint',
        'eslint-import-resolver-babel-module',
      );
    }
    if (this.state.css) {
      devDeps.push(
        'postcss',
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
        '@gera2ld/plaid-react@~1.4.0',
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
