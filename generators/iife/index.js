const Generator = require('yeoman-generator');

module.exports = class ScriptGenerator extends Generator {
  initializing() {
    this.composeWith(require.resolve('../app'), {
      output: ['iife'],
      bundleName: 'iife',
      banner: false,
      cdn: false,
    });
  }
}
