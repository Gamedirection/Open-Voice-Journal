import { Router } from "express";
import { createRecording, getRecording } from "../store/postgresStore.js";

export const recordingsRouter = Router();

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

    return res.json({
      recordingId: recording.id,
      status: "queued",
      message: "Transcription job accepted"
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
