const fs = require('fs');
const path = require('path');
const Generator = require('yeoman-generator');
const globby = require('globby');
const { install, concatList, loadDeps } = require('../../util');

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

  _updateDeps() {
    const devDepList = [
      'husky',
      '@gera2ld/plaid',
      '@gera2ld/plaid-rollup',
      'rollup-plugin-browsersync',
      'gulp',
      'del',
      'fancy-log',
    ];
    const depList = [
      '@babel/runtime',
      'core-js',
    ];
    if (this.state.ts) {
      devDepList.push(
        '@gera2ld/plaid-common-ts',
      );
    }
    if (this.state.features.includes('svelte')) {
      devDepList.push(
        '@gera2ld/plaid-common-svelte',
        'rollup-plugin-svelte',
        'svelte-preprocess',
      );
    }
    if (this.state.features.includes('jsxDom')) {
      devDepList.push(
        '@gera2ld/plaid-common-react',
      );
      depList.push(
        '@gera2ld/jsx-dom',
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
    this._updateDeps();
  }

  rootFiles() {
    this._copyDir('_root', '.');
    const pkg = {
      name: this.state.name.replace(/\s+/g, '-').toLowerCase(),
      private: true,
      ...this.state.pkg,
      scripts: {
        ...this.state.pkg.scripts,
        dev: 'gulp dev',
        clean: 'gulp clean',
        'build:js': 'gulp build',
        prebuild: 'npm run ci && npm run clean',
        build: 'cross-env NODE_ENV=production npm run build:js',
        ci: 'npm run lint',
      },
    };
    const ext = [
      '.js',
      this.state.ts && '.ts',
      this.state.features.includes('svelte') && '.svelte',
    ].filter(Boolean);
    pkg.scripts.lint = `eslint --ext ${ext.join(',')} .`;
    pkg.dependencies = {
      ...pkg.dependencies,
      ...loadDeps(this.state.depList),
    };
    pkg.devDependencies = {
      ...pkg.devDependencies,
      ...loadDeps(this.state.devDepList),
    };
    this._copyDir('_gulp', '.');
    if (this.state.ts) {
      this._copyDir('_ts', '.');
    } else {
      this._copyDir('_js', '.');
    }
    if (this.state.features.includes('svelte')) {
      this._copyDir('_svelte', '.');
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
    install(this);
  }
}
