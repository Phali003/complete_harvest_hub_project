// checkPassword.js
// Usage: node checkPassword.js user@example.com plaintextPassword
// This script reads database settings from .env and checks bcrypt.compare

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function main() {
  const email = process.argv[2];
  const plain = process.argv[3];
  if (!email || !plain) {
    console.error('Usage: node checkPassword.js user@example.com plaintextPassword');
    process.exit(1);
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test',
    port: process.env.DB_PORT || 3306,
  });

  try {
    const [rows] = await pool.execute('SELECT id, email, password FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      console.error('No user found for', email);
      process.exit(2);
    }
    const user = rows[0];
    console.log('User id:', user.id);
    console.log('Stored hash:', user.password);

    const match = await bcrypt.compare(plain, user.password || '');
    console.log('Does plaintext match stored hash?', match);
  } catch (err) {
    console.error('Error:', err);
    process.exit(3);
  } finally {
    await pool.end();
  }
}

main();
