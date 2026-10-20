#!/usr/bin/env node
/**
 * Genera un JWT_SECRET criptográficamente seguro y lo escribe en .env
 * SIN mostrarlo en pantalla.
 *
 * Uso: npm run secret:generate
 *
 * - Si .env no existe, lo crea a partir de .env.example.
 * - Si ya existe JWT_SECRET, lo reemplaza (las sesiones activas se invalidan).
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const ENV_PATH = path.join(ROOT, '.env');
const EXAMPLE_PATH = path.join(ROOT, '.env.example');

function main() {
  if (!fs.existsSync(ENV_PATH)) {
    if (!fs.existsSync(EXAMPLE_PATH)) {
      console.error('❌ No existe .env ni .env.example en la raíz del proyecto.');
      process.exit(1);
    }
    fs.copyFileSync(EXAMPLE_PATH, ENV_PATH);
    console.log('ℹ️  Se creó .env a partir de .env.example.');
  }

  const secret = crypto.randomBytes(64).toString('hex'); // 128 caracteres hex
  const original = fs.readFileSync(ENV_PATH, 'utf8');
  const line = `JWT_SECRET=${secret}`;

  const updated = /^JWT_SECRET=.*$/m.test(original)
    ? original.replace(/^JWT_SECRET=.*$/m, line)
    : `${original.replace(/\s*$/, '')}\n${line}\n`;

  fs.writeFileSync(ENV_PATH, updated, 'utf8');

  console.log(`✅ JWT_SECRET actualizado en .env (${secret.length} caracteres, no se muestra por seguridad).`);
  console.log('   Las sesiones iniciadas con el secreto anterior dejan de ser válidas.');
}

main();
