// see https://www.robertcooper.me/using-eslint-and-prettier-in-a-typescript-project
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    project: 'tsconfig.json',
  },
  extends: [
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  plugins: ['simple-import-sort', '@typescript-eslint/eslint-plugin'],
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
    eqeqeq: 'error',
    'require-await': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    //See: https://gitlab.gnome.org/ewlsh/gjs-guide/blob/main/src/guides/gjs/style-guide/eslint.config.js
    // See: https://eslint.org/docs/latest/rules/#possible-problems
    'array-callback-return': 'error',
    'no-constant-binary-expression': 'error',
    'no-constructor-return': 'error',
    'no-new-native-nonconstructor': 'error',
    'no-promise-executor-return': 'error',
    'no-self-compare': 'error',
    'no-template-curly-in-string': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unreachable-loop': 'error',
    'no-unused-private-class-members': 'error',
    'no-use-before-define': [
      'error',
      {
        functions: false,
        classes: true,
        variables: true,
        allowNamedExports: true,
      },
    ],
    // See: https://eslint.org/docs/latest/rules/#suggestions
    'block-scoped-var': 'error',
    complexity: [
      'warn',
      {
        max: 40,
      },
    ],
    'consistent-return': 'error',
    'default-param-last': 'error',
    eqeqeq: 'error',
    'no-array-constructor': 'error',
    'no-caller': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-extra-label': 'error',
    'no-iterator': 'error',
    'no-label-var': 'error',
    'no-loop-func': 'error',
    'no-multi-assign': 'warn',
    'no-new-object': 'error',
    'no-new-wrappers': 'error',
    'no-proto': 'error',
    'no-shadow': 'warn',
    'no-var': 'warn',
    'unicode-bom': 'error',
    // GJS Restrictions
    'no-restricted-globals': [
      'error',
      {
        name: 'Debugger',
        message: 'Internal use only',
      },
      {
        name: 'GIRepositoryGType',
        message: 'Internal use only',
      },
      {
        name: 'log',
        message: 'Use console.log()',
      },
      {
        name: 'logError',
        message: 'Use console.warn() or console.error()',
      },
    ],
    'no-restricted-properties': [
      'error',
      {
        object: 'imports',
        property: 'format',
        message: 'Use template strings',
      },
      {
        object: 'pkg',
        property: 'initFormat',
        message: 'Use template strings',
      },
      {
        object: 'Lang',
        property: 'copyProperties',
        message: 'Use Object.assign()',
      },
      {
        object: 'Lang',
        property: 'bind',
        message: 'Use arrow notation or Function.prototype.bind()',
      },
      {
        object: 'Lang',
        property: 'Class',
        message: 'Use ES6 classes',
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector:
          'MethodDefinition[key.name="_init"] CallExpression[arguments.length<=1][callee.object.type="Super"][callee.property.name="_init"]',
        message: 'Use constructor() and super()',
      },
    ],
  },
};
