module.exports = {
  extends: ['@remix-run/eslint-config', '@remix-run/eslint-config/node'],
  parserOptions: {
    project: require.resolve('./tsconfig.json'),
  },
  rules: {
    '@typescript-eslint/no-redeclare': 'off',
  },
}
