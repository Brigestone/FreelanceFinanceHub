#!/usr/bin/env node
/**
 * Script interactivo por consola para crear un usuario Administrador
 * de forma segura, sin credenciales predeterminadas ni contraseñas en texto plano.
 *
 * Uso: npm run admin:create
 */
const readline = require('readline');
const { Writable } = require('stream');
const { pool, closePool } = require('../src/config/db');
const userModel = require('../src/models/userModel');
const authService = require('../src/services/authService');
const { checkPassword, NAME_MIN, NAME_MAX, EMAIL_MAX } = require('../src/utils/passwordPolicy');

class HiddenInputWritable extends Writable {
  constructor() {
    super();
    this.muted = false;
  }
  _write(chunk, encoding, callback) {
    if (!this.muted) {
      process.stdout.write(chunk, encoding);
    }
    callback();
  }
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}

function askHidden(query) {
  return new Promise((resolve) => {
    const hiddenStdout = new HiddenInputWritable();
    const rl = readline.createInterface({
      input: process.stdin,
      output: hiddenStdout,
      terminal: true
    });

    process.stdout.write(query);
    hiddenStdout.muted = true;

    rl.question('', (answer) => {
      hiddenStdout.muted = false;
      process.stdout.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('====================================================');
  console.log('  FreelanceFinanceHub — Creación de Administrador   ');
  console.log('====================================================\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // 1. Nombre completo
    let fullName = '';
    while (true) {
      fullName = await ask(rl, 'Nombre completo: ');
      if (fullName.length < NAME_MIN || fullName.length > NAME_MAX) {
        console.log(`⚠️  El nombre debe tener entre ${NAME_MIN} y ${NAME_MAX} caracteres.`);
        continue;
      }
      break;
    }

    // 2. Correo electrónico
    let email = '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    while (true) {
      email = (await ask(rl, 'Correo electrónico: ')).toLowerCase();
      if (!emailRegex.test(email) || email.length > EMAIL_MAX) {
        console.log('⚠️  Ingresa un correo electrónico válido.');
        continue;
      }
      break;
    }

    // Verificar si ya existe
    const existing = await userModel.findByEmail(email);
    if (existing) {
      if (existing.role === 'admin') {
        console.log('\nℹ️  Este usuario ya está registrado y tiene rol de administrador.');
        rl.close();
        await closePool();
        process.exit(0);
      }

      const promote = await ask(rl, `\nEl usuario ya existe como "${existing.role}". ¿Deseas promoverlo a "admin"? (s/N): `);
      if (promote.toLowerCase() === 's') {
        await userModel.updateRole(existing.id, 'admin');
        console.log('\n✅ Usuario promovido a Administrador con éxito.');
      } else {
        console.log('\nOperación cancelada.');
      }
      rl.close();
      await closePool();
      process.exit(0);
    }

    rl.close(); // Cerramos la interfaz estándar para capturar contraseña de forma oculta

    // 3. Contraseña oculta
    let password = '';
    while (true) {
      password = await askHidden('Contraseña (los caracteres no se mostrarán): ');
      const problems = checkPassword(password);
      if (problems.length > 0) {
        console.log('⚠️  La contraseña no cumple con la política de seguridad:');
        problems.forEach((p) => console.log(`   - ${p}`));
        continue;
      }

      const confirm = await askHidden('Confirma la contraseña: ');
      if (password !== confirm) {
        console.log('⚠️  Las contraseñas no coinciden. Intenta de nuevo.\n');
        continue;
      }
      break;
    }

    console.log('\nHasheando contraseña y creando cuenta de administrador...');
    const passwordHash = await authService.hashPassword(password);
    const userId = await userModel.createWithAlertSettings({
      fullName,
      email,
      passwordHash,
      roleName: 'admin'
    });

    console.log(`\n🎉 Administrador creado exitosamente (ID: ${userId}).`);
    console.log(`   Correo: ${email}`);
    console.log('   Ya puedes iniciar sesión en http://localhost:3000/login\n');
  } catch (error) {
    console.error('\n❌ Error al crear administrador:', error.message);
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  main();
}
