function resolveDefaultApiBase() {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const isCapacitor = Boolean(window.Capacitor);
  const override = window.__OVJ_API_BASE || document.querySelector('meta[name="ovj-api-base"]')?.content;
  if (override) return override;

  if (isCapacitor) {
    return "http://192.168.1.85:8080";
  }

  if (protocol === "file:") {
    return "http://10.0.2.2:8080";
  }

  if (protocol === "https:") {
    return "/api";
  }

  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8080";
  }

  const port = window.location.port;
  if (port === "3090") return `http://${hostname}:3089`;
  return `http://${hostname}:8080`;
}

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/$/, "");
}

const SAVED_API_KEY = "ovj_api_base";
const THEME_KEY = "ovj_theme";
const UPLOAD_KEY = "ovj_upload_enabled";
const TAB_KEY = "ovj_active_tab";
const AUTO_TRANSCRIBE_KEY = "ovj_auto_transcribe";
const AUTO_SUMMARIZE_KEY = "ovj_auto_summarize";
const SUMMARY_PROVIDER_KEY = "ovj_summary_provider";
const SUMMARY_MODEL_KEY = "ovj_summary_model";
const SUMMARY_API_KEY_KEY = "ovj_summary_api_key";
const SUMMARY_TEMPLATE_KEY = "ovj_summary_template";

let API_BASE = localStorage.getItem(SAVED_API_KEY) || resolveDefaultApiBase();
API_BASE = normalizeBaseUrl(API_BASE);

let currentTheme = localStorage.getItem(THEME_KEY);
let uploadEnabled = localStorage.getItem(UPLOAD_KEY);
uploadEnabled = uploadEnabled === null ? true : uploadEnabled === "true";

const apiBaseInputEl = document.getElementById("apiBaseInput");
const saveApiBaseBtn = document.getElementById("saveApiBase");
const useEmulatorBtn = document.getElementById("useEmulator");
const useLocalhostBtn = document.getElementById("useLocalhost");
const usePromptBtn = document.getElementById("usePrompt");
const apiBaseLabelEl = document.getElementById("apiBaseLabel");
const apiStatusEl = document.getElementById("apiStatus");
const refreshHealthBtn = document.getElementById("refreshHealth");
const createRecordingBtn = document.getElementById("createRecording");
const queueTranscriptionBtn = document.getElementById("queueTranscription");
const createBackupBtn = document.getElementById("createBackup");
const autoTranscribeToggleEl = document.getElementById("autoTranscribeToggle");
const autoSummarizeToggleEl = document.getElementById("autoSummarizeToggle");
const summaryProviderEl = document.getElementById("summaryProvider");
const summaryModelEl = document.getElementById("summaryModel");
const summaryApiKeyEl = document.getElementById("summaryApiKey");
const summaryPromptEl = document.getElementById("summaryPrompt");
const summaryPromptDefaultEl = document.getElementById("summaryPromptDefault");
const saveAiSettingsBtn = document.getElementById("saveAiSettings");
const resetAiSettingsBtn = document.getElementById("resetAiSettings");
const aiSettingsStatusEl = document.getElementById("aiSettingsStatus");
const recordingTitleEl = document.getElementById("recordingTitle");
const recordingIdEl = document.getElementById("recordingId");
const recordingResultEl = document.getElementById("recordingResult");
const jobResultEl = document.getElementById("jobResult");
const backupStatusEl = document.getElementById("backupStatus");
const backupListEl = document.getElementById("backupList");
const themeToggleBtn = document.getElementById("themeToggle");
const uploadToggleEl = document.getElementById("uploadToggle");
const recordStartBtn = document.getElementById("recordStart");
const recordStopBtn = document.getElementById("recordStop");
const recordDownloadBtn = document.getElementById("recordDownload");
const recordStatusEl = document.getElementById("recordStatus");
const recordPlaybackEl = document.getElementById("recordPlayback");
const uploadStatusEl = document.getElementById("uploadStatus");
const manualTitleEl = document.getElementById("manualTitle");
const manualFileEl = document.getElementById("manualFile");
const manualUploadBtn = document.getElementById("manualUpload");
const manualStatusEl = document.getElementById("manualStatus");
const micEnableBtn = document.getElementById("micEnable");
const recordingsListEl = document.getElementById("recordingsList");
const refreshRecordingsBtn = document.getElementById("refreshRecordings");
const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
const visualizerCanvas = document.getElementById("recordVisualizer");
const projectVersionEl = document.getElementById("projectVersion");
const docsVersionEl = document.getElementById("docsVersion");
const docsSwaggerLinkEl = document.getElementById("docsSwaggerLink");
const docsOpenApiLinkEl = document.getElementById("docsOpenApiLink");

const DEFAULT_SUMMARY_PROVIDER = "ollama_local";
const DEFAULT_SUMMARY_MODEL = "qwen2.5:7b-instruct";
const DEFAULT_SUMMARY_TEMPLATE = [
  "Provide a general description of the conversation.",
  "Then highlight key topics discussed.",
  "Then list action items and follow-up items.",
  "Return clean Markdown with sections and concise bullets."
].join(" ");

const localRecordings = new Map();
const summaryCache = new Map();
const recordingUiState = new Map();
const recordingTaskQueues = new Map();

let autoTranscribeEnabled = localStorage.getItem(AUTO_TRANSCRIBE_KEY);
autoTranscribeEnabled = autoTranscribeEnabled === null ? false : autoTranscribeEnabled === "true";
let autoSummarizeEnabled = localStorage.getItem(AUTO_SUMMARIZE_KEY);
autoSummarizeEnabled = autoSummarizeEnabled === null ? false : autoSummarizeEnabled === "true";
let summaryProvider = localStorage.getItem(SUMMARY_PROVIDER_KEY) || DEFAULT_SUMMARY_PROVIDER;
let summaryModel = localStorage.getItem(SUMMARY_MODEL_KEY) || DEFAULT_SUMMARY_MODEL;
let summaryApiKey = localStorage.getItem(SUMMARY_API_KEY_KEY) || "";
let summaryTemplate = localStorage.getItem(SUMMARY_TEMPLATE_KEY) || DEFAULT_SUMMARY_TEMPLATE;

