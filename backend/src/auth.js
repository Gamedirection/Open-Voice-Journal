import { createHash, randomBytes } from "node:crypto";
import {
  assignUnownedRecordingsToUser,
  getAppSetting,
  getOpenApiKeyByHash,
  createSession,
  createUser,
  getSessionByTokenHash,
  getUserByEmail,
  getUserById,
  touchOpenApiKeyLastUsed,
  touchUserLogin
} from "./store/store.js";
import { hashPassword, validatePasswordPolicy, verifyPassword } from "./utils/password.js";

const SESSION_TTL_MS = Number(process.env.AUTH_SESSION_TTL_MS || (1000 * 60 * 60 * 24 * 14));

function tokenHash(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  if (value == null) return fallback;
  return Boolean(value);
}

export function buildSessionToken() {
  return randomBytes(32).toString("hex");
}

export function getBearerToken(req) {
  const raw = String(req.headers.authorization || "");
  if (!raw.toLowerCase().startsWith("bearer ")) return "";
  return raw.slice(7).trim();
}

export async function isOpenSignupEnabled() {
  const stored = await getAppSetting("auth.open_signup_enabled");
  if (stored && Object.prototype.hasOwnProperty.call(stored, "enabled")) {
    return toBool(stored.enabled, true);
  }
  return true;
}

export async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "auth_required" });
    const session = await getSessionByTokenHash(tokenHash(token));
    if (!session) return res.status(401).json({ error: "invalid_session" });
    if (session.revokedAt) return res.status(401).json({ error: "session_revoked" });
    const expiresAt = new Date(session.expiresAt).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      return res.status(401).json({ error: "session_expired" });
    }
    if (!session.user) return res.status(401).json({ error: "invalid_user" });
    if (session.user.status === "blocked") {
      return res.status(403).json({ error: "blocked_user" });
    }
    req.authToken = token;
    req.user = session.user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "auth_required" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "admin_required" });
  return next();
}

export async function requireOpenApiAccess(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (token) {
      const session = await getSessionByTokenHash(tokenHash(token));
      if (session && !session.revokedAt && new Date(session.expiresAt).getTime() > Date.now() && session.user) {
        if (session.user.status === "blocked") return res.status(403).json({ error: "blocked_user" });
        if (session.user.role === "admin") {
          req.authToken = token;
          req.user = session.user;
          return next();
        }
      }
    }

    const openApiKey = String(req.headers["x-openapi-key"] || "").trim();
    if (!openApiKey) return res.status(401).json({ error: "auth_required" });
    const key = await getOpenApiKeyByHash(tokenHash(openApiKey));
    if (!key || key.revokedAt) return res.status(401).json({ error: "invalid_openapi_key" });
    if (!key.user || key.user.role !== "admin" || key.user.status !== "active") {
      return res.status(403).json({ error: "admin_required" });
    }
    await touchOpenApiKeyLastUsed(key.id);
    req.user = key.user;
    req.openApiKey = key;
    return next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function issueSessionForUser(userId) {
  const token = buildSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await createSession(userId, tokenHash(token), expiresAt);
  return { token, expiresAt };
}

export async function authenticateWithEmailPassword(email, password) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  await touchUserLogin(user.id);
  const refreshed = await getUserById(user.id);
  return refreshed;
}

export async function ensureDefaultAdmin() {
  const email = String(process.env.APP_DEFAULT_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.APP_DEFAULT_ADMIN_PASSWORD || "");
  const displayName = String(process.env.APP_DEFAULT_ADMIN_NAME || "Admin").trim() || "Admin";
  if (!email || !password) return { seeded: false, reason: "missing_default_admin_env" };
  const policyError = validatePasswordPolicy(password);
  if (policyError) {
    console.warn(`[auth] default admin not seeded: ${policyError}`);
    return { seeded: false, reason: policyError };
  }
  const existing = await getUserByEmail(email);
  if (existing) {
    await assignUnownedRecordingsToUser(existing.id);
    return { seeded: false, reason: "already_exists" };
  }
  const created = await createUser({
    email,
    displayName,
    role: "admin",
    status: "active",
    passwordHash: hashPassword(password)
  });
  await assignUnownedRecordingsToUser(created.id);
  return { seeded: true, userId: created.id };
}
