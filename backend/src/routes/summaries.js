import { Router } from "express";
import { createSummary, getRecording, getSummary } from "../store/postgresStore.js";
import { enforceProviderPolicy } from "../policies/modelPolicy.js";
import { getProvider } from "../providers/providers.js";

export const summaryRouter = Router();

summaryRouter.post("/recordings/:id/summaries", async (req, res) => {
  try {
    const recordingId = req.params.id;
    const recording = await getRecording(recordingId);
    if (!recording) return res.status(404).json({ error: "recording not found" });

    const providerId = req.body?.provider || "ollama_local";
    const model = req.body?.model || process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";
    const template = req.body?.template || "default";

    enforceProviderPolicy(providerId);
    const provider = getProvider(providerId);

    const result = await provider.summarize(`Recording: ${recording.title}`, {
      model,
      template,
      temperature: req.body?.temperature,
      max_tokens: req.body?.max_tokens
    });

    const summary = await createSummary({
      recordingId,
      provider: providerId,
      model,
      template,
      markdown: result.markdown
    });

    res.status(201).json({ summary, usage: result.usage });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

summaryRouter.get("/summaries/:id", async (req, res) => {
  try {
    const summary = await getSummary(req.params.id);
    if (!summary) return res.status(404).json({ error: "summary not found" });
    return res.json(summary);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
