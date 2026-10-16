import nx from '@nx/eslint-plugin';

import baseConfig from '../../../../eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
];
