import {
  claimNextQueuedJob,
  completeJob,
  failJob,
  getRecording,
  updateRecordingMetadata,
  updateRecordingStatus
} from "./store/store.js";
import { initStore } from "./store/store.js";

const POLL_MS = Number(process.env.WORKER_POLL_MS || 3000);

async function processJob(job) {
  if (job.type !== "transcription") {
    await completeJob(job.id, { skipped: true, reason: `unsupported job type '${job.type}'` });
    return;
  }

  const recording = await getRecording(job.recordingId);
  if (!recording) {
    await failJob(job.id, `recording '${job.recordingId}' not found`);
    return;
  }

  await updateRecordingStatus(recording.id, "processing");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await updateRecordingStatus(recording.id, "transcribed");

  await updateRecordingMetadata(recording.id, {
    transcript: {
      text: `Transcript preview for "${recording.title}".\n\nThis is a simulated transcript generated at ${new Date().toISOString()}.`,
      updatedAt: new Date().toISOString()
    }
  });

  await completeJob(job.id, {
    simulated: true,
    transcriptionStatus: "transcribed",
    completedAt: new Date().toISOString()
  });
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

