function resolveDefaultApiBase() {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const isCapacitor = Boolean(window.Capacitor);

  if (isCapacitor) {
    return "http://192.168.1.85:8080";
  }

  if (protocol === "file:") {
    return "http://10.0.2.2:8080";
  }

  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8080";
  }

  return `http://${hostname}:8080`;
}

function normalizeBaseUrl(value) {
  return value.trim().replace(/\/$/, "");
}

const SAVED_API_KEY = "ovj_api_base";
let API_BASE = localStorage.getItem(SAVED_API_KEY) || resolveDefaultApiBase();
API_BASE = normalizeBaseUrl(API_BASE);

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

async function createRecording() {
  recordingResultEl.textContent = "Creating...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/recordings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: recordingTitleEl.value || "Test memo from app" })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed creating recording");

    recordingIdEl.value = data.id;
    recordingResultEl.textContent = `Created: ${data.id}`;
  } catch (error) {
    recordingResultEl.textContent = `Error: ${error.message}`;
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

saveApiBaseBtn.addEventListener("click", () => setApiBase(apiBaseInputEl.value));
useEmulatorBtn.addEventListener("click", () => setApiBase("http://10.0.2.2:8080"));
useLocalhostBtn.addEventListener("click", () => setApiBase("http://localhost:8080"));
usePromptBtn.addEventListener("click", () => {
  const value = prompt("Enter API URL (example: http://192.168.1.85:8080)", API_BASE);
  if (value) setApiBase(value);
});

refreshHealthBtn.addEventListener("click", checkHealth);
createRecordingBtn.addEventListener("click", createRecording);
queueTranscriptionBtn.addEventListener("click", queueTranscription);

renderApiBase();
checkHealth();
