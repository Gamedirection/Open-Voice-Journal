import { randomUUID } from "node:crypto";
import { query } from "./db.js";

function mapRecording(row) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    metadata: row.metadata || {}
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

export async function createRecording(payload) {
  const id = randomUUID();
  const title = payload.title || "Untitled recording";
  const status = "uploaded";
  const metadata = payload.metadata || {};

  const result = await query(
    `
      INSERT INTO recordings (id, title, status, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING id, title, status, metadata, created_at
    `,
    [id, title, status, JSON.stringify(metadata)]
  );

  return mapRecording(result.rows[0]);
}

export async function getRecording(id) {
  const result = await query(
    `
      SELECT id, title, status, metadata, created_at
      FROM recordings
      WHERE id = $1
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
