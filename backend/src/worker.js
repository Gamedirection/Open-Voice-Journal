import {
  claimNextQueuedJob,
  completeJob,
  failJob,
  getRecording,
  updateRecordingMetadata,
  updateRecordingStatus
} from "./store/store.js";
import { initStore } from "./store/store.js";
import { transcribeRecording } from "./services/transcription.js";

const POLL_MS = Number(process.env.WORKER_POLL_MS || 3000);

function buildSpeakerMetadata(text, providerSegments = [], existingLabels = {}) {
  const timedSentences = Array.isArray(providerSegments)
    ? providerSegments
      .map((segment) => ({
        text: String(segment?.text || "").trim(),
        start: Number(segment?.start),
        end: Number(segment?.end)
      }))
      .filter(
        (segment) =>
          segment.text &&
          Number.isFinite(segment.start) &&
          Number.isFinite(segment.end) &&
          segment.end > segment.start
      )
    : [];
  const sentences = timedSentences.length
    ? timedSentences
    : String(text || "")
      .split(/(?<=[.!?])\s+/)
      .map((line) => ({ text: line.trim(), start: null, end: null }))
      .filter((line) => line.text);
  if (!sentences.length) return null;

  const labels = { ...existingLabels };
  const segments = sentences.map((sentence, index) => {
    const speakerId = `speaker_${(index % 2) + 1}`;
    if (!labels[speakerId]) {
      labels[speakerId] = `Person ${(index % 2) + 1}`;
    }
    return {
      index,
      speakerId,
      text: sentence.text,
      ...(Number.isFinite(sentence.start) ? { start: sentence.start } : {}),
      ...(Number.isFinite(sentence.end) ? { end: sentence.end } : {})
    };
  });
  return { labels, segments };
}

async function processJob(job) {
  if (job.type !== "transcription") {
    await completeJob(job.id, { skipped: true, reason: `unsupported job type '${job.type}'` });
    return;
  }

  const now = new Date().toISOString();
  const recording = await getRecording(job.recordingId);
  if (!recording) {
    await failJob(job.id, `recording '${job.recordingId}' not found`);
    return;
  }

  await updateRecordingStatus(recording.id, "processing");
  await updateRecordingMetadata(recording.id, {
    transcript: null,
    transcriptionError: null
  });

  try {
    const transcript = await transcribeRecording(recording);
    const identifySpeakers = Boolean(job.payload?.options?.identifySpeakers);
    const speakerMeta = identifySpeakers
      ? buildSpeakerMetadata(
          transcript.text,
          transcript.segments || [],
          recording.metadata?.speakers?.labels || {}
        )
      : null;
    await updateRecordingStatus(recording.id, "transcribed");
    await updateRecordingMetadata(recording.id, {
      transcript: {
        text: transcript.text,
        model: transcript.model,
        endpoint: transcript.endpoint,
        segments: speakerMeta?.segments || null,
        providerSegments: transcript.segments || null,
        wordTimings: transcript.wordTimings || null,
        updatedAt: new Date().toISOString()
      },
      speakers: speakerMeta
        ? {
            labels: speakerMeta.labels,
            updatedAt: new Date().toISOString()
          }
        : (recording.metadata?.speakers || null),
      transcriptionError: null
    });

    await completeJob(job.id, {
      simulated: false,
      transcriptionStatus: "transcribed",
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    const message = error?.message || String(error);
    await updateRecordingStatus(recording.id, "failed");
    await updateRecordingMetadata(recording.id, {
      transcriptionError: {
        message,
        failedAt: now
      }
    });
    await failJob(job.id, message);
  }
}

async function poll() {
  try {
    const job = await claimNextQueuedJob(["transcription"]);
    if (!job) {
      return;
    }

    await processJob(job);
  } catch (error) {
    console.error("[worker] processing error", error);
  }
}

async function start() {
  await initStore();
  console.log(`[worker] started (poll ${POLL_MS}ms)`);
  setInterval(poll, POLL_MS);
}

start().catch((error) => {
  console.error("[worker] failed to start", error);
  process.exit(1);
});

