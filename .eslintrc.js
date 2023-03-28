// see https://www.robertcooper.me/using-eslint-and-prettier-in-a-typescript-project
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  plugins: ['simple-import-sort'],
  rules: {
    // increase the severity of rules so they are auto-fixable
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    quotes: [2, 'single', { avoidEscape: true }],
    'no-debugger': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-misused-new': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    // For Gjs
    camelcase: 'off',
    '@typescript-eslint/camelcase': 'off',
  },
};
