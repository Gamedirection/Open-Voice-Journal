import { Router } from "express";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import {
  createRecording,
  countActiveAdmins,
  countActiveAdminsExcludingUser,
  getUserById,
  getUserUsage,
  hardDeleteUserAndData,
  insertAuditLog,
  listUserOwnedRecordings,
  listUsers,
  revokeAllUserSessions,
  updateRecordingMetadata,
  updateUserRole,
  updateUserStatus
} from "../store/store.js";

export const adminUsersRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");
const userBackupsDir = path.resolve(__dirname, "../../backups/users");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

function safeFileName(value) {
  return String(value || "").replace(/[^\w.\-]+/g, "_");
}

function formatGravatar(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return "";
  // md5-like fallback endpoint supports hash path only; leave empty for now.
  return `https://gravatar.com/profile`;
}

async function buildUserBackupPayload(user) {
  const recordings = await listUserOwnedRecordings(user.id);
  const summaries = [];
  const entries = [];
  for (const recording of recordings) {
    const fileName = recording.metadata?.audio?.fileName;
    let audio = null;
    if (fileName) {
      const filePath = path.resolve(uploadsDir, fileName);
      if (filePath.startsWith(uploadsDir) && existsSync(filePath)) {
        const data = await fs.readFile(filePath);
        audio = {
          originalName: recording.metadata?.audio?.originalName || fileName,
          mimeType: recording.metadata?.audio?.mimeType || "application/octet-stream",
          fileName,
          size: data.length,
          dataBase64: data.toString("base64")
        };
      }
    }
    entries.push({
      id: recording.id,
      title: recording.title,
      status: recording.status,
      createdAt: recording.createdAt,
      metadata: recording.metadata || {},
      audio
    });
  }
  return {
    manifest: {
      version: 1,
      createdAt: new Date().toISOString(),
      source: "open-voice-journal"
    },
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName || "",
      role: user.role,
      status: user.status
    },
    recordings: entries,
    summaries
  };
}

