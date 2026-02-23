import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import multer from "multer";
import {
  createRecording,
  createJob,
  deleteRecording,
  getRecording,
  listJobs,
  listRecordings,
  updateRecordingMetadata
} from "../store/store.js";

export const recordingsRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

function sanitizeFilename(value) {
  return value.replace(/[^\w.\-]+/g, "_").slice(0, 80);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webm";
    const safeName = sanitizeFilename(path.basename(file.originalname, ext)) || "recording";
    const fileName = `${req.params.id}-${Date.now()}-${safeName}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

function canAccessRecording(user, recording) {
  if (!user || !recording) return false;
  if (user.role === "admin") return true;
  return Boolean(recording.ownerUserId && recording.ownerUserId === user.id);
}

recordingsRouter.get("/recordings", async (req, res) => {
  try {
    const parsedLimit = Number(req.query.limit || 50);
    const parsedOffset = Number(req.query.offset || 0);
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;
    const offset = Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0;
    const queryText = String(req.query.q || "").trim();
    const rows = await listRecordings(limit + 1, offset, queryText);
    const visible = req.user?.role === "admin"
      ? rows
      : rows.filter((entry) => entry.ownerUserId === req.user?.id);
    const hasMore = visible.length > limit;
    res.json({
      recordings: hasMore ? visible.slice(0, limit) : visible,
      pagination: {
        limit,
        offset,
        hasMore
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

recordingsRouter.post("/recordings", async (req, res) => {
  try {
    const body = req.body || {};
    const recording = await createRecording({
      ...body,
      ownerUserId: req.user?.id || body.ownerUserId || null
    });
    res.status(201).json(recording);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

recordingsRouter.get("/recordings/:id", async (req, res) => {
  try {
    const recording = await getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: "recording not found" });
    if (!canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });
    return res.json(recording);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

recordingsRouter.delete("/recordings/:id", async (req, res) => {
  try {
    const recording = await getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: "recording not found" });
    if (!canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });

    const fileName = recording.metadata?.audio?.fileName;
    if (fileName) {
      const filePath = path.resolve(uploadsDir, fileName);
      if (filePath.startsWith(uploadsDir) && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await deleteRecording(recording.id);
    return res.json({ deleted: true, recordingId: recording.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

recordingsRouter.post("/recordings/:id/transcribe", async (req, res) => {
  try {
    const recording = await getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: "recording not found" });
    if (!canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });

    const recentJobs = await listJobs(500);
    const existing = recentJobs.find((job) =>
      job?.type === "transcription"
      && job?.recordingId === recording.id
      && (job?.status === "queued" || job?.status === "running")
    );
    if (existing) {
      return res.status(202).json({
        recordingId: recording.id,
        status: existing.status,
        message: "Transcription already queued or running for this recording.",
        deduped: true,
        job: existing
      });
    }

    const job = await createJob({
      type: "transcription",
      recordingId: recording.id,
      status: "queued",
      payload: {
        requestedAt: new Date().toISOString(),
        options: req.body || {}
      }
    });

    return res.status(202).json({
      recordingId: recording.id,
      status: "queued",
      message: "Transcription job accepted",
      deduped: false,
      job
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

recordingsRouter.post("/recordings/:id/upload", upload.single("audio"), async (req, res) => {
  try {
    const recording = await getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: "recording not found" });
    if (!canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });
    if (!req.file) return res.status(400).json({ error: "audio file is required" });

    const durationSeconds = Number(req.body?.durationSeconds);
    let waveformPeaks = [];
    let captionAnchors = [];
    if (req.body?.waveformPeaks) {
      try {
        const parsed = JSON.parse(req.body.waveformPeaks);
        if (Array.isArray(parsed)) {
          waveformPeaks = parsed
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value >= 0)
            .slice(0, 400);
        }
      } catch (_error) {
        waveformPeaks = [];
      }
    }
    if (req.body?.captionAnchors) {
      try {
        const parsed = JSON.parse(req.body.captionAnchors);
        if (Array.isArray(parsed)) {
          captionAnchors = parsed
            .map((entry) => ({
              text: String(entry?.text || "").trim(),
              at: Number(entry?.at)
            }))
            .filter((entry) => entry.text && Number.isFinite(entry.at) && entry.at >= 0)
            .slice(0, 500);
        }
      } catch (_error) {
        captionAnchors = [];
      }
    }
    const metadataPatch = {
      audio: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date().toISOString(),
        ...(Number.isFinite(durationSeconds) && durationSeconds > 0
          ? {
            durationSeconds,
            durationMs: Math.round(durationSeconds * 1000)
          }
          : {}),
        ...(waveformPeaks.length
          ? {
            waveformPeaks,
            waveformBuckets: waveformPeaks.length
          }
          : {}),
        ...(captionAnchors.length
          ? {
            captionAnchors
          }
          : {})
      }
    };

    const updated = await updateRecordingMetadata(recording.id, metadataPatch);
    return res.status(201).json({ recording: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

recordingsRouter.put("/recordings/:id/speakers", async (req, res) => {
  try {
    const recording = await getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: "recording not found" });
    if (!canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });
    const labels = req.body?.labels;
    if (!labels || typeof labels !== "object") {
      return res.status(400).json({ error: "labels object is required" });
    }

    const existing = recording.metadata?.speakers || {};
    const merged = {
      ...existing,
      labels: {
        ...(existing.labels || {}),
        ...labels
      },
      updatedAt: new Date().toISOString()
    };

    const updated = await updateRecordingMetadata(recording.id, { speakers: merged });
    return res.json({ recording: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

recordingsRouter.put("/recordings/:id/tags", async (req, res) => {
  try {
    const recording = await getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: "recording not found" });
    if (!canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });
    const rawTags = req.body?.tags;
    if (!Array.isArray(rawTags)) {
      return res.status(400).json({ error: "tags array is required" });
    }
    const tags = rawTags
      .map((tag) => String(tag || "").trim())
      .filter(Boolean)
      .slice(0, 20);
    const unique = Array.from(new Set(tags));
    const updated = await updateRecordingMetadata(recording.id, { tags: unique });
    return res.json({ recording: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

recordingsRouter.put("/recordings/:id/captions", async (req, res) => {
  try {
    const recording = await getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: "recording not found" });
    if (!canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });
    const rawAnchors = req.body?.anchors;
    if (!Array.isArray(rawAnchors)) {
      return res.status(400).json({ error: "anchors array is required" });
    }
    const anchors = rawAnchors
      .map((entry) => ({
        text: String(entry?.text || "").trim(),
        at: Number(entry?.at)
      }))
      .filter((entry) => entry.text && Number.isFinite(entry.at) && entry.at >= 0)
      .slice(0, 500);
    if (!anchors.length) {
      return res.status(400).json({ error: "anchors array had no valid entries" });
    }
    const existingAudio = recording.metadata?.audio || {};
    const updated = await updateRecordingMetadata(recording.id, {
      audio: {
        ...existingAudio,
        captionAnchors: anchors
      }
    });
    return res.json({ recording: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

recordingsRouter.get("/recordings/:id/file", async (req, res) => {
  try {
    const recording = await getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: "recording not found" });
    if (!canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });

    const fileName = recording.metadata?.audio?.fileName;
    if (!fileName) return res.status(404).json({ error: "audio file not found" });

    const filePath = path.resolve(uploadsDir, fileName);
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(400).json({ error: "invalid file path" });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "audio file missing on server" });
    }

    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
