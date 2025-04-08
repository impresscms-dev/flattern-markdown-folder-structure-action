import jestPlugin from 'eslint-plugin-jest'

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**']
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals
        'process': 'readonly',
        '__dirname': 'readonly',
        '__filename': 'readonly',
        'module': 'readonly',
        'exports': 'writable',
        'require': 'readonly',
        // ES2022 globals
        'console': 'readonly',
        'setTimeout': 'readonly',
        'clearTimeout': 'readonly',
        'setInterval': 'readonly',
        'clearInterval': 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'error',
      'camelcase': 'off',
      'func-call-spacing': ['error', 'never'],
      'no-array-constructor': 'error',
      'no-useless-constructor': 'error',
      'prefer-const': 'error',
      'semi': ['error', 'never'],
      'no-useless-escape': 'off'
    }
  },
  {
    files: ['**/*.test.js'],
    plugins: {
      jest: jestPlugin
    },
    languageOptions: {
      globals: jestPlugin.configs.recommended.globals || {}
    },
    rules: {
      ...jestPlugin.configs.recommended.rules
    }
  }
]
