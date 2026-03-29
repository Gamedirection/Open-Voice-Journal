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

function normalizeTimedSegments(providerSegments = []) {
  return Array.isArray(providerSegments)
    ? providerSegments
      .map((segment) => ({
        text: String(segment?.text || "").trim(),
        start: Number(segment?.start),
        end: Number(segment?.end),
        speakerId: String(segment?.speakerId || "").trim() || null
      }))
      .filter(
        (segment) =>
          segment.text
          && Number.isFinite(segment.start)
          && Number.isFinite(segment.end)
          && segment.end > segment.start
      )
    : [];
}

function createLabelsForSpeakerIds(speakerIds = [], existingLabels = {}) {
  const labels = { ...existingLabels };
  speakerIds.forEach((speakerId, index) => {
    if (!labels[speakerId]) {
      labels[speakerId] = `Person ${index + 1}`;
    }
  });
  return labels;
}

function canonicalizeProviderSpeakerIds(segments = []) {
  const providerIds = Array.from(new Set(segments.map((segment) => segment.speakerId).filter(Boolean)));
  if (!providerIds.length) return null;
  const lookup = new Map(providerIds.map((speakerId, index) => [speakerId, `speaker_${index + 1}`]));
  return segments.map((segment) => ({
    ...segment,
    speakerId: lookup.get(segment.speakerId) || "speaker_1"
  }));
}

function countWords(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function endsWithTerminalPunctuation(text) {
  return /[.!?]["')\]]*$/.test(String(text || "").trim());
}

function isShortAcknowledgement(text) {
  return /^(yes|yeah|yep|no|nope|ok|okay|right|sure|thanks|thank you|hello|hi|bye)\b/i.test(String(text || "").trim());
}

function buildHeuristicTurns(segments = []) {
  if (!segments.length) return [];
  const turns = [];
  segments.forEach((segment) => {
    const previous = turns[turns.length - 1];
    if (!previous) {
      turns.push({ ...segment });
      return;
    }
    const gap = Number.isFinite(segment.start) && Number.isFinite(previous.end)
      ? segment.start - previous.end
      : Number.POSITIVE_INFINITY;
    const shouldMerge =
      gap <= 0.35
      || (gap <= 0.85 && !endsWithTerminalPunctuation(previous.text))
      || (gap <= 0.6 && countWords(segment.text) <= 4);
    if (shouldMerge) {
      previous.text = `${previous.text} ${segment.text}`.trim();
      previous.end = segment.end;
      return;
    }
    turns.push({ ...segment });
  });
  return turns;
}

function assignHeuristicSpeakers(turns = []) {
  if (!turns.length) return [];
  let lastSpeakerIndex = 0;
  return turns.map((turn, index) => {
    if (index === 0) {
      return { ...turn, speakerId: "speaker_1" };
    }
    const previous = turns[index - 1];
    const gap = Number.isFinite(turn.start) && Number.isFinite(previous.end)
      ? turn.start - previous.end
      : Number.POSITIVE_INFINITY;
    const shouldSwitch =
      gap >= 1.1
      || /\?\s*$/.test(previous.text)
      || (isShortAcknowledgement(turn.text) && gap >= 0.2)
      || (countWords(previous.text) <= 3 && countWords(turn.text) <= 6 && gap >= 0.25);
    if (shouldSwitch) {
      lastSpeakerIndex = lastSpeakerIndex === 0 ? 1 : 0;
    }
    return {
      ...turn,
      speakerId: `speaker_${lastSpeakerIndex + 1}`
    };
  });
}

function buildSpeakerMetadata(text, providerSegments = [], existingLabels = {}) {
  const timedSegments = normalizeTimedSegments(providerSegments);
  if (timedSegments.length) {
    const providerLabeledSegments = canonicalizeProviderSpeakerIds(timedSegments);
    const segments = providerLabeledSegments || assignHeuristicSpeakers(buildHeuristicTurns(timedSegments));
    const speakerIds = Array.from(new Set(segments.map((segment) => segment.speakerId).filter(Boolean)));
    return {
      labels: createLabelsForSpeakerIds(speakerIds, existingLabels),
      segments: segments.map((segment, index) => ({
        index,
        speakerId: segment.speakerId,
        text: segment.text,
        start: segment.start,
        end: segment.end
      }))
    };
  }

  const fallbackText = String(text || "").trim();
  if (!fallbackText) return null;
  return {
    labels: createLabelsForSpeakerIds(["speaker_1"], existingLabels),
    segments: [
      {
        index: 0,
        speakerId: "speaker_1",
        text: fallbackText
      }
    ]
  };
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
