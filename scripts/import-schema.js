/* Run from project root: node scripts/import-schema.js
   This script reads database/schema.sql and executes it against the configured DB (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD).
*/
require("dotenv").config({ path: __dirname + "/../.env" });
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

(async () => {
  try {
    const sqlPath = path.join(__dirname, "..", "database", "schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 4000,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
      ssl: process.env.DB_SSL_CA
        ? { ca: fs.readFileSync(process.env.DB_SSL_CA) }
        : undefined,
      database: undefined,
    });

    console.log("Connected to DB. Running schema...");
    await connection.query(sql);
    console.log("Schema applied successfully.");
    await connection.end();
  } catch (err) {
    console.error("Schema import failed:", err);
    process.exit(1);
  }
})();
