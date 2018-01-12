const fs = require('fs');
const Generator = require('yeoman-generator');

module.exports = class WebpackGenerator extends Generator {
  async prompting() {
    const answers = await this.prompt([
      {
        name: 'name',
        type: 'input',
        message: 'Your project name',
        default: this.appname,
      },
      {
        name: 'description',
        type: 'input',
        message: 'Description of your project',
      },
      {
        name: 'output',
        type: 'list',
        message: 'Which type of output would you like to generate?',
        choices: [
          { name: 'UMD', value: 'umd' },
          { name: 'CommonJS', value: 'cjs' },
          { name: 'IIFE', value: 'iife' },
        ],
        default: 'umd',
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
      Object.assign(answers, await this.prompt([
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

  rootFiles() {
    const rootFileDir = this.templatePath('root-files');
    fs.readdirSync(rootFileDir)
    .forEach(name => {
      if (name.startsWith('.')) return;
      this.fs.copyTpl(`${rootFileDir}/${name}`, this.destinationPath(name.replace(/^_/, '.')), this.state);
    });
  }

  app() {
    this.fs.copyTpl(this.templatePath('src/index.js'), this.destinationPath('src/index.js'), this.state);
    if (this.state.css) {
      this.fs.copy(this.templatePath('src/style.css'), this.destinationPath('src/style.css'));
    }
  }

  install() {
    const deps = [
      'gulp',
      'gulp-util',
      'gulp-eslint',
      'rollup',
      'rollup-plugin-babel@next',
      'rollup-plugin-replace',
      'eslint',
      'eslint-config-airbnb-base',
      'eslint-plugin-import',
      '@babel/core',
      '@babel/preset-env',
    ];
    if (this.state.css) {
      deps.push(...[
        'postcss',
        'autoprefixer',
        'precss',
        'postcss-modules',
        'cssnano',
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
