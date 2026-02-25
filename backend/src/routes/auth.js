import { Router } from "express";
import { createHash, randomBytes } from "node:crypto";
import { sendEmail } from "../services/email.js";
import {
  createUser,
  getUserByEmail,
  getUserById,
  insertAuditLog,
  revokeAllUserSessions,
  revokeSessionByTokenHash,
  updateUserPassword
} from "../store/store.js";
import { authenticateWithEmailPassword, isOpenSignupEnabled, issueSessionForUser, requireAuth } from "../auth.js";
import { hashPassword, validatePasswordPolicy, verifyPassword } from "../utils/password.js";

export const authRouter = Router();

const resetTokens = new Map();

function hashToken(value) {
  return createHash("sha256").update(String(value || "")).digest("hex");
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName || "",
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt || null
  };
}

authRouter.post("/auth/register", async (req, res) => {
  try {
    const signupEnabled = await isOpenSignupEnabled();
    if (!signupEnabled) return res.status(403).json({ error: "signup_disabled" });
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const displayName = String(req.body?.displayName || "").trim();
    if (!email || !password) return res.status(400).json({ error: "email_and_password_required" });
    const policyError = validatePasswordPolicy(password);
    if (policyError) return res.status(400).json({ error: policyError });
    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ error: "email_already_exists" });
    const created = await createUser({
      email,
      displayName,
      role: "user",
      status: "active",
      passwordHash: hashPassword(password)
    });
    return res.status(201).json({ user: sanitizeUser(created) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

authRouter.post("/auth/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) return res.status(400).json({ error: "email_and_password_required" });
    const user = await authenticateWithEmailPassword(email, password);
    if (!user) return res.status(401).json({ error: "invalid_credentials" });
    if (user.status === "blocked") return res.status(403).json({ error: "blocked_user" });
    const session = await issueSessionForUser(user.id);
    return res.json({
      token: session.token,
      expiresAt: session.expiresAt,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

authRouter.post("/auth/logout", requireAuth, async (req, res) => {
  try {
    if (req.authToken) {
      await revokeSessionByTokenHash(hashToken(req.authToken));
    }
    return res.json({ loggedOut: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

authRouter.get("/auth/me", requireAuth, async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});

authRouter.post("/auth/change-password", requireAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "current_and_new_password_required" });
    }
    const dbUser = await getUserById(req.user.id);
    if (!dbUser || !verifyPassword(currentPassword, dbUser.passwordHash)) {
      return res.status(401).json({ error: "current_password_invalid" });
    }
    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) return res.status(400).json({ error: policyError });
    await updateUserPassword(req.user.id, hashPassword(newPassword));
    await revokeAllUserSessions(req.user.id);
    await insertAuditLog({
      actorUserId: req.user.id,
      targetUserId: req.user.id,
      event: "user.change_password",
      details: {}
    });
    return res.json({ updated: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

authRouter.post("/auth/forgot-password", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "email_required" });
    const user = await getUserByEmail(email);
    if (!user) return res.json({ accepted: true });
    const token = randomBytes(24).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = Date.now() + (1000 * 60 * 30);
    resetTokens.set(tokenHash, { userId: user.id, expiresAt, used: false });
    const resetLink = `${String(process.env.APP_PUBLIC_BASE_URL || "").replace(/\/$/, "") || "http://localhost:8088"}/?reset_token=${token}`;
    const outcome = await sendEmail({
      to: email,
      subject: "Open-Voice-Journal password reset",
      text: `Use this link to reset your password: ${resetLink}`,
      html: `<p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    });
    if (!outcome.sent) {
      console.log(`[auth] password reset for ${email}: ${resetLink}`);
    }
    return res.json({ accepted: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

authRouter.post("/auth/reset-password", async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const newPassword = String(req.body?.newPassword || "");
    if (!token || !newPassword) return res.status(400).json({ error: "token_and_new_password_required" });
    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) return res.status(400).json({ error: policyError });
    const tokenKey = hashToken(token);
    const entry = resetTokens.get(tokenKey);
    if (!entry || entry.used || entry.expiresAt < Date.now()) {
      return res.status(400).json({ error: "invalid_or_expired_token" });
    }
    await updateUserPassword(entry.userId, hashPassword(newPassword));
    await revokeAllUserSessions(entry.userId);
    entry.used = true;
    resetTokens.set(tokenKey, entry);
    return res.json({ updated: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
