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
        type: 'list',
        message: 'Which type of output would you like to generate?',
        choices: [
          { name: 'IIFE', value: 'iife' },
          { name: 'CommonJS', value: 'cjs' },
          { name: 'UMD', value: 'umd' },
        ],
        default: 'iife',
      },
      {
        name: 'css',
        type: 'confirm',
        message: 'Would you like to import CSS?',
        default: false,
      },
    ]);
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
    if (answers.output === 'umd') {
      Object.assign(answers, {
        pkg,
      }, await this.prompt([
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
    this.state = answers;
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
    const deps = [
      'cross-env',
      'del',
      'gulp@next',
      'fancy-log',
      'rollup',
      'rollup-plugin-babel@next',
      'rollup-plugin-replace',
      'husky',
      'eslint',
      'eslint-config-airbnb-base',
      'eslint-plugin-import',
      'babel-eslint',
      '@babel/core',
      '@babel/preset-env',
      '@babel/preset-stage-2',
    ];
    if (this.state.css) {
      deps.push(...[
        'postcss',
        'autoprefixer',
        'precss',
        'postcss-modules',
        'cssnano@next', // use cssnano v4 with safe preset
      ]);
    }
    const res = this.spawnCommandSync('yarn', ['--version']);
    if (res.error && res.error.code === 'ENOENT') {
      this.npmInstall(deps, {saveDev: true});
    } else {
      this.yarnInstall(deps, {dev: true});
    }
  }
}
