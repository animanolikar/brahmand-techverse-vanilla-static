"use strict";

const argon2 = require("argon2");

const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: Number(process.env.ARGON2_MEMORY_COST || 19456),
  timeCost: Number(process.env.ARGON2_TIME_COST || 2),
  parallelism: Number(process.env.ARGON2_PARALLELISM || 1),
};

async function hashPassword(plainPassword) {
  if (!plainPassword) {
    throw new Error("Password required for hashing");
  }

  return argon2.hash(plainPassword, HASH_OPTIONS);
}

async function verifyPassword(hashedPassword, plainPassword) {
  if (!hashedPassword || !plainPassword) {
    return false;
  }

  const normalizedHash = Buffer.isBuffer(hashedPassword)
    ? hashedPassword.toString()
    : hashedPassword;

  try {
    return await argon2.verify(normalizedHash, plainPassword, HASH_OPTIONS);
  } catch {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
};

