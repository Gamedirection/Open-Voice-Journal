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
  loadRecordings();
  return true;
}

function renderApiBase() {
  apiBaseInputEl.value = API_BASE;
  apiBaseLabelEl.textContent = `Using API: ${API_BASE} | page=${window.location.origin || window.location.protocol}`;
}

async function checkHealth() {
  apiStatusEl.textContent = "Checking API...";
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();
    apiStatusEl.textContent = `${data.status} (db: ${data.db})`;
  } catch (error) {
    apiStatusEl.textContent = `API unreachable: ${error.message}`;
  }
}

async function createRecording(titleOverride) {
  recordingResultEl.textContent = "Creating...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/recordings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleOverride || recordingTitleEl.value || "Test memo from app" })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed creating recording");

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
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed loading recordings");

    if (!data.length) {
      recordingsListEl.textContent = "No recordings yet.";
      return;
    }

    recordingsListEl.innerHTML = "";
    data.forEach((recording) => {
      const item = document.createElement("div");
      item.className = "recording-item";

      const title = document.createElement("div");
      title.textContent = recording.title;

      const meta = document.createElement("div");
      meta.className = "recording-meta";
      meta.textContent = `${recording.id} • ${recording.status}`;

      item.appendChild(title);
      item.appendChild(meta);

      if (recording.metadata?.audio?.fileName) {
        const link = document.createElement("a");
        link.href = `${API_BASE}/api/v1/recordings/${recording.id}/file`;
        link.textContent = "Download audio";
        link.target = "_blank";
        item.appendChild(link);
      }

      recordingsListEl.appendChild(item);
    });
  } catch (error) {
    recordingsListEl.textContent = `Error loading recordings: ${error.message}`;
  }
}

let mediaRecorder = null;
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
    recordedChunks = [];
    setupVisualizer(stream);

    const mimeType = pickRecordingMimeType();
    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) recordedChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", () => {
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = URL.createObjectURL(blob);
      recordPlaybackEl.src = downloadUrl;
      recordPlaybackEl.load();

      const title = recordingTitleEl?.value?.trim() || "ovj_recording";
      recordDownloadBtn.dataset.filename = `${sanitizeFilename(title)}.${getFileExtension(blob.type)}`;

      setRecordingUiState({
        message: "Recording ready.",
        startDisabled: false,
        stopDisabled: true,
        downloadDisabled: false,
        isRecording: false
      });

      if (uploadEnabled) {
        uploadRecording(blob, title);
      }
    });

    mediaRecorder.start();
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
  if (!mediaRecorder) return;
  mediaRecorder.stop();
  mediaRecorder.stream.getTracks().forEach((track) => track.stop());
  mediaRecorder = null;
  clearInterval(recordingTimer);
  recordingTimer = null;
  recordingStartedAt = null;
  stopVisualizer();
}

function downloadRecording() {
  if (!downloadUrl) return;
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = recordDownloadBtn.dataset.filename || "ovj_recording.webm";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function uploadRecording(blob, title) {
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
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed uploading audio");

    uploadStatusEl.textContent = `Uploaded: ${recording.id}`;
    loadRecordings();
  } catch (error) {
    uploadStatusEl.textContent = `Upload failed: ${error.message}`;
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
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed uploading audio");

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
checkHealth();
loadRecordings();
setActiveTab(localStorage.getItem(TAB_KEY) || "record");
