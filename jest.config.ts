import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 5000,
  moduleNameMapper: {
    '^@pano/(.*)$': '<rootDir>/src/$1',
    '@gi://(.*)(\\?version=(.*))?': 'TODO',
  },
  transform: {
    'node_modules/@girs/(.*)\\.js': [
      'babel-jest',
      {
        presets: ['@babel/preset-env'],
      },
    ],
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tests/tsconfig.json',
      },
    ],
  },
  transformIgnorePatterns: [],
};

export default jestConfig;
