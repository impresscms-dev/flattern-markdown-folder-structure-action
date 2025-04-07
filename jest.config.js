export default {
  testEnvironment: 'node',
  testRegex: '/tests/.*\\.(test|spec)?\\.(js|jsx)$',
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
}