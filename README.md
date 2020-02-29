# @gera2ld/generator-rollup

![NPM](https://img.shields.io/npm/v/@gera2ld/generator-rollup.svg)

Yeoman generator to create a workspace easy to be packed with Rollup.

It is aimed to generate projects based on JavaScript files, e.g. userscripts, JavaScript libraries.

Requires Node.js v8.0+.

## Installation

It is highly recommended to use with Yarn.

``` sh
$ yarn global add @gera2ld/generator-rollup

# You can also clone the generator and link it to global node_modules
$ git clone https://github.com/gera2ld/generator-rollup.git
```

One time usage with `npx`:

```sh
$ npx -p @gera2ld/generator-rollup -p yo yo @gera2ld/rollup

# or use the latest version from git
$ npx -p https://github.com/gera2ld/generator-rollup.git -p yo yo @gera2ld/rollup
```

## Usage

### Prerequisite

- Make sure yeoman is installed

   ``` sh
   $ yarn global add yo
   ```

### Initialization

- Initialize a library repo

   ```sh
   $ cd my-library
   $ yo @gera2ld/rollup
   ```

- Initialize a userscript repo

   ```sh
   $ cd my-script
   $ yo @gera2ld/rollup:userscript
   ```