function createLocalRecording({ title, blob, downloadUrl, createdAt }) {
  const id = `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const entry = {
    id,
    title,
    status: "local",
    createdAt: createdAt || new Date().toISOString(),
    blob,
    downloadUrl,
    uploadStatus: "local"
  };
  localRecordings.set(id, entry);
  return entry;
}

function markLocalRecording(id, patch) {
  const current = localRecordings.get(id);
  if (!current) return;
  localRecordings.set(id, { ...current, ...patch });
}

function updateRecordingUiState(id, patch) {
  const current = recordingUiState.get(id) || {};
  recordingUiState.set(id, { ...current, ...patch });
}

function getRecordingUiState(id) {
  return recordingUiState.get(id) || {};
}

function formatTimestamp(value) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString();
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildLoadingBar(label, detail = "") {
  const wrap = document.createElement("div");
  wrap.className = "loading-wrap";
  const text = document.createElement("div");
  text.className = "loading-label";
  text.textContent = label;
  const detailEl = document.createElement("div");
  detailEl.className = "loading-detail";
  detailEl.textContent = detail;
  const bar = document.createElement("div");
  bar.className = "loading-bar";
  const fill = document.createElement("div");
  fill.className = "loading-bar-fill";
  bar.appendChild(fill);
  wrap.appendChild(text);
  if (detail) wrap.appendChild(detailEl);
  wrap.appendChild(bar);
  return wrap;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function markdownToHtml(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const html = [];
  let inList = false;
  for (const line of lines) {
    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
    if (line.startsWith("### ")) {
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }
    if (!line.trim()) {
      html.push("<br/>");
      continue;
    }
    html.push(`<p>${escapeHtml(line)}</p>`);
  }
  if (inList) html.push("</ul>");
  return html.join("");
}

function downloadTextFile(fileName, text, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copyText(content) {
  await navigator.clipboard.writeText(content);
}

async function copyMarkdownFormatted(markdown) {
  const html = markdownToHtml(markdown);
  if (window.ClipboardItem) {
    const item = new ClipboardItem({
      "text/plain": new Blob([markdown], { type: "text/plain" }),
      "text/html": new Blob([html], { type: "text/html" })
    });
    await navigator.clipboard.write([item]);
    return;
  }
  await navigator.clipboard.writeText(markdown);
}

function getSummaryRequestConfig() {
  return {
    provider: (summaryProviderEl?.value || summaryProvider || DEFAULT_SUMMARY_PROVIDER).trim() || DEFAULT_SUMMARY_PROVIDER,
    model: (summaryModelEl?.value || summaryModel || DEFAULT_SUMMARY_MODEL).trim() || DEFAULT_SUMMARY_MODEL,
    apiKey: (summaryApiKeyEl?.value || summaryApiKey || "").trim(),
    template: (summaryPromptEl?.value || summaryTemplate || DEFAULT_SUMMARY_TEMPLATE).trim() || DEFAULT_SUMMARY_TEMPLATE
  };
}

function renderAiSettings() {
  if (autoTranscribeToggleEl) autoTranscribeToggleEl.checked = autoTranscribeEnabled;
  if (autoSummarizeToggleEl) autoSummarizeToggleEl.checked = autoSummarizeEnabled;
  if (summaryProviderEl) summaryProviderEl.value = summaryProvider;
  if (summaryModelEl) summaryModelEl.value = summaryModel;
  if (summaryApiKeyEl) summaryApiKeyEl.value = summaryApiKey;
  if (summaryPromptEl) summaryPromptEl.value = summaryTemplate;
  if (summaryPromptDefaultEl) summaryPromptDefaultEl.textContent = DEFAULT_SUMMARY_TEMPLATE;
  if (aiSettingsStatusEl) {
    aiSettingsStatusEl.textContent = `Summary provider: ${summaryProvider} | model: ${summaryModel}`;
  }
}

function saveAiSettings() {
  summaryProvider = (summaryProviderEl?.value || DEFAULT_SUMMARY_PROVIDER).trim() || DEFAULT_SUMMARY_PROVIDER;
  summaryModel = (summaryModelEl?.value || DEFAULT_SUMMARY_MODEL).trim() || DEFAULT_SUMMARY_MODEL;
  summaryApiKey = (summaryApiKeyEl?.value || "").trim();
  summaryTemplate = (summaryPromptEl?.value || DEFAULT_SUMMARY_TEMPLATE).trim() || DEFAULT_SUMMARY_TEMPLATE;
  autoTranscribeEnabled = Boolean(autoTranscribeToggleEl?.checked);
  autoSummarizeEnabled = Boolean(autoSummarizeToggleEl?.checked);

  localStorage.setItem(SUMMARY_PROVIDER_KEY, summaryProvider);
  localStorage.setItem(SUMMARY_MODEL_KEY, summaryModel);
  localStorage.setItem(SUMMARY_API_KEY_KEY, summaryApiKey);
  localStorage.setItem(SUMMARY_TEMPLATE_KEY, summaryTemplate);
  localStorage.setItem(AUTO_TRANSCRIBE_KEY, String(autoTranscribeEnabled));
  localStorage.setItem(AUTO_SUMMARIZE_KEY, String(autoSummarizeEnabled));

  if (aiSettingsStatusEl) {
    aiSettingsStatusEl.textContent = `Saved. Provider: ${summaryProvider} | model: ${summaryModel}`;
  }
}

function resetAiSettings() {
  summaryProvider = DEFAULT_SUMMARY_PROVIDER;
  summaryModel = DEFAULT_SUMMARY_MODEL;
  summaryApiKey = "";
  summaryTemplate = DEFAULT_SUMMARY_TEMPLATE;
  autoTranscribeEnabled = false;
  autoSummarizeEnabled = false;

  localStorage.setItem(SUMMARY_PROVIDER_KEY, summaryProvider);
  localStorage.setItem(SUMMARY_MODEL_KEY, summaryModel);
  localStorage.setItem(SUMMARY_API_KEY_KEY, summaryApiKey);
  localStorage.setItem(SUMMARY_TEMPLATE_KEY, summaryTemplate);
  localStorage.setItem(AUTO_TRANSCRIBE_KEY, String(autoTranscribeEnabled));
  localStorage.setItem(AUTO_SUMMARIZE_KEY, String(autoSummarizeEnabled));
  renderAiSettings();
  if (aiSettingsStatusEl) aiSettingsStatusEl.textContent = "AI settings restored to defaults.";
}

function buildTranscriptMarkdown(recording) {
  const transcriptText = recording.metadata?.transcript?.text || "No transcript available.";
  return [
    `# Transcript - ${recording.title}`,
    "",
    `- Recording ID: ${recording.id}`,
    `- Generated: ${new Date().toISOString()}`,
    "",
    transcriptText
  ].join("\n");
}

function buildSummaryMarkdown(recording, markdown) {
  return [
    `# AI Summary - ${recording.title}`,
    "",
    `- Recording ID: ${recording.id}`,
    `- Generated: ${new Date().toISOString()}`,
    "",
    markdown || "No summary available."
  ].join("\n");
}

async function fetchRecordingAudioBlob(recordingId) {
  const response = await fetch(`${API_BASE}/api/v1/recordings/${recordingId}/file`);
  if (!response.ok) {
    throw new Error(`Audio request failed (${response.status})`);
  }
  return response.blob();
}

