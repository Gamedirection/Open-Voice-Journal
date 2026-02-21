import { randomUUID } from "node:crypto";

const state = {
  recordings: new Map(),
  summaries: new Map(),
  providerConfigs: new Map(),
  jobs: new Map()
};

export function createRecording(payload) {
  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    title: payload.title || "Untitled recording",
    status: "uploaded",
    createdAt: now,
    metadata: payload.metadata || {}
  };
  state.recordings.set(record.id, record);
  return record;
}

export function getRecording(id) {
  return state.recordings.get(id) || null;
}

export function updateRecordingStatus(id, status) {
  const existing = state.recordings.get(id);
  if (!existing) return null;
  const updated = { ...existing, status };
  state.recordings.set(id, updated);
  return updated;
}

export function updateRecordingMetadata(id, metadataPatch = {}) {
  const existing = state.recordings.get(id);
  if (!existing) return null;
  const updated = {
    ...existing,
    metadata: {
      ...(existing.metadata || {}),
      ...(metadataPatch || {})
    }
  };
  state.recordings.set(id, updated);
  return updated;
}

export function listRecordings(limit = 50) {
  return Array.from(state.recordings.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, Math.max(1, Number(limit) || 50));
}

export function deleteRecording(id) {
  const existing = state.recordings.get(id);
  if (!existing) return null;
  state.recordings.delete(id);

  for (const [summaryId, summary] of state.summaries.entries()) {
    if (summary.recordingId === id) {
      state.summaries.delete(summaryId);
    }
  }

  for (const [jobId, job] of state.jobs.entries()) {
    if (job.recordingId === id) {
      state.jobs.delete(jobId);
    }
  }

  return existing;
}

export function createSummary(payload) {
  const now = new Date().toISOString();
  const summary = {
    id: randomUUID(),
    recordingId: payload.recordingId,
    provider: payload.provider,
    model: payload.model,
    markdown: payload.markdown,
    template: payload.template || "default",
    createdAt: now
  };
  state.summaries.set(summary.id, summary);
  return summary;
}

export function getSummary(id) {
  return state.summaries.get(id) || null;
}

export function listSummariesByRecording(recordingId, limit = 5) {
  return Array.from(state.summaries.values())
    .filter((summary) => summary.recordingId === recordingId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, Math.max(1, Number(limit) || 5));
}

export function listProviderConfigs() {
  return Array.from(state.providerConfigs.values());
}

export function upsertProviderConfig(payload) {
  const id = payload.id || randomUUID();
  const now = new Date().toISOString();
  const item = {
    id,
    provider: payload.provider,
    endpoint: payload.endpoint || null,
    apiKeyRef: payload.apiKeyRef || null,
    enabled: payload.enabled ?? true,
    updatedAt: now
  };
  state.providerConfigs.set(id, item);
  return item;
}

export function patchProviderConfig(id, payload) {
  const current = state.providerConfigs.get(id);
  if (!current) return null;
  const updated = { ...current, ...payload, id, updatedAt: new Date().toISOString() };
  state.providerConfigs.set(id, updated);
  return updated;
}

export function createJob(payload) {
  const now = new Date().toISOString();
  const job = {
    id: randomUUID(),
    type: payload.type,
    recordingId: payload.recordingId || null,
    status: payload.status || "queued",
    payload: payload.payload || {},
    result: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null
  };
  state.jobs.set(job.id, job);
  return job;
}

export function getJob(id) {
  return state.jobs.get(id) || null;
}

export function listJobs(limit = 50) {
  return Array.from(state.jobs.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, Math.max(1, Number(limit) || 50));
}

export function claimNextQueuedJob(types = ["transcription"]) {
  const candidate = Array.from(state.jobs.values())
    .filter((job) => job.status === "queued" && types.includes(job.type))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

  if (!candidate) return null;

  const updated = {
    ...candidate,
    status: "running",
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  state.jobs.set(updated.id, updated);
  return updated;
}

export function completeJob(id, resultPayload = {}) {
  const existing = state.jobs.get(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const updated = {
    ...existing,
    status: "completed",
    result: resultPayload,
    error: null,
    completedAt: now,
    updatedAt: now
  };
  state.jobs.set(id, updated);
  return updated;
}

export function failJob(id, message) {
  const existing = state.jobs.get(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const updated = {
    ...existing,
    status: "failed",
    error: message,
    completedAt: now,
    updatedAt: now
  };
  state.jobs.set(id, updated);
  return updated;
}
