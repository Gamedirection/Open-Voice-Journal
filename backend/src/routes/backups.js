import { Router } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  createRecording,
  deleteRecording,
  listRecordings,
  updateRecordingMetadata,
  updateRecordingStatus
} from "../store/store.js";

export const backupsRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");
const backupsDir = path.resolve(__dirname, "../../backups");

function ensureSafeFileName(value) {
  return String(value || "").replace(/[^\w.\-]+/g, "_");
}

function resolveBackupPath(name) {
  const safeName = ensureSafeFileName(name);
  const filePath = path.resolve(backupsDir, safeName);
  if (!filePath.startsWith(backupsDir)) {
    throw new Error("invalid backup file path");
  }
  return { safeName, filePath };
}

function getBackupFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `backup-${stamp}.json`;
}

async function ensureDirs() {
  await fs.mkdir(backupsDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });
}

async function listBackups() {
  await ensureDirs();
  const names = await fs.readdir(backupsDir);
  const files = await Promise.all(
    names
      .filter((name) => name.endsWith(".json"))
      .map(async (name) => {
        const filePath = path.resolve(backupsDir, name);
        const stat = await fs.stat(filePath);
        return {
          name,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
          updatedAt: stat.mtime.toISOString()
        };
      })
  );
  return files.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function buildBackupPayload() {
  const recordings = await listRecordings(10000);
  const entries = [];

  for (const recording of recordings) {
    const entry = {
      id: recording.id,
      title: recording.title,
      status: recording.status,
      createdAt: recording.createdAt,
      metadata: recording.metadata || {},
      audio: null
    };

    const fileName = recording.metadata?.audio?.fileName;
    if (fileName) {
      const filePath = path.resolve(uploadsDir, fileName);
      if (filePath.startsWith(uploadsDir) && existsSync(filePath)) {
        const data = await fs.readFile(filePath);
        entry.audio = {
          originalName: recording.metadata?.audio?.originalName || fileName,
          mimeType: recording.metadata?.audio?.mimeType || "application/octet-stream",
          dataBase64: data.toString("base64")
        };
      }
    }

    entries.push(entry);
  }

  return {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    recordings: entries
  };
}

async function restoreBackup(payload, backupName, replaceExisting = false) {
  await ensureDirs();
  if (!Array.isArray(payload?.recordings)) {
    throw new Error("invalid backup format");
  }

  if (replaceExisting) {
    const existing = await listRecordings(10000);
    for (const recording of existing) {
      const fileName = recording.metadata?.audio?.fileName;
      if (fileName) {
        const filePath = path.resolve(uploadsDir, fileName);
        if (filePath.startsWith(uploadsDir) && existsSync(filePath)) {
          await fs.unlink(filePath);
        }
      }
      await deleteRecording(recording.id);
    }
  }

  let restored = 0;
  for (const entry of payload.recordings) {
    const created = await createRecording({
      title: entry.title || "Restored recording",
      metadata: {
        ...(entry.metadata || {}),
        backup: {
          restoredFrom: backupName,
          originalId: entry.id || null,
          restoredAt: new Date().toISOString()
        }
      }
    });

    await updateRecordingStatus(created.id, entry.status || "uploaded");

    if (entry.audio?.dataBase64) {
      const buffer = Buffer.from(entry.audio.dataBase64, "base64");
      const ext = path.extname(entry.audio.originalName || "") || ".webm";
      const fileName = `${created.id}-${Date.now()}-restored${ext}`;
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

  return restored;
}

backupsRouter.get("/backups", async (_req, res) => {
  try {
    const backups = await listBackups();
    res.json({ backups });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

backupsRouter.post("/backups", async (_req, res) => {
  try {
    await ensureDirs();
    const name = getBackupFileName();
    const filePath = path.resolve(backupsDir, name);
    const payload = await buildBackupPayload();
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");

    const stat = await fs.stat(filePath);
    res.status(201).json({
      backup: {
        name,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
        updatedAt: stat.mtime.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

backupsRouter.get("/backups/:name/download", async (req, res) => {
  try {
    const { filePath, safeName } = resolveBackupPath(req.params.name);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "backup not found" });
    }
    return res.download(filePath, safeName);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

backupsRouter.delete("/backups/:name", async (req, res) => {
  try {
    const { filePath, safeName } = resolveBackupPath(req.params.name);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "backup not found" });
    }
    await fs.unlink(filePath);
    return res.json({ deleted: true, name: safeName });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

backupsRouter.post("/backups/:name/restore", async (req, res) => {
  try {
    const { filePath, safeName } = resolveBackupPath(req.params.name);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "backup not found" });
    }
    const raw = await fs.readFile(filePath, "utf8");
    const payload = JSON.parse(raw);
    const replaceExisting = Boolean(req.body?.replaceExisting);
    const restoredCount = await restoreBackup(payload, safeName, replaceExisting);
    return res.json({
      restored: true,
      backup: safeName,
      restoredCount,
      replaceExisting
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

backupsRouter.get("/backups/:name", async (req, res) => {
  try {
    const { filePath, safeName } = resolveBackupPath(req.params.name);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "backup not found" });
    }
    const raw = await fs.readFile(filePath, "utf8");
    const payload = JSON.parse(raw);
    return res.json({
      name: safeName,
      createdAt: payload?.createdAt || null,
      schemaVersion: payload?.schemaVersion || null,
      recordingCount: Array.isArray(payload?.recordings) ? payload.recordings.length : 0
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
