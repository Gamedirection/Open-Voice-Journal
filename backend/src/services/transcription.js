import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");

const TRANSCRIPTION_BASE_URL = (
  process.env.TRANSCRIPTION_API_BASE_URL ||
  process.env.OPENAI_BASE_URL ||
  ""
).trim();
const TRANSCRIPTION_ENDPOINT_PATH = (process.env.TRANSCRIPTION_ENDPOINT_PATH || "/v1/audio/transcriptions").trim();
const TRANSCRIPTION_MODEL = (process.env.TRANSCRIPTION_MODEL || "whisper-1").trim();
const TRANSCRIPTION_FILE_FIELD = (process.env.TRANSCRIPTION_FILE_FIELD || "file").trim();
const TRANSCRIPTION_INCLUDE_MODEL_FIELD =
  String(process.env.TRANSCRIPTION_INCLUDE_MODEL_FIELD || "true").toLowerCase() !== "false";
const TRANSCRIPTION_API_KEY = (
  process.env.TRANSCRIPTION_API_KEY ||
  process.env.OPENAI_API_KEY ||
  ""
).trim();
const TRANSCRIPTION_LANGUAGE = (process.env.TRANSCRIPTION_LANGUAGE || "").trim();
const TRANSCRIPTION_TIMEOUT_MS = Math.max(1000, Number(process.env.TRANSCRIPTION_TIMEOUT_MS || 120000));

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function normalizePath(value) {
  const pathValue = String(value || "").trim();
  if (!pathValue) return "/v1/audio/transcriptions";
  return pathValue.startsWith("/") ? pathValue : `/${pathValue}`;
}

function buildEndpointUrl() {
  const base = normalizeBaseUrl(TRANSCRIPTION_BASE_URL);
  const endpointPath = normalizePath(TRANSCRIPTION_ENDPOINT_PATH);
  if (!base) {
    throw new Error("Transcription provider not configured. Set TRANSCRIPTION_API_BASE_URL.");
  }
  return `${base}${endpointPath}`;
}

function ensureAudioPath(fileName) {
  const resolved = path.resolve(uploadsDir, fileName);
  if (!resolved.startsWith(uploadsDir)) {
    throw new Error("Invalid recording audio path.");
  }
  return resolved;
}

function readTranscriptText(payload) {
  if (typeof payload === "string") {
    const value = payload.trim();
    if (!value) return "";
    if (value.startsWith("{") || value.startsWith("[")) {
      try {
        const parsed = JSON.parse(value);
        return readTranscriptText(parsed);
      } catch (_error) {
        return value;
      }
    }
    return value;
  }
  if (!payload || typeof payload !== "object") return "";
  const candidate = payload.text || payload.transcript || payload.output_text;
  if (typeof candidate === "string") return candidate.trim();
  return "";
}

function getErrorMessage(payload, fallbackStatus) {
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  if (payload?.error?.message) return payload.error.message;
  if (typeof payload?.error === "string") return payload.error;
  return `Transcription request failed (${fallbackStatus}).`;
}

export async function transcribeRecording(recording) {
  const audio = recording?.metadata?.audio;
  if (!audio?.fileName) {
    throw new Error("Recording has no uploaded audio file.");
  }

  const endpoint = buildEndpointUrl();
  const filePath = ensureAudioPath(audio.fileName);
  const fileBuffer = await fs.readFile(filePath);

  const contentType = audio.mimeType || "application/octet-stream";
  const uploadName = audio.originalName || audio.fileName || "recording.webm";

  const form = new FormData();
  form.append(TRANSCRIPTION_FILE_FIELD, new Blob([fileBuffer], { type: contentType }), uploadName);
  if (TRANSCRIPTION_INCLUDE_MODEL_FIELD) {
    form.append("model", TRANSCRIPTION_MODEL);
  }
  if (TRANSCRIPTION_LANGUAGE) {
    form.append("language", TRANSCRIPTION_LANGUAGE);
  }

  const headers = {};
  if (TRANSCRIPTION_API_KEY) {
    headers.Authorization = `Bearer ${TRANSCRIPTION_API_KEY}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT_MS);

  let response;
  let payload;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: form,
      signal: controller.signal
    });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    payload = isJson ? await response.json() : await response.text();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Transcription request timed out after ${TRANSCRIPTION_TIMEOUT_MS}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  const text = readTranscriptText(payload);
  if (!text) {
    throw new Error("Transcription provider returned no transcript text.");
  }

  return {
    text,
    model: TRANSCRIPTION_MODEL,
    endpoint
  };
}