async function getSummaryPreview(recordingId, options = {}) {
  if (!options.forceRefresh && summaryCache.has(recordingId)) return summaryCache.get(recordingId);

  const listResponse = await fetch(`${API_BASE}/api/v1/recordings/${recordingId}/summaries?limit=1`);
  const isJson = listResponse.headers.get("content-type")?.includes("application/json");
  const listPayload = isJson ? await listResponse.json() : await listResponse.text();
  if (!options.forceCreate && listResponse.ok && listPayload?.summaries?.length) {
    const summary = listPayload.summaries[0];
    summaryCache.set(recordingId, summary.markdown);
    return summary.markdown;
  }

  const summaryConfig = getSummaryRequestConfig();

  const createResponse = await fetch(`${API_BASE}/api/v1/recordings/${recordingId}/summaries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: summaryConfig.provider,
      model: summaryConfig.model,
      template: summaryConfig.template,
      apiKey: summaryConfig.apiKey || undefined
    })
  });
  const createIsJson = createResponse.headers.get("content-type")?.includes("application/json");
  const createPayload = createIsJson ? await createResponse.json() : await createResponse.text();
  if (!createResponse.ok) {
    const message = typeof createPayload === "string" ? createPayload : createPayload.error;
    throw new Error(message || "Failed generating preview");
  }

  const markdown = createPayload?.summary?.markdown || "Preview unavailable.";
  summaryCache.set(recordingId, markdown);
  return markdown;
}

function setApiBase(value) {
  const normalized = normalizeBaseUrl(value);
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    apiBaseLabelEl.textContent = "API URL must start with http:// or https://";
    return false;
  }
  API_BASE = normalized;
  localStorage.setItem(SAVED_API_KEY, API_BASE);
  renderApiBase();
  checkHealth();
  loadVersion();
  loadRecordings();
  loadBackups();
  return true;
}

function renderApiBase() {
  apiBaseInputEl.value = API_BASE;
  apiBaseLabelEl.textContent = `Using API: ${API_BASE} | page=${window.location.origin || window.location.protocol}`;
  if (docsSwaggerLinkEl) docsSwaggerLinkEl.href = `${API_BASE}/api/docs`;
  if (docsOpenApiLinkEl) docsOpenApiLinkEl.href = `${API_BASE}/api/openapi.json`;
}

async function checkHealth() {
  apiStatusEl.textContent = "Checking API...";
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    let data = null;
    try {
      data = await response.json();
    } catch (_error) {
      data = null;
    }
    if (!data || !data.status) {
      apiStatusEl.textContent = response.ok ? "API response missing status." : `API error: ${response.status}`;
      return false;
    }
    const storageLabel = data.storage ? ` | storage: ${data.storage}` : "";
    const fallbackLabel = data.fallback ? " | fallback: on" : "";
    apiStatusEl.textContent = `${data.status} (db: ${data.db})${storageLabel}${fallbackLabel}`;
    return response.ok;
  } catch (error) {
    apiStatusEl.textContent = `API unreachable: ${error.message}`;
    return false;
  }
}

async function loadVersion() {
  const loadingText = "Version: loading...";
  if (projectVersionEl) projectVersionEl.textContent = loadingText;
  if (docsVersionEl) docsVersionEl.textContent = loadingText;
  try {
    const response = await fetch(`${API_BASE}/api/version`);
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || "Failed loading version");
    }
    const data = payload;

    const releaseDate = data.releaseDate ? ` (${data.releaseDate})` : "";
    const source = data.source ? ` via ${data.source}` : "";
    const versionLabel = `Version: v${data.version}${releaseDate}${source}`;
    if (projectVersionEl) projectVersionEl.textContent = versionLabel;
    if (docsVersionEl) docsVersionEl.textContent = versionLabel;
  } catch (error) {
    const message = `Version unavailable: ${error.message}`;
    if (projectVersionEl) projectVersionEl.textContent = message;
    if (docsVersionEl) docsVersionEl.textContent = message;
  }
}

function collectApiCandidates() {
  const candidates = [API_BASE, resolveDefaultApiBase()];
  const hostname = window.location.hostname;
  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    candidates.push(`http://${hostname}:3089`);
    candidates.push(`http://${hostname}:8080`);
  }
  if (window.location.protocol === "https:") {
    candidates.unshift("/api");
  }

  return Array.from(new Set(candidates.map((value) => normalizeBaseUrl(String(value || ""))).filter(Boolean)));
}

async function ensureReachableApiBase() {
  const candidates = collectApiCandidates();
  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate}/api/health`);
      if (!response.ok) continue;
      API_BASE = candidate;
      localStorage.setItem(SAVED_API_KEY, API_BASE);
      renderApiBase();
      return true;
    } catch (_error) {
      // Keep trying fallback endpoints.
    }
  }
  return false;
}

async function createRecording(titleOverride) {
  recordingResultEl.textContent = "Creating...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/recordings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleOverride || recordingTitleEl.value || "Test memo from app" })
    });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || "Failed creating recording");
    }
    const data = payload;

    recordingIdEl.value = data.id;
    recordingResultEl.textContent = `Created: ${data.id}`;
    loadRecordings();
    return data;
  } catch (error) {
    recordingResultEl.textContent = `Error: ${error.message}`;
    throw error;
  }
}

async function queueTranscription() {
  const recordingId = recordingIdEl.value.trim();
  if (!recordingId) {
    jobResultEl.textContent = "Recording ID is required.";
    return;
  }

  jobResultEl.textContent = "Queueing...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/recordings/${recordingId}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed queueing job");

    jobResultEl.textContent = `Queued job: ${data.job.id} (${data.job.status})`;
  } catch (error) {
    jobResultEl.textContent = `Error: ${error.message}`;
  }
}

async function pollJobUntilFinished(jobId, timeoutMs = 180000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const response = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`);
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || `Job lookup failed (${response.status})`);
    }
    const status = payload.status;
    if (status === "completed" || status === "failed") {
      return payload;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Timed out waiting for processing job.");
}

function enqueueRecordingTask(recordingId, label, taskFn) {
  const previous = recordingTaskQueues.get(recordingId) || Promise.resolve();
  const state = getRecordingUiState(recordingId);
  updateRecordingUiState(recordingId, {
    queuedTasks: (state.queuedTasks || 0) + 1
  });
  loadRecordings();

  const run = async () => {
    const active = getRecordingUiState(recordingId);
    updateRecordingUiState(recordingId, {
      activeTaskLabel: label,
      queuedTasks: Math.max(0, (active.queuedTasks || 1) - 1)
    });
    loadRecordings();
    try {
      return await taskFn();
    } finally {
      const end = getRecordingUiState(recordingId);
      updateRecordingUiState(recordingId, { activeTaskLabel: null, queuedTasks: end.queuedTasks || 0 });
      loadRecordings();
    }
  };

  const next = previous.then(run, run);
  recordingTaskQueues.set(recordingId, next.finally(() => {
    if (recordingTaskQueues.get(recordingId) === next) {
      recordingTaskQueues.delete(recordingId);
    }
  }));
  return next;
}

