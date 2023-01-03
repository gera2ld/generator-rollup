import { relative, join as pathJoin } from 'path';
import { globbySync } from 'globby';
import depJson from './deps.json' assert { type: 'json' };

const depMap = depJson.dependencies;

export function replaceContent(ins, file, replace) {
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
}

export function replaceJSON(ins, file, replace) {
  const filePath = ins.destinationPath(file);
  const source = ins.fs.readJSON(filePath);
  let content = replace(source);
  if (content === undefined) content = source;
  ins.fs.writeJSON(filePath, content);
}

export function concatList(...args) {
  return args.filter(Boolean).flat();
}

export function loadDeps(depList) {
  return depList.reduce((res, key) => {
    if (!depMap[key]) throw new Error(`${key} is not found`);
    res[key] = depMap[key];
    return res;
  }, {});
}

export function copyDir(ins, src, dest, state, transform = replaceDot) {
  const base = ins.templatePath(src).replace(/\\/g, '/');
  const files = globbySync(`${base}/**`, { nodir: true });
  const dir = ins.destinationPath(dest);
  for (const file of files) {
    const relpath = relative(base, file);
    ins.fs.copyTpl(file, pathJoin(dir, transform(relpath)), state);
  }
}

export function join(arr, sep = ' ') {
  return arr.filter(Boolean).join(sep);
}

export function install(ins) {
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
}

const cache = {};

function detect(ins, command, args) {
  if (cache[command] == null) {
    const res = ins.spawnCommandSync(command, args);
    cache[command] = !(res.error && res.error.code === 'ENOENT');
  }
  return cache[command];
}

export function replaceDot(filename) {
  return filename.replace(/^_/, '.');
}

export function js2ts(filename) {
  return filename.replace(/\.js$/, '.ts');
}
