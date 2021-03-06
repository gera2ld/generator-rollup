const fs = require('fs');
const Generator = require('yeoman-generator');
const { install, concatList, loadDeps, copyDir, join } = require('../../util');

module.exports = class BaseGenerator extends Generator {
  _copyDir(src, dest) {
    copyDir(this, src, dest, this.state);
  }

  _updateDeps() {
    const devDepList = [
      '@gera2ld/plaid',
      '@gera2ld/plaid-rollup',
      'husky',
    ];
    const depList = [
      '@babel/runtime',
    ];
    if (this.state.gulp) {
      devDepList.push(
        'gulp',
        'del',
        'fancy-log',
      );
    } else {
      devDepList.push(
        'del-cli',
      );
    }
    if (this.state.ts) {
      devDepList.push(
        '@gera2ld/plaid-common-ts',
      );
    }
    if (this.state.jsx) {
      devDepList.push(
        '@gera2ld/plaid-common-react',
      );
      depList.push(
        '@gera2ld/jsx-dom',
      );
    }
    if (this.state.test) {
      devDepList.push(
        '@gera2ld/plaid-test',
      );
    }
    this.state.depList = concatList(this.state.depList, depList);
    this.state.devDepList = concatList(this.state.devDepList, devDepList);
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
    const state = {
      bundleName: null,
      banner: true,
      cdn: true,
      minify: null,
      publish: true,
      pkg,
      year: new Date().getFullYear(),
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
        name: 'author',
        type: 'input',
        message: 'Author',
        default: pkg.author,
      },
      {
        name: 'ts',
        type: 'confirm',
        message: 'Do you want to use TypeScript?',
        default: true,
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
          { name: 'IIFE', value: 'iife' },
          { name: 'UMD', value: 'umd' },
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
        when: state.minify == null && whenExportBundle,
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
      ...state,
      ...answers,
    };
    this._updateDeps();
  }

  rootFiles() {
    this._copyDir('_root', '.');
    const pkg = {
      name: this.state.name.replace(/\s+/g, '-').toLowerCase(),
      ...this.state.pkg,
      author: this.state.author,
      scripts: {
        ...this.state.pkg.scripts,
        ci: join(['run-s', 'lint', this.state.test && 'test']),
        lint: join([
          'eslint',
          this.state.ts && '--ext .ts,tsx',
          'src',
          this.state.test && 'test',
        ]),
        ...this.state.gulp ? {
          dev: 'gulp dev',
          clean: 'gulp clean',
          'build:js': 'cross-env NODE_ENV=production gulp build',
        } : {
          dev: 'rollup -wc rollup.conf.js',
          clean: join([
            'del-cli',
            'dist',
            this.state.ts && 'types',
          ]),
          'build:js': 'cross-env NODE_ENV=production rollup -c rollup.conf.js',
        },
        build: join([
          'run-s',
          'ci',
          'clean',
          this.state.ts && 'build:types',
          'build:js',
        ]),
        prepare: 'husky install',
      },
    };
    if (this.state.gulp) {
      this._copyDir('_gulp', '.');
    }
    let hasFiles = false;
    if (this.state.publish) {
      if (this.state.output.includes('cjs')) {
        pkg.main = 'dist/index.common.js';
        hasFiles = true;
      } else if (this.state.output.includes('iife')) {
        pkg.main = 'dist/index.js';
        hasFiles = true;
      } else if (this.state.output.includes('umd')) {
        pkg.main = 'dist/index.umd.js';
        hasFiles = true;
      }
      if (this.state.cdn) {
        let cdnEntry;
        if (this.state.output.includes('iife')) {
          cdnEntry = this.state.minify ? 'dist/index.min.js' : 'dist/index.js';
        } else if (this.state.output.includes('umd')) {
          cdnEntry = this.state.minify ? 'dist/index.umd.min.js' : 'dist/index.umd.js';
        }
        pkg.unpkg = cdnEntry;
        pkg.jsdelivr = cdnEntry;
      }
      if (this.state.output.includes('esm')) {
        pkg.module = 'dist/index.esm.js';
        hasFiles = true;
      }
    }
    if (hasFiles) {
      pkg.files = ['dist'];
      pkg.publishConfig = {
        access: 'public',
        registry: 'https://registry.npmjs.org/',
      };
    }
    if (this.state.ts) {
      if (hasFiles) {
        pkg.files.push(
          'types',
        );
      }
      pkg.typings = 'types/index.d.ts';
      pkg.scripts = {
        ...pkg.scripts,
        'build:types': 'tsc -p tsconfig.prod.json',
      };
      this._copyDir('_ts', '.');
    } else {
      this._copyDir('_js', '.');
    }
    if (this.state.test) {
      pkg.scripts = {
        ...pkg.scripts,
        test: 'jest test',
        'test:cov': 'jest test --coverage',
      };
      pkg.nyc = {
        include: [
          'src/**',
        ],
      };
    }
    pkg.dependencies = {
      ...pkg.dependencies,
      ...loadDeps(this.state.depList),
    };
    pkg.devDependencies = {
      ...pkg.devDependencies,
      ...loadDeps(this.state.devDepList),
    };
    this.fs.extendJSON(this.destinationPath('package.json'), pkg);
  }

  app() {
    this.fs.copyTpl(this.templatePath('src/index.js'), this.destinationPath(`src/index${this.state.ts ? '.ts' : '.js'}`), this.state);
    this.fs.copyTpl(this.templatePath('src/app.js'), this.destinationPath(`src/app${this.state.ts && this.state.jsx ? '.tsx' : this.state.ts ? '.ts' : '.js'}`), this.state);
    if (this.state.ts) {
      this.fs.copy(this.templatePath('src/types'), this.destinationPath('src/types'));
    }
    if (this.state.css) {
      this.fs.copy(this.templatePath('src/style.css'), this.destinationPath('src/style.css'));
    }
    if (this.state.test) {
      this.fs.copy(this.templatePath('test/app.test.js'), this.destinationPath(`test/app.test${this.state.ts ? '.ts' : '.js'}`));
    }
  }

  install() {
    install(this);
  }
}
