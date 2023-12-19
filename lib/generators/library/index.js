import { join, relative } from 'path';
import Generator from 'yeoman-generator';
import { globby } from 'globby';

function replaceDot(filename) {
  return filename.replace(/^_/, '.');
}

export default class RollupGenerator extends Generator {
  async _copyDir(src, dest) {
    const base = this.templatePath(src).replace(/\\/g, '/');
    const files = await globby(`${base}/**`, { nodir: true });
    const dir = this.destinationPath(dest);
    await Promise.all(
      files.map(async (file) => {
        const relpath = replaceDot(relative(base, file));
        await this.fs.copyTplAsync(file, join(dir, relpath), this.state);
      }),
    );
  }

  async prompting() {
    let pkg;
    try {
      pkg = this.fs.readJSON('package.json');
    } catch (err) {
      // ignore
    }
    pkg ||= {};
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
    ]);
    this.state = {
      ...state,
      ...answers,
    };
  }

  async rootFiles() {
    await this._copyDir('_root', '.');
    const tplPkg = this.fs.readJSON(this.templatePath('_root/package.json'));
    const pkg = {
      ...tplPkg,
      ...this.state.pkg,
      name: this.state.name.replace(/\s+/g, '-').toLowerCase(),
      author: this.state.author,
    };
    this.fs.extendJSON(this.destinationPath('package.json'), pkg);
  }

  async app() {
    await this._copyDir('src', 'src');
    await this._copyDir('test', 'test');
  }

  #cache = {};

  async #detectAsync(command, args) {
    try {
      await this.spawn(command, args);
      this.#cache[command] = true;
    } catch {
      this.#cache[command] = false;
    }
    return this.#cache[command];
  }

  _detect(command, args) {
    this.#cache[command] ||= this.#detectAsync(command, args);
    return this.#cache[command];
  }

  async install() {
    if (this._detect('git', ['--version'])) {
      await this.spawn('git', ['init']);
    }
    if (this._detect('pnpm', ['--version'])) {
      await this.spawn('pnpm', ['i']);
    } else if (this._detect('yarn', ['--version'])) {
      await this.spawn('yarn');
    } else {
      await this.spawn('npm', ['i']);
    }
  }
}
