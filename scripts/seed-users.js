#!/usr/bin/env node
/*
Seed a default producer user for local testing.
  - Email: producer@gmail.com
  - Password: Password123!
  Usage:
    node scripts/seed-users.js
*/
require("dotenv").config({ path: __dirname + "/../.env", override: true });
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const fs = require("fs");

async function getConnection() {
  const ssl = (() => {
    try {
      if (process.env.DB_SSL_CA) {
        const ca = fs.readFileSync(process.env.DB_SSL_CA, "utf8");
        const opts = { ca };
        if (
          process.env.DB_REJECT_UNAUTHORIZED &&
          process.env.DB_REJECT_UNAUTHORIZED.toLowerCase() === "false"
        ) {
          opts.rejectUnauthorized = false;
        }
        return opts;
      }
    } catch (e) {
      console.warn("Warning: could not read DB SSL CA:", e.message);
    }
    return undefined;
  })();

  const cfg = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || process.env.DB_PORT || 4000),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "harvest_hub",
    ssl,
    multipleStatements: true,
  };
  console.log(
    "Connecting with:",
    JSON.stringify(
      {
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        database: cfg.database,
      },
      null,
      2
    )
  );
  return mysql.createConnection(cfg);
}

async function ensureProducerUser() {
  const email = "producer@gmail.com";
  const plainPassword = "Password123!";
  const firstName = "Demo";
  const lastName = "Producer";
  const role = "producer";

  const conn = await getConnection();
  try {
    // Ensure we're using the expected database
    const dbName = process.env.DB_NAME || "harvest_hub";
    await conn.query(`USE \`${dbName}\``);
    const [users] = await conn.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length) {
      console.log("User already exists:", email);
      return users[0];
    }

    const hash = await bcrypt.hash(plainPassword, 10);
    const [result] = await conn.execute(
      "INSERT INTO users (email, password, first_name, last_name, role, is_verified) VALUES (?, ?, ?, ?, ?, TRUE)",
      [email, hash, firstName, lastName, role]
    );
    const userId = result.insertId;
    console.log("Created user:", email, "id=", userId);
    return { id: userId, email, role };
  } finally {
    await conn.end();
  }
}

async function ensureProducerProfile(user) {
  const conn = await getConnection();
  try {
    const dbName = process.env.DB_NAME || "harvest_hub";
    await conn.query(`USE \`${dbName}\``);
    const [rows] = await conn.execute(
      "SELECT * FROM producer_profiles WHERE user_id = ?",
      [user.id]
    );
    if (rows.length) {
      console.log("Producer profile already exists for user", user.id);
      return rows[0];
    }
    const [result] = await conn.execute(
      "INSERT INTO producer_profiles (user_id, business_name, description, is_approved) VALUES (?, ?, ?, TRUE)",
      [user.id, "Demo Producer Farm", "Demo producer profile for testing"]
    );
    console.log("Created producer profile id=", result.insertId);
    return { id: result.insertId };
  } finally {
    await conn.end();
  }
}

(async () => {
  try {
    const user = await ensureProducerUser();
    await ensureProducerProfile(user);
    console.log(
      "Seeding complete. Login with: producer@gmail.com / Password123!"
    );
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
})();
