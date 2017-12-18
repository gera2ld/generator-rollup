const fs = require('fs');
const Generator = require('yeoman-generator');

module.exports = class WebpackGenerator extends Generator {
  prompting() {
    return this.prompt([
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
    ])
    .then(answers => {
      this.state = answers;
    });
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
    this.fs.copy(this.templatePath('src'), this.destinationPath('src'));
  }

  install() {
    const deps = [
      'gulp',
      'gulp-util',
      'gulp-eslint',
      'rollup',
      'postcss',
      'autoprefixer',
      'precss',
      'postcss-modules',
      'cssnano',
      'rollup-plugin-babel@4.0.0-beta.0',
      'rollup-plugin-replace',
      'eslint',
      'eslint-config-airbnb-base',
      'eslint-plugin-import',
      '@babel/core',
      '@babel/preset-env',
    ];
    const res = this.spawnCommandSync('yarn', ['--version']);
    if (res.error && res.error.code === 'ENOENT') {
      this.npmInstall(deps, {saveDev: true});
    } else {
      this.yarnInstall(deps, {dev: true});
    }
  }
}
