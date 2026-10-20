const { pool } = require('../config/db');
const AppError = require('../utils/AppError');

// Columnas públicas: NUNCA incluyen password_hash.
const PUBLIC_COLUMNS = `
  u.id, u.full_name, u.email, u.status, u.created_at, u.updated_at, r.name AS role
`;

/**
 * Convierte una fila de BD al formato público de la API (camelCase, sin hash).
 * @param {object|null} row
 */
function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at
  };
}

/** Busca un usuario por id (sin hash). */
async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS} FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/** Busca un usuario por email (sin hash). */
async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS} FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Busca un usuario por email INCLUYENDO el hash.
 * Uso exclusivo del proceso de login: el resultado nunca debe enviarse al cliente.
 */
async function findAuthByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLUMNS}, u.password_hash
       FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Crea un usuario y su fila de alert_settings en UNA transacción.
 * Si algo falla, no queda ningún registro a medias.
 * @param {{fullName: string, email: string, passwordHash: string, roleName?: string}} data
 * @returns {Promise<number>} id del nuevo usuario
 */
async function createWithAlertSettings({ fullName, email, passwordHash, roleName = 'freelancer' }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [roleRows] = await connection.execute('SELECT id FROM roles WHERE name = ? LIMIT 1', [roleName]);
    if (roleRows.length === 0) {
      // Indica que faltan los seeds; es un error de instalación, no del usuario.
      throw new Error(`El rol "${roleName}" no existe. ¿Importaste database/seeds.sql?`);
    }

    const [result] = await connection.execute(
      'INSERT INTO users (role_id, full_name, email, password_hash) VALUES (?, ?, ?, ?)',
      [roleRows[0].id, fullName, email, passwordHash]
    );

    await connection.execute('INSERT INTO alert_settings (user_id) VALUES (?)', [result.insertId]);

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    // Carrera entre dos registros simultáneos con el mismo email.
    if (error.code === 'ER_DUP_ENTRY') {
      throw AppError.conflict('Ya existe una cuenta registrada con ese correo electrónico.');
    }
    throw error;
  } finally {
    connection.release();
  }
}

/** Cambia el rol de un usuario existente. */
async function updateRole(userId, roleName) {
  const [result] = await pool.execute(
    'UPDATE users SET role_id = (SELECT id FROM roles WHERE name = ?) WHERE id = ?',
    [roleName, userId]
  );
  return result.affectedRows === 1;
}

/** Cambia el estado (active | suspended) de un usuario. */
async function updateStatus(userId, status) {
  const [result] = await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
  return result.affectedRows === 1;
}

module.exports = {
  toPublicUser,
  findById,
  findByEmail,
  findAuthByEmail,
  createWithAlertSettings,
  updateRole,
  updateStatus
};
