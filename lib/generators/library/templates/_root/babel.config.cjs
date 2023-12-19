const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  presets: [
    ['@babel/preset-env', {
      ...!isTest && {
        modules: false,
      },
      loose: true,
    }],
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true,
    }],
  ],
};