async function runTranscriptionFlow(recordingId) {
  const response = await fetch(`${API_BASE}/api/v1/recordings/${recordingId}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload.error;
    throw new Error(message || `Transcription failed (${response.status})`);
  }

  const job = await pollJobUntilFinished(payload.job.id);
  if (job.status !== "completed") {
    throw new Error(job.error || "Transcription job failed.");
  }
  await loadRecordings();
  if (autoSummarizeEnabled) {
    await runSummaryFlow(recordingId, { forceCreate: true });
  }
}

async function runSummaryFlow(recordingId, options = {}) {
  const markdown = await getSummaryPreview(recordingId, {
    forceCreate: Boolean(options.forceCreate),
    forceRefresh: Boolean(options.forceRefresh)
  });
  updateRecordingUiState(recordingId, { summaryMarkdown: markdown, showSummary: true });
  await loadRecordings();
  return markdown;
}

async function loadBackups() {
  if (!backupListEl) return;
  backupListEl.textContent = "Loading backups...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/backups`);
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || `Failed loading backups (${response.status})`);
    }

    const backups = Array.isArray(payload?.backups) ? payload.backups : [];
    backupListEl.innerHTML = "";
    if (!backups.length) {
      backupListEl.textContent = "No backups yet.";
      return;
    }

    backups.forEach((backup) => {
      const item = document.createElement("div");
      item.className = "recording-item cloud";

      const title = document.createElement("div");
      title.textContent = backup.name;
      const meta = document.createElement("div");
      meta.className = "recording-meta";
      meta.textContent = `${formatBytes(backup.size)} - ${formatTimestamp(backup.updatedAt || backup.createdAt)}`;

      const actions = document.createElement("div");
      actions.className = "recording-actions";

      const downloadBtn = document.createElement("button");
      downloadBtn.type = "button";
      downloadBtn.textContent = "Download";
      downloadBtn.addEventListener("click", async () => {
        try {
          const response = await fetch(`${API_BASE}/api/v1/backups/${encodeURIComponent(backup.name)}/download`);
          if (!response.ok) throw new Error(`Download failed (${response.status})`);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = backup.name;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        } catch (error) {
          alert(`Backup download failed: ${error.message}`);
        }
      });
      actions.appendChild(downloadBtn);

      const restoreBtn = document.createElement("button");
      restoreBtn.type = "button";
      restoreBtn.textContent = "Restore";
      restoreBtn.addEventListener("click", async () => {
        const proceed = confirm(
          `Restore backup "${backup.name}"?\n\nWarning: This will import recordings into the current server.`
        );
        if (!proceed) return;
        backupStatusEl.textContent = `Restoring ${backup.name}...`;
        try {
          const response = await fetch(`${API_BASE}/api/v1/backups/${encodeURIComponent(backup.name)}/restore`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ replaceExisting: false })
          });
          const isJson = response.headers.get("content-type")?.includes("application/json");
          const payload = isJson ? await response.json() : await response.text();
          if (!response.ok) {
            const message = typeof payload === "string" ? payload : payload.error;
            throw new Error(message || `Restore failed (${response.status})`);
          }
          backupStatusEl.textContent = `Restore completed: ${payload.restoredCount} recordings imported.`;
          loadRecordings();
        } catch (error) {
          backupStatusEl.textContent = `Restore failed: ${error.message}`;
        }
      });
      actions.appendChild(restoreBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete backup";
      deleteBtn.addEventListener("click", async () => {
        const proceed = confirm(
          `Delete backup "${backup.name}"?\n\nWarning: This cannot be undone.`
        );
        if (!proceed) return;
        try {
          const response = await fetch(`${API_BASE}/api/v1/backups/${encodeURIComponent(backup.name)}`, {
            method: "DELETE"
          });
          const isJson = response.headers.get("content-type")?.includes("application/json");
          const payload = isJson ? await response.json() : await response.text();
          if (!response.ok) {
            const message = typeof payload === "string" ? payload : payload.error;
            throw new Error(message || `Delete failed (${response.status})`);
          }
          backupStatusEl.textContent = `Deleted backup: ${backup.name}`;
          loadBackups();
        } catch (error) {
          backupStatusEl.textContent = `Delete failed: ${error.message}`;
        }
      });
      actions.appendChild(deleteBtn);

      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(actions);
      backupListEl.appendChild(item);
    });
  } catch (error) {
    backupListEl.textContent = `Error loading backups: ${error.message}`;
  }
}

async function createBackup() {
  if (!backupStatusEl) return;
  backupStatusEl.textContent = "Creating backup...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/backups`, { method: "POST" });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || `Backup failed (${response.status})`);
    }
    backupStatusEl.textContent = `Backup created: ${payload.backup.name}`;
    loadBackups();
  } catch (error) {
    backupStatusEl.textContent = `Backup failed: ${error.message}`;
  }
}

function getPreferredTheme() {
  if (currentTheme) return currentTheme;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem(THEME_KEY, theme);
  document.body.dataset.theme = theme;
  if (themeToggleBtn) {
    themeToggleBtn.textContent = `Dark mode: ${theme === "dark" ? "On" : "Off"}`;
  }
}

function updateUploadToggle(value) {
  uploadEnabled = value;
  localStorage.setItem(UPLOAD_KEY, String(value));
  if (uploadToggleEl) uploadToggleEl.checked = value;
  if (uploadStatusEl) {
    uploadStatusEl.textContent = value
      ? "Uploads enabled by default."
      : "Uploads disabled. Recordings stay on this device.";
  }
}

function setActiveTab(tabName) {
  tabButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.tab === tabName);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `tab-${tabName}`);
  });
  localStorage.setItem(TAB_KEY, tabName);
}

