import { randomUUID } from "node:crypto";
import { query } from "./db.js";

function mapRecording(row) {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id || null,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    metadata: row.metadata || {}
  };
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name || "",
    role: row.role,
    status: row.status,
    avatarUrl: row.avatar_url || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at || null
  };
}

function mapSummary(row) {
  return {
    id: row.id,
    recordingId: row.recording_id,
    provider: row.provider,
    model: row.model,
    template: row.template,
    markdown: row.markdown,
    createdAt: row.created_at
  };
}

function mapProviderConfig(row) {
  return {
    id: row.id,
    provider: row.provider,
    endpoint: row.endpoint,
    apiKeyRef: row.api_key_ref,
    enabled: row.enabled,
    updatedAt: row.updated_at
  };
}

function mapJob(row) {
  return {
    id: row.id,
    type: row.type,
    recordingId: row.recording_id,
    status: row.status,
    payload: row.payload || {},
    result: row.result || null,
    error: row.error || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    completedAt: row.completed_at
  };
}

function mapOpenApiKey(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    prefix: row.prefix,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at || null,
    revokedAt: row.revoked_at || null
  };
}

export async function createRecording(payload) {
  const id = randomUUID();
  const title = payload.title || "Untitled recording";
  const status = "uploaded";
  const metadata = payload.metadata || {};
  const ownerUserId = payload.ownerUserId || null;

  const result = await query(
    `
      INSERT INTO recordings (id, owner_user_id, title, status, metadata)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING id, owner_user_id, title, status, metadata, created_at
    `,
    [id, ownerUserId, title, status, JSON.stringify(metadata)]
  );

  return mapRecording(result.rows[0]);
}

export async function getRecording(id) {
  const result = await query(
    `
      SELECT id, owner_user_id, title, status, metadata, created_at
      FROM recordings
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] ? mapRecording(result.rows[0]) : null;
}

export async function updateRecordingStatus(id, status) {
  const result = await query(
    `
      UPDATE recordings
      SET status = $2
      WHERE id = $1
      RETURNING id, owner_user_id, title, status, metadata, created_at
    `,
    [id, status]
  );

  return result.rows[0] ? mapRecording(result.rows[0]) : null;
}

export async function updateRecordingMetadata(id, metadataPatch = {}) {
  const result = await query(
    `
      UPDATE recordings
      SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
      WHERE id = $1
      RETURNING id, owner_user_id, title, status, metadata, created_at
    `,
    [id, JSON.stringify(metadataPatch)]
  );

  return result.rows[0] ? mapRecording(result.rows[0]) : null;
}

export async function listRecordings(limitOrOptions = 50, maybeOffset = 0, maybeQuery = "") {
  let limit = 50;
  let offset = 0;
  let queryText = "";
  if (typeof limitOrOptions === "object" && limitOrOptions !== null) {
    limit = Number(limitOrOptions.limit ?? 50);
    offset = Number(limitOrOptions.offset ?? 0);
    queryText = String(limitOrOptions.query ?? "").trim();
  } else {
    limit = Number(limitOrOptions ?? 50);
    offset = Number(maybeOffset ?? 0);
    queryText = String(maybeQuery ?? "").trim();
  }
  const safeLimit = Math.max(1, limit || 50);
  const safeOffset = Math.max(0, offset || 0);

  const result = await query(
    `
      SELECT id, owner_user_id, title, status, metadata, created_at
      FROM recordings
      WHERE (
        $3 = ''
        OR title ILIKE ('%' || $3 || '%')
        OR COALESCE(metadata->'transcript'->>'text', '') ILIKE ('%' || $3 || '%')
        OR COALESCE((metadata->'tags')::text, '') ILIKE ('%' || $3 || '%')
      )
      ORDER BY created_at DESC
      OFFSET $2
      LIMIT $1
    `,
    [safeLimit, safeOffset, queryText]
  );

  return result.rows.map(mapRecording);
}

export async function deleteRecording(id) {
  const result = await query(
    `
      DELETE FROM recordings
      WHERE id = $1
      RETURNING id, owner_user_id, title, status, metadata, created_at
    `,
    [id]
  );

  return result.rows[0] ? mapRecording(result.rows[0]) : null;
}

export async function createSummary(payload) {
  const id = randomUUID();

  const result = await query(
    `
      INSERT INTO summaries (id, recording_id, provider, model, template, markdown)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, recording_id, provider, model, template, markdown, created_at
    `,
    [id, payload.recordingId, payload.provider, payload.model, payload.template || "default", payload.markdown]
  );

  return mapSummary(result.rows[0]);
}

export async function getSummary(id) {
  const result = await query(
    `
      SELECT id, recording_id, provider, model, template, markdown, created_at
      FROM summaries
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] ? mapSummary(result.rows[0]) : null;
}

