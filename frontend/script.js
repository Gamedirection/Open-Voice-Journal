function resolveApiBase() {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  if (protocol === "file:") {
    return "http://10.0.2.2:8080";
  }

  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:8080";
  }

  return `http://${hostname}:8080`;
}

const API_BASE = resolveApiBase();

const apiStatusEl = document.getElementById("apiStatus");
const refreshHealthBtn = document.getElementById("refreshHealth");
const createRecordingBtn = document.getElementById("createRecording");
const queueTranscriptionBtn = document.getElementById("queueTranscription");
const recordingTitleEl = document.getElementById("recordingTitle");
const recordingIdEl = document.getElementById("recordingId");
const recordingResultEl = document.getElementById("recordingResult");
const jobResultEl = document.getElementById("jobResult");

async function checkHealth() {
  apiStatusEl.textContent = "Checking API...";
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();
    apiStatusEl.textContent = `${data.status} (db: ${data.db}) via ${API_BASE}`;
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

refreshHealthBtn.addEventListener("click", checkHealth);
createRecordingBtn.addEventListener("click", createRecording);
queueTranscriptionBtn.addEventListener("click", queueTranscription);

checkHealth();
