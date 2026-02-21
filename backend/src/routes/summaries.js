import { Router } from "express";
import { createSummary, getRecording, getSummary, listSummariesByRecording } from "../store/store.js";
import { enforceProviderPolicy } from "../policies/modelPolicy.js";
import { getProvider } from "../providers/providers.js";

export const summaryRouter = Router();

const DEFAULT_SUMMARY_TEMPLATE = [
  "Provide a general description of the conversation.",
  "Then highlight key topics discussed.",
  "Then list action items and follow-up items.",
  "Return clean Markdown with sections and concise bullets."
].join(" ");

summaryRouter.post("/recordings/:id/summaries", async (req, res) => {
  try {
    const recordingId = req.params.id;
    const recording = await getRecording(recordingId);
    if (!recording) return res.status(404).json({ error: "recording not found" });

    const providerId = req.body?.provider || "ollama_local";
    const model = req.body?.model || process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";
    const template = req.body?.template || DEFAULT_SUMMARY_TEMPLATE;
    const transcript = recording.metadata?.transcript?.text?.trim() || `Recording title: ${recording.title}`;

    enforceProviderPolicy(providerId);
    const provider = getProvider(providerId);

    const result = await provider.summarize(transcript, {
      model,
      template,
      apiKey: req.body?.apiKey || null,
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

summaryRouter.get("/recordings/:id/summaries", async (req, res) => {
  try {
    const recordingId = req.params.id;
    const parsed = Number(req.query.limit || 5);
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 20) : 5;
    const summaries = await listSummariesByRecording(recordingId, limit);
    res.json({ summaries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
