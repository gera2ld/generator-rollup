const fs = require('fs');
const path = require('path');
const Generator = require('yeoman-generator');
const globby = require('globby');
const { install, concatList, loadDeps } = require('../../util');

module.exports = class BaseGenerator extends Generator {
  _copyDir(src, dest) {
    const files = globby.sync(`${this.templatePath(src)}/**`, { nodir: true });
    const dir = this.destinationPath(dest);
    for (const file of files) {
      const destFile = path.join(dir, path.basename(file).replace(/^_/, '.'));
      this.fs.copyTpl(file, destFile, this.state);
    }
  }

  _updateDeps() {
    const devDepList = [
      'husky',
      '@gera2ld/plaid',
      '@gera2ld/plaid-rollup',
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
        'tape',
        '@babel/register',
        'babel-plugin-istanbul',
        'nyc',
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
        prepublishOnly: 'npm run build',
        ci: 'npm run lint',
        lint: `eslint${this.state.ts ? ' --ext .ts,.tsx' : ''} .`,
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
      }
      if (this.state.cdn && this.state.output.includes('iife')) {
        const cdnEntry = this.state.minify ? 'dist/index.min.js' : 'dist/index.js';
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
        build: 'tsc && npm run build:js',
      };
      this._copyDir('_ts', '.');
    } else {
      pkg.scripts = {
        ...pkg.scripts,
        build: 'npm run build:js',
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
      this.fs.copy(this.templatePath('test'), this.destinationPath('test'));
    }
  }

  install() {
    install(this);
  }
}
