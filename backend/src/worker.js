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
    await updateRecordingStatus(recording.id, "transcribed");
    await updateRecordingMetadata(recording.id, {
      transcript: {
        text: transcript.text,
        model: transcript.model,
        endpoint: transcript.endpoint,
        updatedAt: new Date().toISOString()
      },
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

