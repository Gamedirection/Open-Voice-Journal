import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import multer from "multer";
import {
  createRecording,
  createJob,
  getRecording,
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

recordingsRouter.get("/recordings", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 50);
    const recordings = await listRecordings(Number.isNaN(limit) ? 50 : limit);
    res.json(recordings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

recordingsRouter.post("/recordings", async (req, res) => {
  try {
    const recording = await createRecording(req.body || {});
    res.status(201).json(recording);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

recordingsRouter.get("/recordings/:id", async (req, res) => {
  try {
    const recording = await getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: "recording not found" });
    return res.json(recording);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

recordingsRouter.post("/recordings/:id/transcribe", async (req, res) => {
  try {
    const recording = await getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: "recording not found" });

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
    if (!req.file) return res.status(400).json({ error: "audio file is required" });

    const metadataPatch = {
      audio: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      }
    };

    const updated = await updateRecordingMetadata(recording.id, metadataPatch);
    return res.status(201).json({ recording: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

recordingsRouter.get("/recordings/:id/file", async (req, res) => {
  try {
    const recording = await getRecording(req.params.id);
    if (!recording) return res.status(404).json({ error: "recording not found" });

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
