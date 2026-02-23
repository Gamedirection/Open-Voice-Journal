import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;

export function hashPassword(password) {
  const value = String(password || "");
  if (!value) throw new Error("password is required");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(value, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password, encoded) {
  const value = String(password || "");
  const parts = String(encoded || "").split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = parts[1];
  const expectedHex = parts[2];
  if (!salt || !expectedHex) return false;
  const computed = scryptSync(value, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length !== computed.length) return false;
  return timingSafeEqual(expected, computed);
}

export function validatePasswordPolicy(password) {
  const value = String(password || "");
  if (value.length < 12) return "Password must be at least 12 characters.";
  if (!/[a-z]/.test(value)) return "Password must include a lowercase letter.";
  if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter.";
  if (!/\d/.test(value)) return "Password must include a number.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Password must include a symbol.";
  if (/password|123456|qwerty|letmein/i.test(value)) return "Password is too weak.";
  return "";
}
