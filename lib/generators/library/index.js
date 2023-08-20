import Generator from 'yeoman-generator';
import { install, concatList, loadDeps, copyDir, join } from '../../util/index.js';

export default class BaseGenerator extends Generator {
  _copyDir(src, dest) {
    copyDir(this, src, dest, this.state);
  }

  _updateDeps() {
    const devDepList = [
      '@gera2ld/plaid',
      '@gera2ld/plaid-common-ts',
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
      pkg = this.fs.readJSON('package.json');
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
        default: ['esm'],
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
        name: 'test',
        type: 'confirm',
        message: 'Would you like to add tests?',
        default: true,
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
        format: 'prettier --ignore-path .eslintignore --write .',
        lint: 'prettier --ignore-path .eslintignore --check . && eslint --ext .ts,tsx .',
        ...this.state.gulp ? {
          dev: 'gulp dev',
          clean: 'gulp clean',
          'build:js': 'cross-env NODE_ENV=production gulp build',
        } : {
          dev: 'rollup -wc',
          clean: join([
            'del-cli',
            'dist',
            'types',
          ]),
          'build:js': 'cross-env NODE_ENV=production rollup -c',
        },
        'build:types': 'tsc -p tsconfig.prod.json',
        build: join([
          'run-s',
          'ci',
          'clean',
          'build:types',
          'build:js',
        ]),
        prepare: 'husky install',
        prepublishOnly: 'run-s build',
      },
      typings: 'types/index.d.ts',
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
        pkg.module = 'dist/index.mjs';
        hasFiles = true;
      }
    }
    if (hasFiles) {
      pkg.files = ['dist', 'types'];
      pkg.publishConfig = {
        access: 'public',
        registry: 'https://registry.npmjs.org/',
      };
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
    this._copyDir('src', 'src');
    if (this.state.test) {
      this._copyDir('test', 'test');
    }
  }

  install() {
    install(this);
  }
}
