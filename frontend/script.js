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
const recordingTitleEl = document.getElementById("recordingTitle");
const recordingIdEl = document.getElementById("recordingId");
const recordingResultEl = document.getElementById("recordingResult");
const jobResultEl = document.getElementById("jobResult");
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

const localRecordings = new Map();
const summaryCache = new Map();
const recordingUiState = new Map();

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

function buildLoadingBar(label) {
  const wrap = document.createElement("div");
  wrap.className = "loading-wrap";
  const text = document.createElement("div");
  text.className = "loading-label";
  text.textContent = label;
  const bar = document.createElement("div");
  bar.className = "loading-bar";
  wrap.appendChild(text);
  wrap.appendChild(bar);
  return wrap;
}

async function getSummaryPreview(recordingId) {
  if (summaryCache.has(recordingId)) return summaryCache.get(recordingId);

  const listResponse = await fetch(`${API_BASE}/api/v1/recordings/${recordingId}/summaries?limit=1`);
  const isJson = listResponse.headers.get("content-type")?.includes("application/json");
  const listPayload = isJson ? await listResponse.json() : await listResponse.text();
  if (listResponse.ok && listPayload?.summaries?.length) {
    const summary = listPayload.summaries[0];
    summaryCache.set(recordingId, summary.markdown);
    return summary.markdown;
  }

  const createResponse = await fetch(`${API_BASE}/api/v1/recordings/${recordingId}/summaries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: DEFAULT_SUMMARY_PROVIDER,
      model: DEFAULT_SUMMARY_MODEL,
      template: "default"
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
    const response = await fetch(`${API_BASE}/api/v1/recordings?limit=50`);
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
      summaryOption.textContent = "AI Summary";
      previewSelect.appendChild(summaryOption);

      const hideOption = document.createElement("option");
      hideOption.value = "none";
      hideOption.textContent = "Hide preview";
      previewSelect.appendChild(hideOption);

      actions.appendChild(previewSelect);

      if (recording.metadata?.audio?.fileName) {
        const downloadBtn = document.createElement("button");
        downloadBtn.type = "button";
        downloadBtn.textContent = "Download audio";
        downloadBtn.addEventListener("click", async () => {
          updateRecordingUiState(recording.id, { downloading: true });
          loadRecordings();
          try {
            const response = await fetch(`${API_BASE}/api/v1/recordings/${recording.id}/file`);
            if (!response.ok) throw new Error(`Download failed (${response.status})`);
            const blob = await response.blob();
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
      transcribeBtn.disabled = uiState.transcribing;
      transcribeBtn.addEventListener("click", async () => {
        updateRecordingUiState(recording.id, { transcribing: true });
        loadRecordings();
        try {
          const response = await fetch(`${API_BASE}/api/v1/recordings/${recording.id}/transcribe`, {
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
          setTimeout(() => {
            loadRecordings();
          }, 2200);
        } catch (error) {
          alert(`Transcription failed: ${error.message}`);
        } finally {
          updateRecordingUiState(recording.id, { transcribing: false });
          loadRecordings();
        }
      });
      actions.appendChild(transcribeBtn);

      const preview = document.createElement("div");
      preview.className = "recording-preview";
      preview.hidden = true;
      const previewTitle = document.createElement("div");
      previewTitle.textContent = "Transcript preview";
      const previewBody = document.createElement("pre");
      previewBody.textContent = "";
      preview.appendChild(previewTitle);
      preview.appendChild(previewBody);

      previewSelect.addEventListener("change", async (event) => {
        const value = event.target.value;
        if (!value || value === "none") {
          preview.hidden = true;
          return;
        }

        preview.hidden = false;
        if (value === "transcript") {
          previewTitle.textContent = "Transcription preview";
          if (recording.metadata?.transcript?.text) {
            previewBody.textContent = recording.metadata.transcript.text;
          } else {
            previewBody.textContent = "No transcript available yet. Click Transcribe first.";
          }
          return;
        }

        previewTitle.textContent = "Transcript preview (AI summary)";
        updateRecordingUiState(recording.id, { summarizing: true });
        loadRecordings();
        previewBody.textContent = "Loading preview...";
        try {
          const markdown = await getSummaryPreview(recording.id);
          previewBody.textContent = markdown;
        } catch (error) {
          previewBody.textContent = `Preview failed: ${error.message}`;
        } finally {
          updateRecordingUiState(recording.id, { summarizing: false });
          loadRecordings();
        }
      });

      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(actions);
      if (uiState.downloading) {
        item.appendChild(buildLoadingBar("Downloading..."));
      }
      if (uiState.transcribing) {
        item.appendChild(buildLoadingBar("Transcribing..."));
      }
      if (uiState.summarizing) {
        item.appendChild(buildLoadingBar("Summarizing..."));
      }
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
      markLocalRecording(localId, { uploadStatus: "cloud", cloudId: recording.id });
    }
    loadRecordings();
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

if (manualUploadBtn) {
  manualUploadBtn.addEventListener("click", uploadManualFile);
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
});

renderApiBase();
(async () => {
  await ensureReachableApiBase();
  await checkHealth();
  await loadVersion();
  await loadRecordings();
  setActiveTab(localStorage.getItem(TAB_KEY) || "record");
})();





