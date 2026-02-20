import { Router } from "express";
import { createRecording, getRecording } from "../store/inMemoryStore.js";

export const recordingsRouter = Router();

recordingsRouter.post("/recordings", (req, res) => {
  const recording = createRecording(req.body || {});
  res.status(201).json(recording);
});

recordingsRouter.get("/recordings/:id", (req, res) => {
  const recording = getRecording(req.params.id);
  if (!recording) return res.status(404).json({ error: "recording not found" });
  return res.json(recording);
});

recordingsRouter.post("/recordings/:id/transcribe", (req, res) => {
  const recording = getRecording(req.params.id);
  if (!recording) return res.status(404).json({ error: "recording not found" });
  return res.json({ recordingId: recording.id, status: "queued", message: "Transcription job accepted" });
});
