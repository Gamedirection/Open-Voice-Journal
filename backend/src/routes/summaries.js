import { Router } from "express";
import { createSummary, getRecording, getSummary, listSummariesByRecording, updateRecordingMetadata } from "../store/store.js";
import { enforceProviderPolicy } from "../policies/modelPolicy.js";
import { getProvider } from "../providers/providers.js";

export const summaryRouter = Router();

const DEFAULT_SUMMARY_TEMPLATE = [
  "Provide a general description of the conversation.",
  "Then highlight key topics discussed.",
  "Then list action items and follow-up items.",
  "Return clean Markdown with sections and concise bullets."
].join(" ");

const TAG_TEMPLATE = [
  "Return 1 to 5 topic tags for this transcript.",
  "Each tag must be one or two words only.",
  "No numbering, no markdown, no explanation.",
  "Return comma-separated tags only."
].join(" ");

function extractTags(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim().replace(/^[-*#\d.\s]+/, ""))
    .map((item) => item.replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim())
    .filter((item) => item.split(" ").filter(Boolean).length <= 2)
    .filter(Boolean)
    .slice(0, 5);
}

function canAccessRecording(user, recording) {
  if (!user || !recording) return false;
  if (user.role === "admin") return true;
  return Boolean(recording.ownerUserId && recording.ownerUserId === user.id);
}

summaryRouter.post("/recordings/:id/summaries", async (req, res) => {
  try {
    const recordingId = req.params.id;
    const recording = await getRecording(recordingId);
    if (!recording) return res.status(404).json({ error: "recording not found" });
    if (!canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });

    const providerId = req.body?.provider || "ollama_local";
    const model = req.body?.model || process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";
    const template = req.body?.template || DEFAULT_SUMMARY_TEMPLATE;
    const transcript = recording.metadata?.transcript?.text?.trim() || `Recording title: ${recording.title}`;
    const tagTranscript = recording.metadata?.transcript?.text?.trim() || "";

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

    let tags = [];
    try {
      if (tagTranscript) {
        const tagResult = await provider.summarize(tagTranscript, {
          model,
          template: TAG_TEMPLATE,
          apiKey: req.body?.apiKey || null,
          temperature: 0.2,
          max_tokens: 120
        });
        tags = extractTags(tagResult?.markdown || "");
        if (tags.length) {
          const existing = Array.isArray(recording.metadata?.tags) ? recording.metadata.tags : [];
          const mergedTags = Array.from(new Set([...existing, ...tags])).slice(0, 20);
          await updateRecordingMetadata(recordingId, { tags: mergedTags });
        }
      }
    } catch (_error) {
      tags = [];
    }

    res.status(201).json({ summary, usage: result.usage, tags });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

summaryRouter.get("/summaries/:id", async (req, res) => {
  try {
    const summary = await getSummary(req.params.id);
    if (!summary) return res.status(404).json({ error: "summary not found" });
    const recording = await getRecording(summary.recordingId);
    if (!recording || !canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });
    return res.json(summary);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

summaryRouter.get("/recordings/:id/summaries", async (req, res) => {
  try {
    const recordingId = req.params.id;
    const recording = await getRecording(recordingId);
    if (!recording) return res.status(404).json({ error: "recording not found" });
    if (!canAccessRecording(req.user, recording)) return res.status(403).json({ error: "forbidden" });
    const parsed = Number(req.query.limit || 5);
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 20) : 5;
    const summaries = await listSummariesByRecording(recordingId, limit);
    res.json({ summaries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
