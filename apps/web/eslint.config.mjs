import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  // Block the e2e-test credentials provider id from leaking outside auth + tests.
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      '**/lib/auth.ts',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/e2e/**',
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value='e2e-test']",
          message:
            "O provider 'e2e-test' só pode ser referenciado em lib/auth.ts e arquivos de teste.",
        },
      ],
    },
  },
  prettier,
]);

export default eslintConfig;