export async function listSummariesByRecording(recordingId, limit = 5) {
  const result = await query(
    `
      SELECT id, recording_id, provider, model, template, markdown, created_at
      FROM summaries
      WHERE recording_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [recordingId, limit]
  );

  return result.rows.map(mapSummary);
}

export async function listProviderConfigs() {
  const result = await query(
    `
      SELECT id, provider, endpoint, api_key_ref, enabled, updated_at
      FROM ai_provider_configs
      ORDER BY updated_at DESC
    `
  );

  return result.rows.map(mapProviderConfig);
}

export async function upsertProviderConfig(payload) {
  const id = payload.id || randomUUID();

  const result = await query(
    `
      INSERT INTO ai_provider_configs (id, provider, endpoint, api_key_ref, enabled, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (id)
      DO UPDATE SET
        provider = EXCLUDED.provider,
        endpoint = EXCLUDED.endpoint,
        api_key_ref = EXCLUDED.api_key_ref,
        enabled = EXCLUDED.enabled,
        updated_at = NOW()
      RETURNING id, provider, endpoint, api_key_ref, enabled, updated_at
    `,
    [id, payload.provider, payload.endpoint || null, payload.apiKeyRef || null, payload.enabled ?? true]
  );

  return mapProviderConfig(result.rows[0]);
}

export async function patchProviderConfig(id, payload) {
  const existing = await query(
    `
      SELECT id, provider, endpoint, api_key_ref, enabled
      FROM ai_provider_configs
      WHERE id = $1
    `,
    [id]
  );

  if (!existing.rows[0]) {
    return null;
  }

  const current = existing.rows[0];
  const provider = payload.provider ?? current.provider;
  const endpoint = payload.endpoint ?? current.endpoint;
  const apiKeyRef = payload.apiKeyRef ?? current.api_key_ref;
  const enabled = payload.enabled ?? current.enabled;

  const result = await query(
    `
      UPDATE ai_provider_configs
      SET provider = $2,
          endpoint = $3,
          api_key_ref = $4,
          enabled = $5,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, provider, endpoint, api_key_ref, enabled, updated_at
    `,
    [id, provider, endpoint, apiKeyRef, enabled]
  );

  return mapProviderConfig(result.rows[0]);
}

export async function createJob(payload) {
  const id = randomUUID();

  const result = await query(
    `
      INSERT INTO jobs (id, type, recording_id, status, payload, result, error)
      VALUES ($1, $2, $3, $4, $5::jsonb, NULL, NULL)
      RETURNING id, type, recording_id, status, payload, result, error, created_at, updated_at, started_at, completed_at
    `,
    [id, payload.type, payload.recordingId || null, payload.status || "queued", JSON.stringify(payload.payload || {})]
  );

  return mapJob(result.rows[0]);
}

export async function getJob(id) {
  const result = await query(
    `
      SELECT id, type, recording_id, status, payload, result, error, created_at, updated_at, started_at, completed_at
      FROM jobs
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] ? mapJob(result.rows[0]) : null;
}

export async function listJobs(limit = 50) {
  const result = await query(
    `
      SELECT id, type, recording_id, status, payload, result, error, created_at, updated_at, started_at, completed_at
      FROM jobs
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows.map(mapJob);
}

export async function claimNextQueuedJob(types = ["transcription"]) {
  const result = await query(
    `
      WITH candidate AS (
        SELECT id
        FROM jobs
        WHERE status = 'queued'
          AND type = ANY($1::text[])
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE jobs j
      SET status = 'running',
          started_at = NOW(),
          updated_at = NOW()
      FROM candidate
      WHERE j.id = candidate.id
      RETURNING j.id, j.type, j.recording_id, j.status, j.payload, j.result, j.error, j.created_at, j.updated_at, j.started_at, j.completed_at
    `,
    [types]
  );

  return result.rows[0] ? mapJob(result.rows[0]) : null;
}

export async function completeJob(id, resultPayload = {}) {
  const result = await query(
    `
      UPDATE jobs
      SET status = 'completed',
          result = $2::jsonb,
          error = NULL,
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, type, recording_id, status, payload, result, error, created_at, updated_at, started_at, completed_at
    `,
    [id, JSON.stringify(resultPayload)]
  );

  return result.rows[0] ? mapJob(result.rows[0]) : null;
}

export async function failJob(id, message) {
  const result = await query(
    `
      UPDATE jobs
      SET status = 'failed',
          error = $2,
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, type, recording_id, status, payload, result, error, created_at, updated_at, started_at, completed_at
    `,
    [id, message]
  );

  return result.rows[0] ? mapJob(result.rows[0]) : null;
}

export async function createUser(payload) {
  const id = payload.id || randomUUID();
  const result = await query(
    `
      INSERT INTO users (id, email, display_name, role, status, password_hash, avatar_url)
      VALUES ($1, LOWER($2), $3, $4, $5, $6, $7)
      RETURNING id, email, display_name, role, status, avatar_url, last_login_at, created_at, updated_at
    `,
    [
      id,
      payload.email,
      payload.displayName || "",
      payload.role || "user",
      payload.status || "active",
      payload.passwordHash,
      payload.avatarUrl || null
    ]
  );
  return mapUser(result.rows[0]);
}

export async function getUserByEmail(email) {
  const result = await query(
    `
      SELECT id, email, display_name, role, status, avatar_url, password_hash, last_login_at, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );
  if (!result.rows[0]) return null;
  return { ...mapUser(result.rows[0]), passwordHash: result.rows[0].password_hash };
}

export async function getUserById(id) {
  const result = await query(
    `
      SELECT id, email, display_name, role, status, avatar_url, password_hash, last_login_at, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
  if (!result.rows[0]) return null;
  return { ...mapUser(result.rows[0]), passwordHash: result.rows[0].password_hash };
}

export async function touchUserLogin(id) {
  await query(
    `
      UPDATE users
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `,
    [id]
  );
}

export async function updateUserStatus(id, status) {
  const result = await query(
    `
      UPDATE users
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, display_name, role, status, avatar_url, last_login_at, created_at, updated_at
    `,
    [id, status]
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function updateUserRole(id, role) {
  const result = await query(
    `
      UPDATE users
      SET role = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, display_name, role, status, avatar_url, last_login_at, created_at, updated_at
    `,
    [id, role]
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function updateUserPassword(id, passwordHash) {
  await query(
    `
      UPDATE users
      SET password_hash = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [id, passwordHash]
  );
}

export async function listUsers({ queryText = "", status = "", role = "", limit = 50, offset = 0 } = {}) {
  const result = await query(
    `
      SELECT id, email, display_name, role, status, avatar_url, last_login_at, created_at, updated_at
      FROM users
      WHERE (
        $1 = ''
        OR email ILIKE ('%' || $1 || '%')
        OR COALESCE(display_name, '') ILIKE ('%' || $1 || '%')
      )
      AND ($2 = '' OR status = $2)
      AND ($3 = '' OR role = $3)
      ORDER BY created_at DESC
      OFFSET $5
      LIMIT $4
    `,
    [String(queryText || "").trim(), status || "", role || "", limit, offset]
  );
  return result.rows.map(mapUser);
}

export async function createSession(userId, tokenHash, expiresAt) {
  const id = randomUUID();
  const result = await query(
    `
      INSERT INTO user_sessions (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, token_hash, expires_at, created_at, revoked_at
    `,
    [id, userId, tokenHash, expiresAt]
  );
  return result.rows[0] || null;
}

export async function getSessionByTokenHash(tokenHash) {
  const result = await query(
    `
      SELECT s.id, s.user_id, s.token_hash, s.expires_at, s.created_at, s.revoked_at,
             u.id AS user_id_ref, u.email, u.display_name, u.role, u.status, u.avatar_url, u.last_login_at, u.created_at AS user_created_at, u.updated_at AS user_updated_at
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
    user: mapUser({
      id: row.user_id_ref,
      email: row.email,
      display_name: row.display_name,
      role: row.role,
      status: row.status,
      avatar_url: row.avatar_url,
      last_login_at: row.last_login_at,
      created_at: row.user_created_at,
      updated_at: row.user_updated_at
    })
  };
}

export async function revokeSessionByTokenHash(tokenHash) {
  await query(
    `
      UPDATE user_sessions
      SET revoked_at = NOW()
      WHERE token_hash = $1 AND revoked_at IS NULL
    `,
    [tokenHash]
  );
}

export async function revokeAllUserSessions(userId) {
  await query(
    `
      UPDATE user_sessions
      SET revoked_at = NOW()
      WHERE user_id = $1 AND revoked_at IS NULL
    `,
    [userId]
  );
}

export async function countActiveAdmins() {
  const result = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM users
      WHERE role = 'admin' AND status = 'active'
    `
  );
  return Number(result.rows[0]?.total || 0);
}

export async function countActiveAdminsExcludingUser(userId) {
  const result = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM users
      WHERE role = 'admin' AND status = 'active' AND id <> $1
    `,
    [userId]
  );
  return Number(result.rows[0]?.total || 0);
}

export async function getUserUsage(userId) {
  const result = await query(
    `
      SELECT
        COALESCE(SUM(COALESCE((r.metadata->'audio'->>'size')::bigint, 0)), 0)::bigint AS audio_bytes_total,
        COUNT(r.id)::int AS recordings_total,
        COALESCE(SUM(LENGTH(COALESCE(r.metadata->'transcript'->>'text', ''))), 0)::bigint AS transcript_chars_total,
        COALESCE((
          SELECT COUNT(*)::int
          FROM summaries s
          JOIN recordings rs ON rs.id = s.recording_id
          WHERE rs.owner_user_id = $1
        ), 0) AS summaries_total,
        GREATEST(
          COALESCE(MAX(r.created_at), TO_TIMESTAMP(0)),
          COALESCE(MAX(r.created_at), TO_TIMESTAMP(0))
        ) AS last_activity_at
      FROM recordings r
      WHERE r.owner_user_id = $1
    `,
    [userId]
  );
  const row = result.rows[0] || {};
  return {
    audioBytesTotal: Number(row.audio_bytes_total || 0),
    recordingsTotal: Number(row.recordings_total || 0),
    transcriptCharsTotal: Number(row.transcript_chars_total || 0),
    summariesTotal: Number(row.summaries_total || 0),
    lastActivityAt: row.last_activity_at || null
  };
}

export async function upsertUserSetting(userId, key, value) {
  await query(
    `
      INSERT INTO user_settings (user_id, key, value)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (user_id, key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [userId, key, JSON.stringify(value || {})]
  );
}

export async function listUserSettings(userId) {
  const result = await query(
    `
      SELECT key, value
      FROM user_settings
      WHERE user_id = $1
    `,
    [userId]
  );
  return result.rows.reduce((acc, row) => {
    acc[row.key] = row.value || {};
    return acc;
  }, {});
}

export async function upsertAppSetting(key, value) {
  await query(
    `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [key, JSON.stringify(value ?? {})]
  );
}

export async function getAppSetting(key) {
  const result = await query(
    `
      SELECT key, value
      FROM app_settings
      WHERE key = $1
      LIMIT 1
    `,
    [key]
  );
  const row = result.rows[0];
  return row ? (row.value || {}) : null;
}

export async function listAppSettings(prefix = "") {
  const result = await query(
    `
      SELECT key, value
      FROM app_settings
      WHERE ($1 = '' OR key LIKE ($1 || '%'))
    `,
    [String(prefix || "")]
  );
  return result.rows.reduce((acc, row) => {
    acc[row.key] = row.value || {};
    return acc;
  }, {});
}

export async function insertAuditLog({ actorUserId = null, targetUserId = null, event, details = {} }) {
  await query(
    `
      INSERT INTO audit_log (id, actor_user_id, target_user_id, event, details)
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [randomUUID(), actorUserId, targetUserId, event, JSON.stringify(details || {})]
  );
}

export async function createOpenApiKey({ userId, name, keyHash, prefix }) {
  const id = randomUUID();
  const result = await query(
    `
      INSERT INTO openapi_keys (id, user_id, name, key_hash, prefix)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, name, prefix, created_at, last_used_at, revoked_at
    `,
    [id, userId, name, keyHash, prefix]
  );
  return mapOpenApiKey(result.rows[0]);
}

export async function listOpenApiKeysByUser(userId) {
  const result = await query(
    `
      SELECT id, user_id, name, prefix, created_at, last_used_at, revoked_at
      FROM openapi_keys
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );
  return result.rows.map(mapOpenApiKey);
}

export async function getOpenApiKeyByHash(keyHash) {
  const result = await query(
    `
      SELECT k.id, k.user_id, k.name, k.prefix, k.created_at, k.last_used_at, k.revoked_at,
             u.id AS user_id_ref, u.email, u.display_name, u.role, u.status, u.avatar_url, u.last_login_at, u.created_at AS user_created_at, u.updated_at AS user_updated_at
      FROM openapi_keys k
      JOIN users u ON u.id = k.user_id
      WHERE k.key_hash = $1
      LIMIT 1
    `,
    [keyHash]
  );
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    ...mapOpenApiKey(row),
    user: mapUser({
      id: row.user_id_ref,
      email: row.email,
      display_name: row.display_name,
      role: row.role,
      status: row.status,
      avatar_url: row.avatar_url,
      last_login_at: row.last_login_at,
      created_at: row.user_created_at,
      updated_at: row.user_updated_at
    })
  };
}

export async function touchOpenApiKeyLastUsed(id) {
  await query(
    `
      UPDATE openapi_keys
      SET last_used_at = NOW()
      WHERE id = $1
    `,
    [id]
  );
}

export async function revokeOpenApiKey(id, userId) {
  const result = await query(
    `
      UPDATE openapi_keys
      SET revoked_at = NOW()
      WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
      RETURNING id, user_id, name, prefix, created_at, last_used_at, revoked_at
    `,
    [id, userId]
  );
  return result.rows[0] ? mapOpenApiKey(result.rows[0]) : null;
}

export async function listUserOwnedRecordings(userId) {
  const result = await query(
    `
      SELECT id, owner_user_id, title, status, metadata, created_at
      FROM recordings
      WHERE owner_user_id = $1
      ORDER BY created_at DESC
    `,
    [userId]
  );
  return result.rows.map(mapRecording);
}

export async function hardDeleteUserAndData(userId) {
  const recordingsResult = await query(
    `
      SELECT id, owner_user_id, title, status, metadata, created_at
      FROM recordings
      WHERE owner_user_id = $1
    `,
    [userId]
  );
  const recordings = recordingsResult.rows.map(mapRecording);
  const recordingIds = recordings.map((entry) => entry.id);
  if (recordingIds.length) {
    await query("DELETE FROM recordings WHERE owner_user_id = $1", [userId]);
  }
  await query("DELETE FROM user_settings WHERE user_id = $1", [userId]);
  await query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);
  await query("DELETE FROM user_sessions WHERE user_id = $1", [userId]);
  await query("DELETE FROM users WHERE id = $1", [userId]);
  return { recordings, recordingIds };
}

export async function assignUnownedRecordingsToUser(userId) {
  await query(
    `
      UPDATE recordings
      SET owner_user_id = $1
      WHERE owner_user_id IS NULL
    `,
    [userId]
  );
}
