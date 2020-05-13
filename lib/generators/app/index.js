const fs = require('fs');
const path = require('path');
const Generator = require('yeoman-generator');
const globby = require('globby');
const { install } = require('../../util');

function replaceDot(filename) {
  return filename.replace(/^_/, '.');
}

function renameToTs(filename) {
  return filename.replace(/\.js$/, '.ts');
}

module.exports = class BaseGenerator extends Generator {
  _copyDir(src, dest, handle = replaceDot) {
    const base = this.templatePath(src);
    const files = globby.sync(`${base}/**`, { nodir: true });
    const dir = this.destinationPath(dest);
    for (const file of files) {
      const relpath = path.relative(base, file);
      this.fs.copyTpl(file, path.join(dir, handle(relpath)), this.state);
    }
  }

  async prompting() {
    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      delete pkg.dependencies;
      delete pkg.devDependencies;
    } catch (err) {
      // ignore
    }
    pkg = pkg || {};
    const state = {
      pkg,
      ...this.options,
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
        name: 'features',
        type: 'checkbox',
        message: 'Which features would you like to enable?',
        choices: [{
          name: 'Svelte',
          value: 'svelte',
        }, {
          name: 'JSX DOM',
          value: 'jsxDom',
        }],
        default: [],
      },
    ]);
    this.state = {
      ...state,
      ...answers,
    };
  }

  rootFiles() {
    this._copyDir('_root', '.');
    const pkg = {
      name: this.state.name.replace(/\s+/g, '-').toLowerCase(),
      private: true,
      ...this.state.pkg,
      scripts: {
        ...this.state.pkg.scripts,
        ...this.state.gulp ? {
          dev: 'gulp dev',
          clean: 'gulp clean',
          'build:js': 'gulp build',
        } : {
          dev: 'rollup -wc rollup.conf.js',
          clean: `del dist{this.state.ts ? ' types' : ''}`,
          'build:js': 'rollup -c rollup.conf.js',
        },
        prebuild: 'npm run ci && npm run clean',
        build: 'cross-env NODE_ENV=production npm run build:js',
        prepublishOnly: 'npm run build',
        ci: 'npm run lint',
        lint: `eslint${this.state.ts ? ' --ext .ts' : ''} .`,
      },
    };
    if (this.state.gulp) {
      this._copyDir('_gulp', '.');
    }
    if (this.state.ts) {
      this._copyDir('_ts', '.');
    } else {
      this._copyDir('_js', '.');
    }
    this.fs.extendJSON(this.destinationPath('package.json'), pkg);
  }

  app() {
    if (this.state.ts) {
      this._copyDir('src', 'src', renameToTs);
    } else {
      this._copyDir('src', 'src');
    }
  }

  install() {
    const devDeps = [
      'husky',
      '@gera2ld/plaid@~2.0.0',
      '@gera2ld/plaid-rollup@~2.0.0',
      'rollup-plugin-browsersync',
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
        '@gera2ld/plaid-common-ts',
      );
    }
    if (this.state.features.includes('svelte')) {
      devDeps.push(
        '@gera2ld/plaid-common-svelte@~2.0.0',
        'rollup-plugin-svelte',
        'svelte-preprocess',
      );
    }
    if (this.state.features.includes('jsxDom')) {
      devDeps.push(
        '@gera2ld/plaid-common-react@~2.0.0',
      );
      deps.push(
        '@gera2ld/jsx-dom',
      );
    }
    install(this, devDeps, deps);
  }
}
