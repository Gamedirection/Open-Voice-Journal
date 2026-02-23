import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import {
  createOpenApiKey,
  getAppSetting,
  insertAuditLog,
  listOpenApiKeysByUser,
  revokeOpenApiKey,
  upsertAppSetting
} from "../store/store.js";

export const adminSettingsRouter = Router();

function tokenHash(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  if (value == null) return fallback;
  return Boolean(value);
}

function buildApiKey() {
  return `ovjok_${randomBytes(24).toString("hex")}`;
}

adminSettingsRouter.get("/admin/settings/auth", async (_req, res) => {
  try {
    const stored = await getAppSetting("auth.open_signup_enabled");
    const openSignupEnabled = stored && Object.prototype.hasOwnProperty.call(stored, "enabled")
      ? toBool(stored.enabled, true)
      : true;
    return res.json({ openSignupEnabled });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminSettingsRouter.patch("/admin/settings/auth", async (req, res) => {
  try {
    const openSignupEnabled = toBool(req.body?.openSignupEnabled, true);
    await upsertAppSetting("auth.open_signup_enabled", { enabled: openSignupEnabled });
    await insertAuditLog({
      actorUserId: req.user?.id || null,
      targetUserId: req.user?.id || null,
      event: "admin.settings.auth.update",
      details: { openSignupEnabled }
    });
    return res.json({ openSignupEnabled });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminSettingsRouter.get("/admin/openapi-keys", async (req, res) => {
  try {
    const keys = await listOpenApiKeysByUser(req.user.id);
    return res.json({ keys });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminSettingsRouter.post("/admin/openapi-keys", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "name_required" });
    const token = buildApiKey();
    const created = await createOpenApiKey({
      userId: req.user.id,
      name,
      keyHash: tokenHash(token),
      prefix: token.slice(0, 12)
    });
    await insertAuditLog({
      actorUserId: req.user?.id || null,
      targetUserId: req.user?.id || null,
      event: "admin.openapi_key.create",
      details: { keyId: created.id, name: created.name, prefix: created.prefix }
    });
    return res.status(201).json({ key: token, record: created });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminSettingsRouter.delete("/admin/openapi-keys/:id", async (req, res) => {
  try {
    const revoked = await revokeOpenApiKey(req.params.id, req.user.id);
    if (!revoked) return res.status(404).json({ error: "openapi_key_not_found" });
    await insertAuditLog({
      actorUserId: req.user?.id || null,
      targetUserId: req.user?.id || null,
      event: "admin.openapi_key.revoke",
      details: { keyId: revoked.id, name: revoked.name }
    });
    return res.json({ revoked: true, key: revoked });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
