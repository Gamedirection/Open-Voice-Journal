import { Router } from "express";
import { createRecording, createJob, getRecording } from "../store/postgresStore.js";

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
