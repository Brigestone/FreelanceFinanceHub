/**
 * Configuración de Jest para pruebas con la base de datos de test
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  testTimeout: 10000
};
