#!/usr/bin/env node
/*
Simple diagnostic: fetch a user's password hash from the database and compare it to a plaintext
Usage (PowerShell):
  node .\scripts\check-password.js --email user@example.com --password "PlainTextPassword"

This script reads the same `.env` settings as the app, including DB_SSL_CA or DB_SSL_CA_CONTENT handling
so it should work the same way the server connects.
*/
require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--email" || a === "-e") {
      args.email = argv[++i];
    } else if (a === "--password" || a === "-p") {
      args.password = argv[++i];
    }
  }
  return args;
}

async function buildPoolConfig() {
  const cfg = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "test",
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
  };

  // Support DB_SSL_CA_CONTENT similar to server startup: if present, decode/write temp file
  if (!process.env.DB_SSL_CA && process.env.DB_SSL_CA_CONTENT) {
    const content = process.env.DB_SSL_CA_CONTENT;
    let pem = content;
    // Detect base64 (no '-----BEGIN CERTIFICATE-----')
    if (!content.includes("-----BEGIN CERTIFICATE-----")) {
      try {
        pem = Buffer.from(content, "base64").toString("utf8");
      } catch (e) {
        // leave as-is
      }
    }
    // write to a file next to script
    const outDir = path.resolve(__dirname, "..", "certs");
    try {
      fs.mkdirSync(outDir, { recursive: true });
    } catch (e) {}
    const outFile = path.join(outDir, "db_ca_from_env.pem");
    fs.writeFileSync(outFile, pem, { mode: 0o600 });
    process.env.DB_SSL_CA = outFile;
    console.log("Wrote DB SSL CA to", outFile);
  }

  if (process.env.DB_SSL_CA) {
    try {
      const ca = fs.readFileSync(process.env.DB_SSL_CA, "utf8");
      cfg.ssl = { ca };
      if (
        process.env.DB_REJECT_UNAUTHORIZED &&
        process.env.DB_REJECT_UNAUTHORIZED.toLowerCase() === "false"
      ) {
        cfg.ssl.rejectUnauthorized = false;
      }
    } catch (err) {
      console.warn(
        "Could not read DB_SSL_CA at",
        process.env.DB_SSL_CA,
        err.message
      );
    }
  }

  return cfg;
}

async function main() {
  const { email, password } = parseArgs();
  if (!email || !password) {
    console.error(
      'Usage: node scripts/check-password.js --email user@example.com --password "PlainText"'
    );
    process.exit(2);
  }

  const cfg = await buildPoolConfig();
  let conn;
  try {
    const pool = await mysql.createPool(cfg);
    conn = pool;
    console.log(
      `Connected to DB ${cfg.host}:${cfg.port} database='${cfg.database}'`
    );

    const [rows] = await pool.query(
      "SELECT id, email, password FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (!rows || rows.length === 0) {
      console.error("No user found with email", email);
      process.exit(3);
    }
    const user = rows[0];
    console.log("User id:", user.id);
    const hash = user.password;
    if (!hash) {
      console.error("User has no password hash stored");
      process.exit(4);
    }

    const match = await bcrypt.compare(password, hash);
    console.log("bcrypt.compare result:", match);
    if (!match) {
      console.log("Stored hash (truncated):", hash.slice(0, 60) + "...");
    } else {
      console.log(
        "Password matches stored hash — login should succeed for this plaintext."
      );
    }

    await pool.end();
    process.exit(match ? 0 : 5);
  } catch (err) {
    console.error("Error:", err.message || err);
    process.exit(10);
  }
}

main();
