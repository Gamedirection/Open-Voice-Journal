import crypto from "node:crypto";

const KEY = process.env.SECRET_ENCRYPTION_KEY || "replace_me";

function normalizedKey() {
  return crypto.createHash("sha256").update(KEY).digest();
}

export function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", normalizedKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}
