const path = require('path');
const globby = require('globby');
const depMap = require('./deps.json').dependencies;

exports.replaceContent = (ins, file, replace) => {
  const filePath = ins.destinationPath(file);
  let source;
  try {
    source = ins.fs.read(filePath);
  } catch (err) {
    return;
  }
  let content = replace(source);
  if (content === undefined) content = source;
  ins.fs.write(filePath, content);
};

exports.replaceJSON = (ins, file, replace) => {
  const filePath = ins.destinationPath(file);
  const source = ins.fs.readJSON(filePath);
  let content = replace(source);
  if (content === undefined) content = source;
  ins.fs.writeJSON(filePath, content);
};

exports.concatList = (...args) => args.filter(Boolean).flat();

exports.loadDeps = (depList) => depList.reduce((res, key) => {
  if (!depMap[key]) throw new Error(`${key} is not found`);
  res[key] = depMap[key];
  return res;
}, {});

exports.replaceDot = replaceDot;

exports.copyDir = (ins, src, dest, state, transform = replaceDot) => {
  const base = ins.templatePath(src).replace(/\\/g, '/');
  const files = globby.sync(`${base}/**`, { nodir: true });
  const dir = ins.destinationPath(dest);
  for (const file of files) {
    const relpath = path.relative(base, file);
    ins.fs.copyTpl(file, path.join(dir, transform(relpath)), state);
  }
};

exports.join = (arr, sep = ' ') => arr.filter(Boolean).join(sep);

exports.install = (ins) => {
  if (detect(ins, 'git', ['--version'])) {
    ins.spawnCommandSync('git', ['init']);
  }
  if (detect(ins, 'pnpm', ['--version'])) {
    ins.spawnCommandSync('pnpm', ['i']);
  } else if (detect(ins, 'yarn', ['--version'])) {
    ins.spawnCommandSync('yarn');
  } else {
    ins.spawnCommandSync('npm', ['i']);
  }
};

const cache = {};

function detect(ins, command, args) {
  if (cache[command] == null) {
    const res = ins.spawnCommandSync(command, args);
    cache[command] = !(res.error && res.error.code === 'ENOENT');
  }
  return cache[command];
}

function replaceDot(filename) {
  return filename.replace(/^_/, '.');
}

function js2ts(filename) {
  return filename.replace(/\.js$/, '.ts');
}
exports.js2ts = js2ts;
