/* Run from project root: node scripts/import-schema-to-target.js
   This script reads database/schema.sql, removes any CREATE DATABASE / USE statements
   and executes the remaining SQL against the configured DB (DB_NAME from .env).
*/
require("dotenv").config({ path: __dirname + "/../.env" });
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

(async () => {
  try {
    const sqlPath = path.join(__dirname, "..", "database", "schema.sql");
    let sql = fs.readFileSync(sqlPath, "utf8");

    // Remove CREATE DATABASE and USE statements so we don't create/use a different DB
    sql = sql.replace(/CREATE\s+DATABASE[\s\S]*?;\s*/gi, "");
    sql = sql.replace(/USE\s+[^;]+;\s*/gi, "");

    const dbName = process.env.DB_NAME;
    if (!dbName) throw new Error("DB_NAME not set in .env");

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 4000,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
      multipleStatements: true,
      ssl: process.env.DB_SSL_CA
        ? { ca: fs.readFileSync(process.env.DB_SSL_CA) }
        : undefined,
    });

    console.log(
      `Connected to DB ${process.env.DB_HOST}:${process.env.DB_PORT} using database '${dbName}'. Running schema...`
    );
    await connection.query(sql);
    console.log("Schema applied successfully to", dbName);
    await connection.end();
  } catch (err) {
    console.error("Schema import failed:", err);
    process.exit(1);
  }
})();