adminUsersRouter.get("/admin/users", async (req, res) => {
  try {
    const queryText = String(req.query.query || "").trim();
    const status = String(req.query.status || "").trim();
    const role = String(req.query.role || "").trim();
    const sort = String(req.query.sort || "created_desc").trim();
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
    const offset = Math.max(Number(req.query.offset || 0), 0);
    const users = await listUsers({ queryText, status, role, limit, offset });
    const rows = await Promise.all(users.map(async (user) => {
      const usage = await getUserUsage(user.id);
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName || "",
        role: user.role,
        status: user.status,
        avatarUrlEffective: user.avatarUrl || formatGravatar(user.email),
        createdAt: user.createdAt,
        usage
      };
    }));
    const sorted = rows.sort((a, b) => {
      if (sort === "storage_desc") return b.usage.audioBytesTotal - a.usage.audioBytesTotal;
      if (sort === "activity_desc") return new Date(b.usage.lastActivityAt || 0) - new Date(a.usage.lastActivityAt || 0);
      if (sort === "recordings_desc") return b.usage.recordingsTotal - a.usage.recordingsTotal;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return res.json({ users: sorted, pagination: { limit, offset } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.get("/admin/users/:id/usage", async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    const usage = await getUserUsage(user.id);
    return res.json({ usage });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.post("/admin/users/:id/block", async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    const updated = await updateUserStatus(user.id, "blocked");
    await revokeAllUserSessions(user.id);
    await insertAuditLog({
      actorUserId: req.user?.id || null,
      targetUserId: user.id,
      event: "admin.user.block",
      details: {}
    });
    return res.json({ user: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.post("/admin/users/:id/unblock", async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    const updated = await updateUserStatus(user.id, "active");
    await insertAuditLog({
      actorUserId: req.user?.id || null,
      targetUserId: user.id,
      event: "admin.user.unblock",
      details: {}
    });
    return res.json({ user: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.post("/admin/users/:id/promote", async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    if (user.role === "admin") return res.json({ user });
    const updated = await updateUserRole(user.id, "admin");
    await insertAuditLog({
      actorUserId: req.user?.id || null,
      targetUserId: user.id,
      event: "admin.user.promote",
      details: {}
    });
    return res.json({ user: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.post("/admin/users/:id/demote", async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    if (req.user?.id === user.id) return res.status(400).json({ error: "cannot_self_demote" });
    if (user.role !== "admin") return res.json({ user });
    if (user.status === "active") {
      const remainingAdmins = await countActiveAdminsExcludingUser(user.id);
      if (remainingAdmins < 1) {
        return res.status(400).json({ error: "cannot_demote_last_active_admin" });
      }
    }
    const updated = await updateUserRole(user.id, "user");
    await insertAuditLog({
      actorUserId: req.user?.id || null,
      targetUserId: user.id,
      event: "admin.user.demote",
      details: {}
    });
    return res.json({ user: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.post("/admin/users/:id/backup", async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    const payload = await buildUserBackupPayload(user);
    await fs.mkdir(userBackupsDir, { recursive: true });
    const fileName = `user-backup-${safeFileName(user.email)}-${Date.now()}.json`;
    const filePath = path.resolve(userBackupsDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
    await insertAuditLog({
      actorUserId: req.user?.id || null,
      targetUserId: user.id,
      event: "admin.user.backup",
      details: { fileName }
    });
    return res.json({ backupFile: fileName, payload });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.post("/admin/users/:id/restore", upload.single("backup"), async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    let payload = req.body?.payload || null;
    if (req.file?.buffer?.length) {
      payload = req.file.buffer.toString("utf8");
    }
    if (typeof payload === "string") payload = JSON.parse(payload);
    if (!payload || !Array.isArray(payload.recordings)) {
      return res.status(400).json({ error: "invalid_backup_payload" });
    }
    let restored = 0;
    for (const entry of payload.recordings) {
      const existing = await listUserOwnedRecordings(user.id);
      const collision = existing.find((row) => row.id === entry.id);
      const restoredMeta = {
        ...(entry.metadata || {}),
        backup: {
          restoredAt: new Date().toISOString(),
          restoredFromId: entry.id || null
        }
      };
      const created = await createRecording({
        title: entry.title || "Restored recording",
        ownerUserId: user.id,
        metadata: restoredMeta
      });
      if (entry.audio?.dataBase64) {
        await fs.mkdir(uploadsDir, { recursive: true });
        const ext = path.extname(entry.audio.originalName || "") || ".webm";
        const buffer = Buffer.from(entry.audio.dataBase64, "base64");
        const fileName = `${created.id}-${Date.now()}-restored${collision ? "-dup" : ""}${ext}`;
        const filePath = path.resolve(uploadsDir, fileName);
        await fs.writeFile(filePath, buffer);
        await updateRecordingMetadata(created.id, {
          audio: {
            fileName,
            originalName: entry.audio.originalName || fileName,
            mimeType: entry.audio.mimeType || "application/octet-stream",
            size: buffer.length,
            uploadedAt: new Date().toISOString()
          }
        });
      }
      restored += 1;
    }
    await insertAuditLog({
      actorUserId: req.user?.id || null,
      targetUserId: user.id,
      event: "admin.user.restore",
      details: { restored }
    });
    return res.json({ restored });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

adminUsersRouter.delete("/admin/users/:id", async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "user_not_found" });
    if (req.user?.id === user.id) return res.status(400).json({ error: "cannot_self_delete" });
    if (user.role === "admin" && user.status === "active") {
      const activeAdmins = await countActiveAdmins();
      if (activeAdmins <= 1) {
        return res.status(400).json({ error: "cannot_delete_last_active_admin" });
      }
    }
    const confirmation = String(req.query.confirm || req.body?.confirm || "").trim();
    if (confirmation.toUpperCase() !== "DELETE") {
      return res.status(400).json({ error: "confirmation_required", hint: "pass confirm=DELETE" });
    }
    const removed = await hardDeleteUserAndData(user.id);
    for (const recording of removed.recordings) {
      const fileName = recording.metadata?.audio?.fileName;
      if (!fileName) continue;
      const filePath = path.resolve(uploadsDir, fileName);
      if (filePath.startsWith(uploadsDir) && existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    }
    await insertAuditLog({
      actorUserId: req.user?.id || null,
      targetUserId: user.id,
      event: "admin.user.delete",
      details: { recordingCount: removed.recordingIds.length }
    });
    return res.json({ deleted: true, userId: user.id, deletedRecordings: removed.recordingIds.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