async function loadRecordings() {
  if (!recordingsListEl) return;
  recordingsListEl.textContent = "Loading recordings...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/recordings?limit=50`, { cache: "no-store" });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || `Failed loading recordings (${response.status})`);
    }
    const data = payload;

    recordingsListEl.innerHTML = "";
    const localItems = Array.from(localRecordings.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const cloudItems = Array.isArray(data) ? data : [];
    const combined = [...localItems, ...cloudItems];

    if (!combined.length) {
      recordingsListEl.textContent = "No recordings yet.";
      return;
    }

    localItems.forEach((recording) => {
      const item = document.createElement("div");
      item.className = "recording-item local";

      const title = document.createElement("div");
      title.textContent = recording.title;

      const meta = document.createElement("div");
      meta.className = "recording-meta";
      meta.textContent = `${recording.id} - ${recording.uploadStatus || "local"} - ${formatTimestamp(recording.createdAt)}`;

      const badges = document.createElement("div");
      badges.className = "recording-actions";
      const badge = document.createElement("span");
      badge.className = `badge ${recording.uploadStatus === "uploading" ? "badge-uploading" : "badge-local"}`;
      badge.textContent = recording.uploadStatus === "uploading" ? "Uploading" : "\uD83C\uDFE0 Local";
      badges.appendChild(badge);

      const actions = document.createElement("div");
      actions.className = "recording-actions";

      const downloadBtn = document.createElement("button");
      downloadBtn.type = "button";
      downloadBtn.textContent = "Download";
      downloadBtn.addEventListener("click", () => {
        if (!recording.downloadUrl) return;
        markLocalRecording(recording.id, { downloading: true });
        loadRecordings();
        const link = document.createElement("a");
        link.href = recording.downloadUrl;
        link.download = `${sanitizeFilename(recording.title)}.${getFileExtension(recording.blob?.type || "audio/webm")}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => {
          markLocalRecording(recording.id, { downloading: false });
          loadRecordings();
        }, 300);
      });
      actions.appendChild(downloadBtn);

      const uploadBtn = document.createElement("button");
      uploadBtn.type = "button";
      uploadBtn.textContent = "Upload to Cloud";
      uploadBtn.disabled = recording.uploadStatus === "uploading";
      uploadBtn.addEventListener("click", () => {
        if (!recording.blob) return;
        markLocalRecording(recording.id, { uploadStatus: "uploading" });
        loadRecordings();
        uploadRecording(recording.blob, recording.title, recording.id);
      });
      actions.appendChild(uploadBtn);

      const deleteLocalBtn = document.createElement("button");
      deleteLocalBtn.type = "button";
      deleteLocalBtn.textContent = "Delete local";
      deleteLocalBtn.addEventListener("click", () => {
        const proceed = confirm(
          `Delete local recording "${recording.title}"?\n\nWarning: This removes the local audio copy and cannot be undone.`
        );
        if (!proceed) return;
        if (recording.downloadUrl) {
          URL.revokeObjectURL(recording.downloadUrl);
        }
        localRecordings.delete(recording.id);
        loadRecordings();
      });
      actions.appendChild(deleteLocalBtn);

      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(badges);
      if (recording.uploadStatus === "uploading") {
        item.appendChild(buildLoadingBar("Uploading..."));
      }
      if (recording.downloading) {
        item.appendChild(buildLoadingBar("Downloading..."));
      }
      item.appendChild(actions);
      recordingsListEl.appendChild(item);
    });

    cloudItems.forEach((recording) => {
      const uiState = getRecordingUiState(recording.id);
      const item = document.createElement("div");
      item.className = "recording-item cloud";

      const title = document.createElement("div");
      title.textContent = recording.title;

      const meta = document.createElement("div");
      meta.className = "recording-meta";
      meta.textContent = `${recording.id} - ${recording.status} - ${formatTimestamp(recording.createdAt)}`;

      const badge = document.createElement("span");
      badge.className = "badge badge-cloud";
      badge.textContent = "\u2601\uFE0F Cloud";

      const actions = document.createElement("div");
      actions.className = "recording-actions";
      actions.appendChild(badge);

      const previewSelect = document.createElement("select");
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Preview transcript...";
      previewSelect.appendChild(defaultOption);

      const transcriptOption = document.createElement("option");
      transcriptOption.value = "transcript";
      transcriptOption.textContent = "Transcription";
      previewSelect.appendChild(transcriptOption);

      const summaryOption = document.createElement("option");
      summaryOption.value = "summary";
      summaryOption.textContent = "Summarized";
      previewSelect.appendChild(summaryOption);

      const hideOption = document.createElement("option");
      hideOption.value = "none";
      hideOption.textContent = "Hide preview";
      previewSelect.appendChild(hideOption);

      actions.appendChild(previewSelect);

      if (recording.metadata?.audio?.fileName) {
        const playBtn = document.createElement("button");
        playBtn.type = "button";
        playBtn.textContent = "Play audio";
        playBtn.disabled = uiState.playbackLoading;
        playBtn.addEventListener("click", async () => {
          if (uiState.playbackUrl) {
            const nextHidden = !uiState.showPlayback;
            updateRecordingUiState(recording.id, { showPlayback: nextHidden });
            loadRecordings();
            return;
          }

          updateRecordingUiState(recording.id, { playbackLoading: true });
          loadRecordings();
          try {
            const blob = await fetchRecordingAudioBlob(recording.id);
            const playbackUrl = URL.createObjectURL(blob);
            updateRecordingUiState(recording.id, {
              playbackUrl,
              showPlayback: true,
              playbackLoading: false
            });
          } catch (error) {
            alert(`Playback failed: ${error.message}`);
            updateRecordingUiState(recording.id, { playbackLoading: false });
          } finally {
            loadRecordings();
          }
        });
        actions.appendChild(playBtn);

        const downloadBtn = document.createElement("button");
        downloadBtn.type = "button";
        downloadBtn.textContent = "Download audio";
        downloadBtn.addEventListener("click", async () => {
          updateRecordingUiState(recording.id, { downloading: true });
          loadRecordings();
          try {
            const blob = await fetchRecordingAudioBlob(recording.id);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${sanitizeFilename(recording.title)}.${getFileExtension(blob.type || "audio/webm")}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
          } catch (error) {
            alert(`Download failed: ${error.message}`);
          } finally {
            updateRecordingUiState(recording.id, { downloading: false });
            loadRecordings();
          }
        });
        actions.appendChild(downloadBtn);
      }

      const transcribeBtn = document.createElement("button");
      transcribeBtn.type = "button";
      transcribeBtn.textContent = "Transcribe";
      transcribeBtn.disabled = Boolean(uiState.activeTaskLabel);
      transcribeBtn.addEventListener("click", async () => {
        try {
          await enqueueRecordingTask(recording.id, "Transcribing audio", async () => {
            await runTranscriptionFlow(recording.id);
          });
        } catch (error) {
          alert(`Transcription failed: ${error.message}`);
        }
      });
      actions.appendChild(transcribeBtn);

      const summarizeBtn = document.createElement("button");
      summarizeBtn.type = "button";
      summarizeBtn.textContent = "Summarize";
      summarizeBtn.disabled = Boolean(uiState.activeTaskLabel);
      summarizeBtn.addEventListener("click", async () => {
        try {
          await enqueueRecordingTask(recording.id, "Generating AI summary", async () => {
            await runSummaryFlow(recording.id, { forceCreate: true, forceRefresh: true });
          });
        } catch (error) {
          alert(`Summary failed: ${error.message}`);
        }
      });
      actions.appendChild(summarizeBtn);


      const deleteCloudBtn = document.createElement("button");
      deleteCloudBtn.type = "button";
      deleteCloudBtn.textContent = "Delete cloud";
      deleteCloudBtn.addEventListener("click", async () => {
        const proceed = confirm(
          `Delete cloud recording "${recording.title}"?\n\nWarning: This permanently removes audio, transcript metadata, and related jobs/summaries.`
        );
        if (!proceed) return;
        updateRecordingUiState(recording.id, { deleting: true });
        loadRecordings();
        try {
          const response = await fetch(`${API_BASE}/api/v1/recordings/${recording.id}`, {
            method: "DELETE"
          });
          const isJson = response.headers.get("content-type")?.includes("application/json");
          const payload = isJson ? await response.json() : await response.text();
          if (!response.ok) {
            const message = typeof payload === "string" ? payload : payload.error;
            throw new Error(message || `Delete failed (${response.status})`);
          }
          const playbackUrl = getRecordingUiState(recording.id).playbackUrl;
          if (playbackUrl) URL.revokeObjectURL(playbackUrl);
          recordingUiState.delete(recording.id);
          loadRecordings();
        } catch (error) {
          alert(`Delete failed: ${error.message}`);
          updateRecordingUiState(recording.id, { deleting: false });
          loadRecordings();
        }
      });
      actions.appendChild(deleteCloudBtn);

      const preview = document.createElement("div");
      preview.className = "recording-preview";
      preview.hidden = true;
      const previewTitle = document.createElement("div");
      previewTitle.textContent = "Transcript preview";
      const previewBodyText = document.createElement("pre");
      previewBodyText.textContent = "";
      const previewBodyMarkdown = document.createElement("div");
      previewBodyMarkdown.className = "markdown-body";
      previewBodyMarkdown.hidden = true;
      const transcriptActions = document.createElement("div");
      transcriptActions.className = "recording-actions";
      transcriptActions.hidden = true;
      const transcriptMdBtn = document.createElement("button");
      transcriptMdBtn.type = "button";
      transcriptMdBtn.textContent = "Transcript .md";
      transcriptMdBtn.addEventListener("click", () => {
        const markdown = buildTranscriptMarkdown(recording);
        downloadTextFile(`${sanitizeFilename(recording.title)}-transcript.md`, markdown, "text/markdown;charset=utf-8");
      });
      const transcriptCopyMdBtn = document.createElement("button");
      transcriptCopyMdBtn.type = "button";
      transcriptCopyMdBtn.textContent = "Copy transcript (md)";
      transcriptCopyMdBtn.addEventListener("click", async () => {
        try {
          await copyMarkdownFormatted(buildTranscriptMarkdown(recording));
        } catch (error) {
          alert(`Copy failed: ${error.message}`);
        }
      });
      const transcriptCopyTextBtn = document.createElement("button");
      transcriptCopyTextBtn.type = "button";
      transcriptCopyTextBtn.textContent = "Copy transcript (text)";
      transcriptCopyTextBtn.addEventListener("click", async () => {
        try {
          await copyText(recording.metadata?.transcript?.text || "");
        } catch (error) {
          alert(`Copy failed: ${error.message}`);
        }
      });
      transcriptActions.appendChild(transcriptMdBtn);
      transcriptActions.appendChild(transcriptCopyMdBtn);
      transcriptActions.appendChild(transcriptCopyTextBtn);
      preview.appendChild(previewTitle);
      preview.appendChild(previewBodyText);
      preview.appendChild(previewBodyMarkdown);
      preview.appendChild(transcriptActions);

      previewSelect.addEventListener("change", async (event) => {
        const value = event.target.value;
        if (!value || value === "none") {
          preview.hidden = true;
          return;
        }

        preview.hidden = false;
        transcriptActions.hidden = true;
        previewBodyText.hidden = false;
        previewBodyMarkdown.hidden = true;
        if (value === "transcript") {
          previewTitle.textContent = "Transcription preview";
          transcriptActions.hidden = false;
          if (recording.metadata?.transcriptionError?.message) {
            previewBodyText.textContent = `Transcription failed: ${recording.metadata.transcriptionError.message}`;
          } else if (recording.metadata?.transcript?.text) {
            previewBodyText.textContent = recording.metadata.transcript.text;
          } else {
            previewBodyText.textContent = "No transcript available yet. Click Transcribe first.";
          }
          return;
        }

        previewTitle.textContent = "Summarized (AI)";
        previewBodyText.hidden = true;
        previewBodyMarkdown.hidden = false;
        previewBodyMarkdown.innerHTML = "<p>Loading preview...</p>";
        try {
          const markdown = await enqueueRecordingTask(recording.id, "Generating AI summary", async () => (
            runSummaryFlow(recording.id, { forceCreate: false, forceRefresh: false })
          ));
          previewBodyMarkdown.innerHTML = markdownToHtml(markdown);
        } catch (error) {
          previewBodyMarkdown.innerHTML = `<p>Preview failed: ${escapeHtml(error.message)}</p>`;
        }
      });

      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(actions);
      if (uiState.downloading) {
        item.appendChild(buildLoadingBar("Downloading..."));
      }
      if (uiState.playbackLoading) {
        item.appendChild(buildLoadingBar("Loading playback..."));
      }
      if (uiState.transcribing) {
        item.appendChild(buildLoadingBar("Transcribing..."));
      }
      if (uiState.deleting) {
        item.appendChild(buildLoadingBar("Deleting..."));
      }
      if (uiState.activeTaskLabel || uiState.queuedTasks) {
        const detail = uiState.queuedTasks ? `${uiState.queuedTasks} queued` : "";
        item.appendChild(buildLoadingBar(uiState.activeTaskLabel || "Queued for processing", detail));
      }
      if (uiState.playbackUrl && uiState.showPlayback) {
        const cloudPlayback = document.createElement("audio");
        cloudPlayback.controls = true;
        cloudPlayback.src = uiState.playbackUrl;
        cloudPlayback.preload = "metadata";
        item.appendChild(cloudPlayback);
      }
      const summaryMarkdown = uiState.summaryMarkdown || summaryCache.get(recording.id) || "";
      const summaryPanel = document.createElement("div");
      summaryPanel.className = "recording-summary";
      summaryPanel.hidden = !summaryMarkdown;
      if (summaryMarkdown) {
        const summaryTitle = document.createElement("div");
        summaryTitle.textContent = "✨ AI Summary";
        const summaryWarn = document.createElement("div");
        summaryWarn.className = "recording-meta";
        summaryWarn.textContent = "Warning: AI summary may be incorrect. Review carefully.";
        const summaryBody = document.createElement("div");
        summaryBody.className = "markdown-body";
        summaryBody.innerHTML = markdownToHtml(summaryMarkdown);
        const summaryActions = document.createElement("div");
        summaryActions.className = "recording-actions";

        const downloadSummaryBtn = document.createElement("button");
        downloadSummaryBtn.type = "button";
        downloadSummaryBtn.textContent = "Summary .md";
        downloadSummaryBtn.addEventListener("click", () => {
          const md = buildSummaryMarkdown(recording, summaryMarkdown);
          downloadTextFile(`${sanitizeFilename(recording.title)}-summary.md`, md, "text/markdown;charset=utf-8");
        });
        summaryActions.appendChild(downloadSummaryBtn);

        const copySummaryMdBtn = document.createElement("button");
        copySummaryMdBtn.type = "button";
        copySummaryMdBtn.textContent = "Copy summary (md)";
        copySummaryMdBtn.addEventListener("click", async () => {
          try {
            await copyMarkdownFormatted(buildSummaryMarkdown(recording, summaryMarkdown));
          } catch (error) {
            alert(`Copy failed: ${error.message}`);
          }
        });
        summaryActions.appendChild(copySummaryMdBtn);

        const copySummaryTextBtn = document.createElement("button");
        copySummaryTextBtn.type = "button";
        copySummaryTextBtn.textContent = "Copy summary (text)";
        copySummaryTextBtn.addEventListener("click", async () => {
          try {
            await copyText(summaryMarkdown);
          } catch (error) {
            alert(`Copy failed: ${error.message}`);
          }
        });
        summaryActions.appendChild(copySummaryTextBtn);

        summaryPanel.appendChild(summaryTitle);
        summaryPanel.appendChild(summaryWarn);
        summaryPanel.appendChild(summaryBody);
        summaryPanel.appendChild(summaryActions);
      }
      item.appendChild(summaryPanel);
      item.appendChild(preview);
      recordingsListEl.appendChild(item);
    });
  } catch (error) {
    recordingsListEl.textContent = `Error loading recordings: ${error.message}`;
  }
}

let mediaRecorder = null;
let activeStream = null;
let recordedChunks = [];
let recordingTimer = null;
let recordingStartedAt = null;
let downloadUrl = null;
let audioContext = null;
let analyserNode = null;
let animationFrame = null;

function pickRecordingMimeType() {
  const options = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac"
  ];
  if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return "";
  return options.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function setRecordingUiState(state) {
  if (!recordStatusEl) return;
  recordStatusEl.textContent = state.message;
  recordStartBtn.disabled = state.startDisabled;
  recordStopBtn.disabled = state.stopDisabled;
  recordDownloadBtn.disabled = state.downloadDisabled;
  recordStartBtn.classList.toggle("is-recording", Boolean(state.isRecording));
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateRecordingTimer() {
  if (!recordingStartedAt) return;
  const elapsed = Date.now() - recordingStartedAt;
  recordStatusEl.textContent = `Recording... ${formatDuration(elapsed)}`;
}

function sanitizeFilename(value) {
  return value.replace(/[^\w\-]+/g, "_").slice(0, 40) || "ovj_recording";
}

function getFileExtension(mimeType) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("aac")) return "aac";
  return "webm";
}

function setupVisualizer(stream) {
  if (!visualizerCanvas) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(stream);
  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 256;
  source.connect(analyserNode);

  const canvas = visualizerCanvas;
  const ctx = canvas.getContext("2d");
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    animationFrame = requestAnimationFrame(draw);
    analyserNode.getByteFrequencyData(dataArray);

    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(31, 122, 77, 0.2)";
    ctx.fillRect(0, 0, width, height);

    const barWidth = width / bufferLength;
    for (let i = 0; i < bufferLength; i += 1) {
      const value = dataArray[i] / 255;
      const barHeight = value * height;
      ctx.fillStyle = `rgba(217, 58, 58, ${0.3 + value * 0.7})`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
    }
  }

  draw();
}

function stopVisualizer() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  if (audioContext) audioContext.close();
  audioContext = null;
  analyserNode = null;
}

async function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setRecordingUiState({
      message: "Audio recording is not supported in this browser.",
      startDisabled: true,
      stopDisabled: true,
      downloadDisabled: true
    });
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    activeStream = stream;
    recordedChunks = [];
    setupVisualizer(stream);

    const mimeType = pickRecordingMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorder = recorder;

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) recordedChunks.push(event.data);
    });

    recorder.addEventListener("stop", () => {
      const blob = new Blob(recordedChunks, { type: recorder.mimeType || "audio/webm" });
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = URL.createObjectURL(blob);
      recordPlaybackEl.src = downloadUrl;
      recordPlaybackEl.load();

      const title = recordingTitleEl?.value?.trim() || "ovj_recording";
      recordDownloadBtn.dataset.filename = `${sanitizeFilename(title)}.${getFileExtension(blob.type)}`;
      const localEntry = createLocalRecording({ title, blob, downloadUrl });

      setRecordingUiState({
        message: "Recording ready.",
        startDisabled: false,
        stopDisabled: true,
        downloadDisabled: false,
        isRecording: false
      });

      if (uploadEnabled) {
        markLocalRecording(localEntry.id, { uploadStatus: "uploading" });
        loadRecordings();
        uploadRecording(blob, title, localEntry.id);
      } else {
        promptLocalDownload("Uploads are disabled. The recording is only on this device.");
        loadRecordings();
      }

      mediaRecorder = null;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
        activeStream = null;
      }
    });

    recorder.addEventListener("error", (event) => {
      setRecordingUiState({
        message: `Recording failed: ${event.error?.message || "Recorder error"}`,
        startDisabled: false,
        stopDisabled: true,
        downloadDisabled: true,
        isRecording: false
      });
      mediaRecorder = null;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
        activeStream = null;
      }
    });

    recorder.start();
    recordingStartedAt = Date.now();
    recordingTimer = setInterval(updateRecordingTimer, 500);

    setRecordingUiState({
      message: "Recording... 00:00",
      startDisabled: true,
      stopDisabled: false,
      downloadDisabled: true,
      isRecording: true
    });
  } catch (error) {
    setRecordingUiState({
      message: `Recording failed: ${error.message}`,
      startDisabled: false,
      stopDisabled: true,
      downloadDisabled: true
    });
  }
}

async function requestMicrophonePermission() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (recordStatusEl) {
      recordStatusEl.textContent = "Microphone access is not supported in this browser.";
    }
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    if (recordStatusEl) {
      recordStatusEl.textContent = "Microphone permission granted.";
    }
  } catch (error) {
    if (recordStatusEl) {
      recordStatusEl.textContent = `Microphone permission denied: ${error.message}`;
    }
  }
}

function stopRecording() {
  const recorder = mediaRecorder;
  if (!recorder) return;
  recordStopBtn.disabled = true;
  try {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  } catch (_error) {
    // Ignore stop errors.
  }
  clearInterval(recordingTimer);
  recordingTimer = null;
  recordingStartedAt = null;
  stopVisualizer();
}

function downloadRecording() {
  if (!downloadUrl && recordPlaybackEl?.src) {
    downloadUrl = recordPlaybackEl.src;
  }
  if (!downloadUrl) return;
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = recordDownloadBtn.dataset.filename || "ovj_recording.webm";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function promptLocalDownload(reason) {
  if (!downloadUrl) return;
  const title = recordingTitleEl?.value?.trim() || "Recording";
  const message = reason
    ? `${reason}\n\nDownload "${title}" now?`
    : `Download "${title}" now?`;
  if (confirm(message)) {
    downloadRecording();
  }
}

async function uploadRecording(blob, title, localId) {
  if (!uploadStatusEl) return;
  uploadStatusEl.textContent = "Uploading recording...";
  try {
    const recording = await createRecording(title);
    const formData = new FormData();
    const fileName = `${sanitizeFilename(title)}.${getFileExtension(blob.type)}`;
    formData.append("audio", blob, fileName);
    formData.append("title", title);

    const response = await fetch(`${API_BASE}/api/v1/recordings/${recording.id}/upload`, {
      method: "POST",
      body: formData
    });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || "Failed uploading audio");
    }

    uploadStatusEl.textContent = `Uploaded: ${recording.id}`;
    if (localId) {
      const previous = localRecordings.get(localId);
      if (previous?.downloadUrl) {
        URL.revokeObjectURL(previous.downloadUrl);
      }
      localRecordings.delete(localId);
    }
    loadRecordings();
    if (autoTranscribeEnabled) {
      uploadStatusEl.textContent = `Uploaded: ${recording.id} | queued transcription`;
      enqueueRecordingTask(recording.id, "Auto transcribing upload", async () => {
        await runTranscriptionFlow(recording.id);
      }).catch((error) => {
        uploadStatusEl.textContent = `Auto transcribe failed: ${error.message}`;
      });
    }
  } catch (error) {
    uploadStatusEl.textContent = `Upload failed: ${error.message}`;
    if (localId) {
      markLocalRecording(localId, { uploadStatus: "local" });
      loadRecordings();
    }
    promptLocalDownload("Upload failed. The recording is only on this device.");
  }
}

async function uploadManualFile() {
  if (!manualStatusEl || !manualFileEl || !manualUploadBtn) return;
  const file = manualFileEl.files?.[0];
  if (!file) {
    manualStatusEl.textContent = "Please choose an audio file first.";
    return;
  }

  manualUploadBtn.disabled = true;
  manualStatusEl.textContent = "Uploading file...";

  try {
    const title = manualTitleEl?.value?.trim() || file.name.replace(/\.[^/.]+$/, "");
    const recording = await createRecording(title);
    const formData = new FormData();
    formData.append("audio", file, file.name);
    formData.append("title", title);

    const response = await fetch(`${API_BASE}/api/v1/recordings/${recording.id}/upload`, {
      method: "POST",
      body: formData
    });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || "Failed uploading audio");
    }

    manualStatusEl.textContent = `Uploaded: ${recording.id}`;
    manualFileEl.value = "";
    loadRecordings();
    if (autoTranscribeEnabled) {
      manualStatusEl.textContent = `Uploaded: ${recording.id} | queued transcription`;
      enqueueRecordingTask(recording.id, "Auto transcribing upload", async () => {
        await runTranscriptionFlow(recording.id);
      }).catch((error) => {
        manualStatusEl.textContent = `Auto transcribe failed: ${error.message}`;
      });
    }
  } catch (error) {
    manualStatusEl.textContent = `Upload failed: ${error.message}`;
  } finally {
    manualUploadBtn.disabled = false;
  }
}

saveApiBaseBtn.addEventListener("click", () => setApiBase(apiBaseInputEl.value));
useEmulatorBtn.addEventListener("click", () => setApiBase("http://10.0.2.2:8080"));
useLocalhostBtn.addEventListener("click", () => setApiBase("http://localhost:8080"));
usePromptBtn.addEventListener("click", () => {
  const value = prompt("Enter API URL (example: http://192.168.1.85:8080)", API_BASE);
  if (value) setApiBase(value);
});

refreshHealthBtn.addEventListener("click", checkHealth);
createRecordingBtn.addEventListener("click", () => createRecording());
queueTranscriptionBtn.addEventListener("click", queueTranscription);
if (saveAiSettingsBtn) {
  saveAiSettingsBtn.addEventListener("click", saveAiSettings);
}
if (resetAiSettingsBtn) {
  resetAiSettingsBtn.addEventListener("click", resetAiSettings);
}
if (autoTranscribeToggleEl) {
  autoTranscribeToggleEl.addEventListener("change", () => {
    autoTranscribeEnabled = Boolean(autoTranscribeToggleEl.checked);
    localStorage.setItem(AUTO_TRANSCRIBE_KEY, String(autoTranscribeEnabled));
    renderAiSettings();
  });
}
if (autoSummarizeToggleEl) {
  autoSummarizeToggleEl.addEventListener("change", () => {
    autoSummarizeEnabled = Boolean(autoSummarizeToggleEl.checked);
    localStorage.setItem(AUTO_SUMMARIZE_KEY, String(autoSummarizeEnabled));
    renderAiSettings();
  });
}

if (themeToggleBtn) {
  applyTheme(getPreferredTheme());
  themeToggleBtn.addEventListener("click", () => {
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

if (uploadToggleEl) {
  updateUploadToggle(uploadEnabled);
  uploadToggleEl.addEventListener("change", (event) => {
    updateUploadToggle(event.target.checked);
  });
}

if (recordStartBtn && recordStopBtn && recordDownloadBtn) {
  const supported = Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  setRecordingUiState({
    message: supported ? "Ready to record." : "Audio recording is not supported in this browser.",
    startDisabled: !supported,
    stopDisabled: true,
    downloadDisabled: true,
    isRecording: false
  });
  recordStartBtn.addEventListener("click", startRecording);
  recordStopBtn.addEventListener("click", stopRecording);
  recordDownloadBtn.addEventListener("click", downloadRecording);
}

if (micEnableBtn) {
  micEnableBtn.addEventListener("click", requestMicrophonePermission);
}

if (refreshRecordingsBtn) {
  refreshRecordingsBtn.addEventListener("click", loadRecordings);
}

if (createBackupBtn) {
  createBackupBtn.addEventListener("click", createBackup);
}

if (manualUploadBtn) {
  manualUploadBtn.addEventListener("click", uploadManualFile);
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
});

renderApiBase();
renderAiSettings();
(async () => {
  await ensureReachableApiBase();
  await checkHealth();
  await loadVersion();
  await loadRecordings();
  await loadBackups();
  setActiveTab(localStorage.getItem(TAB_KEY) || "record");
})();





