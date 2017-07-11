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
      'gulp-plumber',
      'gulp-eslint',
      'gulp-rollup',
      'gulp-replace',
      'gulp-rename',
      'gulp-postcss',
      'autoprefixer',
      'precss',
      'postcss-modules',
      'rollup-plugin-babel',
      'rollup-plugin-node-resolve',
      'rollup-plugin-commonjs',
      'babel-preset-env',
      'babel-plugin-transform-runtime',
      'eslint',
      'eslint-config-airbnb-base',
      'eslint-plugin-import',
    ];
    const res = this.spawnCommandSync('yarn', ['--version']);
    if (res.error && res.error.code === 'ENOENT') {
      this.npmInstall(deps, {saveDev: true});
    } else {
      this.yarnInstall(deps, {dev: true});
    }
  }
}
