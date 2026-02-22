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

function normalizeWordTiming(word, fallbackStart = null, fallbackEnd = null) {
  if (!word || typeof word !== "object") return null;
  const text = String(word.word || word.text || "").trim();
  if (!text) return null;
  const start = Number(word.start ?? word.startTime ?? fallbackStart);
  const end = Number(word.end ?? word.endTime ?? fallbackEnd);
  return {
    word: text,
    start: Number.isFinite(start) ? start : null,
    end: Number.isFinite(end) ? end : null
  };
}

function detectTimestampScale(segments, wordTimings, durationHintSeconds = 0) {
  const values = [];
  (segments || []).forEach((segment) => {
    if (Number.isFinite(segment?.start) && segment.start >= 0) values.push(segment.start);
    if (Number.isFinite(segment?.end) && segment.end >= 0) values.push(segment.end);
  });
  (wordTimings || []).forEach((word) => {
    if (Number.isFinite(word?.start) && word.start >= 0) values.push(word.start);
    if (Number.isFinite(word?.end) && word.end >= 0) values.push(word.end);
  });
  if (!values.length) return 1;
  const maxValue = Math.max(...values);
  if (Number.isFinite(durationHintSeconds) && durationHintSeconds > 0) {
    if (maxValue > durationHintSeconds * 20) return 0.001;
    return 1;
  }
  return maxValue > 1000 ? 0.001 : 1;
}

function applyTimestampScale(segments, wordTimings, scale) {
  if (!(scale > 0) || scale === 1) {
    return { segments, wordTimings };
  }
  const scaledSegments = (segments || []).map((segment) => ({
    ...segment,
    start: Number.isFinite(segment.start) ? segment.start * scale : segment.start,
    end: Number.isFinite(segment.end) ? segment.end * scale : segment.end
  }));
  const scaledWords = (wordTimings || []).map((word) => ({
    ...word,
    start: Number.isFinite(word.start) ? word.start * scale : word.start,
    end: Number.isFinite(word.end) ? word.end * scale : word.end
  }));
  return { segments: scaledSegments, wordTimings: scaledWords };
}

function normalizeSegments(payload, durationHintSeconds = 0) {
  if (!payload || typeof payload !== "object") return { segments: null, wordTimings: null };
  const sourceSegments = Array.isArray(payload.segments) ? payload.segments : null;
  const sourceWords = Array.isArray(payload.words) ? payload.words : null;

  let segments = sourceSegments
    ? sourceSegments
      .map((segment, index) => {
        const text = String(segment?.text || "").trim();
        if (!text) return null;
        const start = Number(segment?.start ?? segment?.startTime);
        const end = Number(segment?.end ?? segment?.endTime);
        return {
          index,
          text,
          start: Number.isFinite(start) ? start : null,
          end: Number.isFinite(end) ? end : null
        };
      })
      .filter(Boolean)
    : null;

  let wordTimings = null;
  if (sourceWords?.length) {
    wordTimings = sourceWords
      .map((word) => normalizeWordTiming(word))
      .filter(Boolean);
  } else if (sourceSegments?.length) {
    wordTimings = sourceSegments.flatMap((segment) => {
      if (Array.isArray(segment?.words) && segment.words.length) {
        return segment.words
          .map((word) => normalizeWordTiming(word, segment.start, segment.end))
          .filter(Boolean);
      }
      return [];
    });
  }

  const scale = detectTimestampScale(segments, wordTimings, durationHintSeconds);
  ({ segments, wordTimings } = applyTimestampScale(segments, wordTimings, scale));

  return {
    segments: segments?.length ? segments : null,
    wordTimings: wordTimings?.length ? wordTimings : null
  };
}

function getErrorMessage(payload, fallbackStatus) {
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  if (payload?.error?.message) return payload.error.message;
  if (typeof payload?.error === "string") return payload.error;
  return `Transcription request failed (${fallbackStatus}).`;
}

async function sendTranscriptionRequest(endpoint, headers, form, controller) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: form,
    signal: controller.signal
  });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();
  return { response, payload };
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
  const durationHintSeconds = Number(audio.durationSeconds) > 0
    ? Number(audio.durationSeconds)
    : (Number(audio.durationMs) > 0 ? Number(audio.durationMs) / 1000 : 0);

  const makeForm = (options = {}) => {
    const form = new FormData();
    form.append(TRANSCRIPTION_FILE_FIELD, new Blob([fileBuffer], { type: contentType }), uploadName);
    if (TRANSCRIPTION_INCLUDE_MODEL_FIELD) {
      form.append("model", TRANSCRIPTION_MODEL);
    }
    if (TRANSCRIPTION_LANGUAGE) {
      form.append("language", TRANSCRIPTION_LANGUAGE);
    }
    if (options.verbose) {
      form.append("response_format", "verbose_json");
      form.append("timestamp_granularities[]", "word");
      form.append("timestamp_granularities[]", "segment");
    }
    return form;
  };

  const isRetryableFormatError = (status) => status === 400 || status === 404 || status === 415 || status === 422;

  let response;
  let payload;
  let parsedTimings = { segments: null, wordTimings: null };
  const headers = {};
  if (TRANSCRIPTION_API_KEY) {
    headers.Authorization = `Bearer ${TRANSCRIPTION_API_KEY}`;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT_MS);
  try {
    ({ response, payload } = await sendTranscriptionRequest(endpoint, headers, makeForm({ verbose: true }), controller));
    if (!response.ok && isRetryableFormatError(response.status)) {
      ({ response, payload } = await sendTranscriptionRequest(endpoint, headers, makeForm(), controller));
    }
    if (response.ok) {
      parsedTimings = normalizeSegments(payload, durationHintSeconds);
    }
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
    segments: parsedTimings.segments,
    wordTimings: parsedTimings.wordTimings,
    model: TRANSCRIPTION_MODEL,
    endpoint
  };
}
