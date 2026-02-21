import {
  claimNextQueuedJob,
  completeJob,
  failJob,
  getRecording,
  updateRecordingStatus
} from "./store/postgresStore.js";
import { initDb } from "./store/db.js";

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
  await initDb();
  console.log(`[worker] started (poll ${POLL_MS}ms)`);
  setInterval(poll, POLL_MS);
}

start().catch((error) => {
  console.error("[worker] failed to start", error);
  process.exit(1);
});
