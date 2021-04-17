const fs = require('fs');
const Generator = require('yeoman-generator');
const { install, concatList, loadDeps, copyDir } = require('../../util');

function renameToTs(filename) {
  return filename.replace(/\.js$/, '.ts');
}

module.exports = class BaseGenerator extends Generator {
  _copyDir(src, dest) {
    copyDir(this, src, dest, this.state);
  }

  _updateDeps() {
    const devDepList = [
      '@gera2ld/plaid',
      '@gera2ld/plaid-rollup',
      'del',
      'fancy-log',
      'gulp',
      'husky',
      'rollup-plugin-browsersync',
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
        'svelte',
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
      year: new Date().getFullYear(),
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
        name: 'author',
        type: 'input',
        message: 'Author',
        default: pkg.author,
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
      author: this.state.author,
      scripts: {
        ...this.state.pkg.scripts,
        prepare: 'husky install',
        dev: 'gulp dev',
        clean: 'gulp clean',
        'build:js': 'gulp build',
        prebuild: 'run-s ci clean',
        build: 'cross-env NODE_ENV=production run-s build:js',
        ci: 'run-s lint',
      },
    };
    const ext = [
      this.state.ts ? '.ts,.tsx' : '.js',
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
