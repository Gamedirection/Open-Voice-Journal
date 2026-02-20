import { randomUUID } from "node:crypto";

const state = { recordings: new Map(), summaries: new Map(), providerConfigs: new Map() };

export function createRecording(payload) {
  const now = new Date().toISOString();
  const record = { id: randomUUID(), title: payload.title || "Untitled recording", status: "uploaded", createdAt: now, metadata: payload.metadata || {} };
  state.recordings.set(record.id, record);
  return record;
}

export function getRecording(id) {
  return state.recordings.get(id) || null;
}

export function createSummary(payload) {
  const now = new Date().toISOString();
  const summary = { id: randomUUID(), recordingId: payload.recordingId, provider: payload.provider, model: payload.model, markdown: payload.markdown, template: payload.template || "default", createdAt: now };
  state.summaries.set(summary.id, summary);
  return summary;
}

export function getSummary(id) {
  return state.summaries.get(id) || null;
}

export function listProviderConfigs() {
  return Array.from(state.providerConfigs.values());
}

export function upsertProviderConfig(payload) {
  const id = payload.id || randomUUID();
  const now = new Date().toISOString();
  const item = { id, provider: payload.provider, endpoint: payload.endpoint || null, apiKeyRef: payload.apiKeyRef || null, enabled: payload.enabled ?? true, updatedAt: now };
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

