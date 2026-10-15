import nx from '@nx/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'platform:web',
              notDependOnLibsWithTags: ['platform:server'],
            },
            {
              sourceTag: 'platform:server',
              notDependOnLibsWithTags: ['platform:web'],
            },
            {
              sourceTag: 'platform:shared',
              notDependOnLibsWithTags: ['platform:web', 'platform:server'],
            },
          ],
        },
      ],
    },
  },
  ...tseslint.configs.recommendedTypeChecked.map(config => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
  })),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            [
              'signature',
              'call-signature',
              'readonly-field',
              'field',
              'get',
              'set',
              'accessor',
              'constructor',
              'static-initialization',
            ],
            'public-method',
            'protected-method',
            'private-method',
            '#private-method',
          ],
        },
      ],
      '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      curly: ['error', 'all'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: '*', next: 'break' },
        { blankLine: 'always', prev: '*', next: ['if', 'for'] },
        { blankLine: 'always', prev: ['if', 'for'], next: '*' },
        { blankLine: 'always', prev: ['multiline-const', 'multiline-let'], next: '*' },
      ],
    },
  },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  eslintConfigPrettier,
];
