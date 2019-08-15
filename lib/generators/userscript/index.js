const Generator = require('yeoman-generator');
const { replaceContent } = require('../../util');

module.exports = class UserscriptGenerator extends Generator {
  initializing() {
    this.composeWith(require.resolve('../app'), {
      output: ['iife'],
      bundleName: 'iife',
      banner: `\
fs.readFileSync('src/meta.js', 'utf8')
.replace('process.env.VERSION', pkg.version)`,
      cdn: false,
      publish: false,
      minify: false,
    });
  }

  writing() {
    this.fs.copy(this.templatePath('src/meta.js'), this.destinationPath('src/meta.js'));
    replaceContent(
      this,
      'rollup.conf.js',
      content => {
        content = content.replace('${FILENAME}.js`', '${FILENAME}.user.js`');
        content = `const fs = require('fs');
${content}`;
        return content;
      },
    );
  }
}
