import {
  claimNextQueuedJob,
  completeJob,
  failJob,
  getRecording,
  getJob,
  listUsers,
  updateRecordingMetadata,
  updateRecordingStatus
} from "./store/store.js";
import { initStore } from "./store/store.js";
import { isEmailConfigured, sendEmail } from "./services/email.js";
import { transcribeRecording } from "./services/transcription.js";

const POLL_MS = Number(process.env.WORKER_POLL_MS || 3000);
const LONG_RUNNING_ALERT_MS = 1000 * 60 * 60;

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

  const longRunningTimer = setTimeout(async () => {
    try {
      const current = await getJob(job.id);
      if (!current || current.status !== "running") return;
      if (!isEmailConfigured()) {
        console.warn(`[worker] long-running job ${job.id} (email not configured)`);
        return;
      }
      const admins = await listUsers({ role: "admin", status: "active", limit: 50, offset: 0 });
      const fallbackEmail = String(process.env.APP_DEFAULT_ADMIN_EMAIL || "").trim().toLowerCase();
      const recipients = admins.map((admin) => admin.email).filter(Boolean);
      if (!recipients.length && fallbackEmail) {
        recipients.push(fallbackEmail);
      }
      if (!recipients.length) {
        console.warn(`[worker] long-running job ${job.id} (no admin recipients)`);
        return;
      }
      const subject = "Open-Voice-Journal long-running job alert";
      const startedAt = current.startedAt || job.startedAt || now;
      const text = [
        "A background job has been running for longer than one hour.",
        "",
        `Job ID: ${job.id}`,
        `Job Type: ${job.type}`,
        `Recording ID: ${recording.id}`,
        `Recording Title: ${recording.title || "Untitled recording"}`,
        `Started At: ${startedAt}`,
        `Status: ${current.status}`
      ].join("\n");
      await sendEmail({
        to: recipients,
        subject,
        text
      });
    } catch (error) {
      console.warn("[worker] long-running job alert failed", error);
    }
  }, LONG_RUNNING_ALERT_MS);

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
  } finally {
    clearTimeout(longRunningTimer);
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

