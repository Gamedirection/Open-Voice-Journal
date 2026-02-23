import { randomUUID } from "node:crypto";

const state = {
  users: new Map(),
  sessions: new Map(),
  userSettings: new Map(),
  appSettings: new Map(),
  auditLogs: [],
  openApiKeys: new Map(),
  recordings: new Map(),
  summaries: new Map(),
  providerConfigs: new Map(),
  jobs: new Map()
};

export function createRecording(payload) {
  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    ownerUserId: payload.ownerUserId || null,
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

export function listRecordings(limitOrOptions = 50, maybeOffset = 0, maybeQuery = "") {
  let limit = 50;
  let offset = 0;
  let queryText = "";
  if (typeof limitOrOptions === "object" && limitOrOptions !== null) {
    limit = Number(limitOrOptions.limit ?? 50);
    offset = Number(limitOrOptions.offset ?? 0);
    queryText = String(limitOrOptions.query ?? "").trim().toLowerCase();
  } else {
    limit = Number(limitOrOptions ?? 50);
    offset = Number(maybeOffset ?? 0);
    queryText = String(maybeQuery ?? "").trim().toLowerCase();
  }

  const safeLimit = Math.max(1, limit || 50);
  const safeOffset = Math.max(0, offset || 0);
  const all = Array.from(state.recordings.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filtered = queryText
    ? all.filter((recording) => {
      const title = String(recording.title || "").toLowerCase();
      const transcript = String(recording.metadata?.transcript?.text || "").toLowerCase();
      const tags = Array.isArray(recording.metadata?.tags) ? recording.metadata.tags.join(" ").toLowerCase() : "";
      return title.includes(queryText) || transcript.includes(queryText) || tags.includes(queryText);
    })
    : all;

  return filtered.slice(safeOffset, safeOffset + safeLimit);
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

export function createUser(payload) {
  const now = new Date().toISOString();
  const user = {
    id: payload.id || randomUUID(),
    email: String(payload.email || "").toLowerCase(),
    displayName: payload.displayName || "",
    role: payload.role || "user",
    status: payload.status || "active",
    passwordHash: payload.passwordHash,
    avatarUrl: payload.avatarUrl || "",
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now
  };
  state.users.set(user.id, user);
  return { ...user };
}

export function getUserByEmail(email) {
  const needle = String(email || "").toLowerCase();
  return Array.from(state.users.values()).find((user) => user.email === needle) || null;
}

export function getUserById(id) {
  return state.users.get(id) || null;
}

export function touchUserLogin(id) {
  const user = state.users.get(id);
  if (!user) return;
  user.lastLoginAt = new Date().toISOString();
  user.updatedAt = user.lastLoginAt;
  state.users.set(id, user);
}

export function updateUserStatus(id, status) {
  const user = state.users.get(id);
  if (!user) return null;
  user.status = status;
  user.updatedAt = new Date().toISOString();
  state.users.set(id, user);
  return { ...user };
}

export function updateUserRole(id, role) {
  const user = state.users.get(id);
  if (!user) return null;
  user.role = role;
  user.updatedAt = new Date().toISOString();
  state.users.set(id, user);
  return { ...user };
}

export function updateUserPassword(id, passwordHash) {
  const user = state.users.get(id);
  if (!user) return;
  user.passwordHash = passwordHash;
  user.updatedAt = new Date().toISOString();
  state.users.set(id, user);
}

export function listUsers({ queryText = "", status = "", role = "", limit = 50, offset = 0 } = {}) {
  const q = String(queryText || "").trim().toLowerCase();
  const items = Array.from(state.users.values())
    .filter((user) => {
      if (status && user.status !== status) return false;
      if (role && user.role !== role) return false;
      if (!q) return true;
      return user.email.includes(q) || String(user.displayName || "").toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return items.slice(offset, offset + limit).map((entry) => ({ ...entry }));
}

export function createSession(userId, tokenHash, expiresAt) {
  const session = {
    id: randomUUID(),
    userId,
    tokenHash,
    expiresAt: new Date(expiresAt).toISOString(),
    createdAt: new Date().toISOString(),
    revokedAt: null
  };
  state.sessions.set(session.id, session);
  return { ...session };
}

export function getSessionByTokenHash(tokenHash) {
  const entry = Array.from(state.sessions.values()).find((session) => session.tokenHash === tokenHash);
  if (!entry) return null;
  const user = state.users.get(entry.userId) || null;
  return { ...entry, user: user ? { ...user } : null };
}

export function revokeSessionByTokenHash(tokenHash) {
  for (const [id, session] of state.sessions.entries()) {
    if (session.tokenHash !== tokenHash) continue;
    state.sessions.set(id, { ...session, revokedAt: new Date().toISOString() });
  }
}

export function revokeAllUserSessions(userId) {
  for (const [id, session] of state.sessions.entries()) {
    if (session.userId !== userId || session.revokedAt) continue;
    state.sessions.set(id, { ...session, revokedAt: new Date().toISOString() });
  }
}

export function countActiveAdmins() {
  return Array.from(state.users.values()).filter((user) => user.role === "admin" && user.status === "active").length;
}

export function countActiveAdminsExcludingUser(userId) {
  return Array.from(state.users.values()).filter((user) => user.id !== userId && user.role === "admin" && user.status === "active").length;
}

export function getUserUsage(userId) {
  const recordings = Array.from(state.recordings.values()).filter((entry) => entry.ownerUserId === userId);
  const recordingIds = new Set(recordings.map((entry) => entry.id));
  const summariesTotal = Array.from(state.summaries.values()).filter((entry) => recordingIds.has(entry.recordingId)).length;
  const audioBytesTotal = recordings.reduce((acc, entry) => acc + Number(entry.metadata?.audio?.size || 0), 0);
  const transcriptCharsTotal = recordings.reduce((acc, entry) => {
    return acc + String(entry.metadata?.transcript?.text || "").length;
  }, 0);
  const lastActivity = recordings
    .map((entry) => entry.createdAt)
    .sort()
    .pop() || null;
  return {
    audioBytesTotal,
    recordingsTotal: recordings.length,
    transcriptCharsTotal,
    summariesTotal,
    lastActivityAt: lastActivity
  };
}

export function upsertUserSetting(userId, key, value) {
  const current = state.userSettings.get(userId) || {};
  current[key] = value || {};
  state.userSettings.set(userId, current);
}

export function listUserSettings(userId) {
  return { ...(state.userSettings.get(userId) || {}) };
}

export function upsertAppSetting(key, value) {
  state.appSettings.set(String(key), value || {});
}

export function getAppSetting(key) {
  return state.appSettings.has(String(key)) ? (state.appSettings.get(String(key)) || {}) : null;
}

export function listAppSettings(prefix = "") {
  const out = {};
  const start = String(prefix || "");
  for (const [key, value] of state.appSettings.entries()) {
    if (start && !key.startsWith(start)) continue;
    out[key] = value || {};
  }
  return out;
}

export function insertAuditLog({ actorUserId = null, targetUserId = null, event, details = {} }) {
  state.auditLogs.push({
    id: randomUUID(),
    actorUserId,
    targetUserId,
    event,
    details,
    createdAt: new Date().toISOString()
  });
}

export function createOpenApiKey({ userId, name, keyHash, prefix }) {
  const key = {
    id: randomUUID(),
    userId,
    name,
    keyHash,
    prefix,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    revokedAt: null
  };
  state.openApiKeys.set(key.id, key);
  return {
    id: key.id,
    userId: key.userId,
    name: key.name,
    prefix: key.prefix,
    createdAt: key.createdAt,
    lastUsedAt: key.lastUsedAt,
    revokedAt: key.revokedAt
  };
}

export function listOpenApiKeysByUser(userId) {
  return Array.from(state.openApiKeys.values())
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      name: entry.name,
      prefix: entry.prefix,
      createdAt: entry.createdAt,
      lastUsedAt: entry.lastUsedAt,
      revokedAt: entry.revokedAt
    }));
}

export function getOpenApiKeyByHash(keyHash) {
  const key = Array.from(state.openApiKeys.values()).find((entry) => entry.keyHash === keyHash);
  if (!key) return null;
  const user = state.users.get(key.userId) || null;
  return {
    id: key.id,
    userId: key.userId,
    name: key.name,
    prefix: key.prefix,
    createdAt: key.createdAt,
    lastUsedAt: key.lastUsedAt,
    revokedAt: key.revokedAt,
    user: user ? { ...user } : null
  };
}

export function touchOpenApiKeyLastUsed(id) {
  const key = state.openApiKeys.get(id);
  if (!key) return;
  key.lastUsedAt = new Date().toISOString();
  state.openApiKeys.set(id, key);
}

export function revokeOpenApiKey(id, userId) {
  const key = state.openApiKeys.get(id);
  if (!key || key.userId !== userId || key.revokedAt) return null;
  key.revokedAt = new Date().toISOString();
  state.openApiKeys.set(id, key);
  return {
    id: key.id,
    userId: key.userId,
    name: key.name,
    prefix: key.prefix,
    createdAt: key.createdAt,
    lastUsedAt: key.lastUsedAt,
    revokedAt: key.revokedAt
  };
}

export function listUserOwnedRecordings(userId) {
  return Array.from(state.recordings.values())
    .filter((entry) => entry.ownerUserId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function hardDeleteUserAndData(userId) {
  const recordings = listUserOwnedRecordings(userId);
  recordings.forEach((recording) => {
    deleteRecording(recording.id);
  });
  state.userSettings.delete(userId);
  state.users.delete(userId);
  for (const [id, session] of state.sessions.entries()) {
    if (session.userId === userId) state.sessions.delete(id);
  }
  for (const [id, key] of state.openApiKeys.entries()) {
    if (key.userId === userId) state.openApiKeys.delete(id);
  }
  return { recordings, recordingIds: recordings.map((entry) => entry.id) };
}

export function assignUnownedRecordingsToUser(userId) {
  for (const [id, recording] of state.recordings.entries()) {
    if (recording.ownerUserId) continue;
    state.recordings.set(id, { ...recording, ownerUserId: userId });
  }
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
