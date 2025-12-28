import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['node_modules', 'dist', 'coverage', 'test-reports', '*.js']
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            ecmaVersion: 12,
            sourceType: 'module',
            parserOptions: {
                project: './tsconfig.json'
            }
        },
        rules: {
            'indent': ['error', 4],
            'no-useless-constructor': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'warn'
        }
    }
);
