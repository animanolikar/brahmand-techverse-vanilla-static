"use strict";

require("../src/shims/patch-debug");

const path = require("path");
const { pool } = require("../src/config/db");
const { ROLE_SCOPES } = require("../src/config/rbac");
const { hashPassword } = require("../src/utils/password");

function parseArgs(argv) {
  return argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    acc[key] = value;
    return acc;
  }, {});
}

async function ensureRole(roleName) {
  const normalizedRole = roleName.toLowerCase();
  const scopes = ROLE_SCOPES[normalizedRole];
  if (!scopes) {
    throw new Error(`Unknown role "${roleName}". Available: ${Object.keys(ROLE_SCOPES).join(", ")}`);
  }

  const [rows] = await pool.query(`SELECT id FROM roles WHERE name = ? LIMIT 1`, [normalizedRole]);
  if (rows[0]) {
    return rows[0].id;
  }

  const [result] = await pool.query(
    `INSERT INTO roles (name, scopes, description) VALUES (?, ?, ?)`,
    [normalizedRole, JSON.stringify(scopes), `Auto-created role for ${normalizedRole}`],
  );

  return result.insertId;
}

async function upsertUser({ email, password, roleId }) {
  const hashedPassword = await hashPassword(password);
  const passwordBuffer = Buffer.from(hashedPassword);

  const [existing] = await pool.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);

  if (existing[0]) {
    await pool.query(
      `UPDATE users
       SET password_hash = ?, role_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [passwordBuffer, roleId, existing[0].id],
    );
    return existing[0].id;
  }

  const [result] = await pool.query(
    `INSERT INTO users (email, password_hash, role_id, mfa_enabled)
     VALUES (?, ?, ?, 0)`,
    [email, passwordBuffer, roleId],
  );

  return result.insertId;
}

async function main() {
  const args = parseArgs(process.argv);
  const email = args.email || args.e;
  const password = args.password || args.p;
  const role = (args.role || args.r || "super_admin").toLowerCase();

  if (!email || !password) {
    console.error("Usage: node scripts/create-admin-user.js --email=admin1@brahmand.co --password=Aniruddha@450 --role=super_admin");
    process.exit(1);
  }

  try {
    console.log(`Ensuring role "${role}" exists…`);
    const roleId = await ensureRole(role);

    console.log(`Saving user "${email}"…`);
    const userId = await upsertUser({ email, password, roleId });

    console.log(`✅ User ready (id=${userId}). Try logging in at /admin`);
  } catch (error) {
    console.error("Failed to create user:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

