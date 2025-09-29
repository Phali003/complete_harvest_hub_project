/* Usage: node scripts/list-tables.js
   Lists tables in the DB_NAME configured in .env
*/
require("dotenv").config({ path: __dirname + "/../.env" });
const mysql = require("mysql2/promise");
const fs = require("fs");

(async () => {
  try {
    const dbName = process.env.DB_NAME;
    if (!dbName) throw new Error("DB_NAME not set in .env");

    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 4000,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      ssl: process.env.DB_SSL_CA
        ? { ca: fs.readFileSync(process.env.DB_SSL_CA, "utf8") }
        : undefined,
    });

    const [rows] = await pool.query(
      "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ?",
      [dbName]
    );
    console.log("Tables in", dbName, ":");
    rows.forEach((r) => console.log(" -", r.TABLE_NAME));
    await pool.end();
  } catch (err) {
    console.error("Failed to list tables:", err);
    process.exit(1);
  }
})();
