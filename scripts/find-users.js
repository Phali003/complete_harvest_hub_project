#!/usr/bin/env node
/*
Find users by email pattern. Usage:
  node .\scripts\find-users.js --pattern prisc
Defaults to pattern 'prisc'
*/
require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pattern" || a === "-p") {
      args.pattern = argv[++i];
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

  if (!process.env.DB_SSL_CA && process.env.DB_SSL_CA_CONTENT) {
    const content = process.env.DB_SSL_CA_CONTENT;
    let pem = content;
    if (!content.includes("-----BEGIN CERTIFICATE-----")) {
      try {
        pem = Buffer.from(content, "base64").toString("utf8");
      } catch (e) {}
    }
    const outDir = path.resolve(__dirname, "..", "certs");
    try {
      fs.mkdirSync(outDir, { recursive: true });
    } catch (e) {}
    const outFile = path.join(outDir, "db_ca_from_env.pem");
    fs.writeFileSync(outFile, pem, { mode: 0o600 });
    process.env.DB_SSL_CA = outFile;
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
  const { pattern } = parseArgs();
  const p = pattern ? `%${pattern}%` : "%prisc%";
  const cfg = await buildPoolConfig();
  try {
    const pool = await mysql.createPool(cfg);
    console.log(
      `Connected to DB ${cfg.host}:${cfg.port} database='${cfg.database}'`
    );
    const [rows] = await pool.query(
      "SELECT id, email FROM users WHERE email LIKE ? LIMIT 100",
      [p]
    );
    if (!rows || rows.length === 0) {
      console.log("No matching users found for pattern", p);
      await pool.end();
      process.exit(0);
    }
    console.log("Matches:");
    for (const r of rows) {
      console.log(r.id, r.email);
    }
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message || err);
    process.exit(1);
  }
}

main();
