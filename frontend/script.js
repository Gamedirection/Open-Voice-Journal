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

function normalizeRequestUrl(url) {
  const raw = String(url || "");
  if (!raw) return raw;
  if (raw.includes("/api/api/")) {
    return raw.replace("/api/api/", "/api/");
  }
  return raw;
}

const SAVED_API_KEY = "ovj_api_base";
const THEME_KEY = "ovj_theme";
const UPLOAD_KEY = "ovj_upload_enabled";
const LIVE_CAPTIONS_KEY = "ovj_live_captions_enabled";
const GPS_LOCATION_KEY = "ovj_gps_location_enabled";
const DEBUG_TRANSCRIPT_TIMESTAMPS_KEY = "ovj_debug_transcript_timestamps";
const TAB_KEY = "ovj_active_tab";
const AUTO_TRANSCRIBE_KEY = "ovj_auto_transcribe";
const AUTO_SUMMARIZE_KEY = "ovj_auto_summarize";
const IDENTIFY_VOICES_KEY = "ovj_identify_voices";
const SUMMARY_PROVIDER_KEY = "ovj_summary_provider";
const SUMMARY_MODEL_KEY = "ovj_summary_model";
const SUMMARY_API_KEY_KEY = "ovj_summary_api_key";
const SUMMARY_TEMPLATE_KEY = "ovj_summary_template";
const TIME_ZONE_KEY = "ovj_time_zone";
const DEAD_AIR_THRESHOLD_KEY = "ovj_dead_air_threshold_seconds";
const PLAYBACK_META_KEY_PREFIX = "ovj_playback_meta_v1_";
const AUTH_TOKEN_KEY = "ovj_auth_token";

let API_BASE = localStorage.getItem(SAVED_API_KEY) || resolveDefaultApiBase();
API_BASE = normalizeBaseUrl(API_BASE);

let currentTheme = localStorage.getItem(THEME_KEY);
let uploadEnabled = localStorage.getItem(UPLOAD_KEY);
uploadEnabled = uploadEnabled === null ? true : uploadEnabled === "true";
let liveCaptionsEnabled = localStorage.getItem(LIVE_CAPTIONS_KEY);
liveCaptionsEnabled = liveCaptionsEnabled === null ? true : liveCaptionsEnabled === "true";
let gpsLocationEnabled = localStorage.getItem(GPS_LOCATION_KEY);
gpsLocationEnabled = gpsLocationEnabled === null ? false : gpsLocationEnabled === "true";
let debugTranscriptTimestampsEnabled = localStorage.getItem(DEBUG_TRANSCRIPT_TIMESTAMPS_KEY);
debugTranscriptTimestampsEnabled = debugTranscriptTimestampsEnabled === null ? true : debugTranscriptTimestampsEnabled === "true";

const apiBaseInputEl = document.getElementById("apiBaseInput");
const saveApiBaseBtn = document.getElementById("saveApiBase");
const useEmulatorBtn = document.getElementById("useEmulator");
const useLocalhostBtn = document.getElementById("useLocalhost");
const usePromptBtn = document.getElementById("usePrompt");
const mobileApiBaseInputEl = document.getElementById("mobileApiBaseInput");
const mobileSaveApiBaseBtn = document.getElementById("mobileSaveApiBase");
const mobileUsePromptBtn = document.getElementById("mobileUsePrompt");
const mobileApiBaseStatusEl = document.getElementById("mobileApiBaseStatus");
const apiBaseLabelEl = document.getElementById("apiBaseLabel");
const apiStatusEl = document.getElementById("apiStatus");
const refreshHealthBtn = document.getElementById("refreshHealth");
const createRecordingBtn = document.getElementById("createRecording");
const queueTranscriptionBtn = document.getElementById("queueTranscription");
const createBackupBtn = document.getElementById("createBackup");
const autoTranscribeToggleEl = document.getElementById("autoTranscribeToggle");
const autoSummarizeToggleEl = document.getElementById("autoSummarizeToggle");
const identifyVoicesToggleEl = document.getElementById("identifyVoicesToggle");
const summaryProviderEl = document.getElementById("summaryProvider");
const summaryModelEl = document.getElementById("summaryModel");
const summaryApiKeyEl = document.getElementById("summaryApiKey");
const summaryPromptEl = document.getElementById("summaryPrompt");
const summaryPromptDefaultEl = document.getElementById("summaryPromptDefault");
const saveAiSettingsBtn = document.getElementById("saveAiSettings");
const resetAiSettingsBtn = document.getElementById("resetAiSettings");
const aiSettingsStatusEl = document.getElementById("aiSettingsStatus");
const recordingTitleEl = document.getElementById("recordingTitle");
const timeZoneInputEl = document.getElementById("timeZoneInput");
const saveTimeZoneBtn = document.getElementById("saveTimeZone");
const useSystemTimeZoneBtn = document.getElementById("useSystemTimeZone");
const timeZoneStatusEl = document.getElementById("timeZoneStatus");
const deadAirThresholdInputEl = document.getElementById("deadAirThresholdSeconds");
const saveDeadAirThresholdBtn = document.getElementById("saveDeadAirThreshold");
const deadAirThresholdStatusEl = document.getElementById("deadAirThresholdStatus");
const recordingIdEl = document.getElementById("recordingId");
const recordingResultEl = document.getElementById("recordingResult");
const jobResultEl = document.getElementById("jobResult");
const backupStatusEl = document.getElementById("backupStatus");
const backupListEl = document.getElementById("backupList");
const themeToggleBtn = document.getElementById("themeToggle");
const uploadToggleEl = document.getElementById("uploadToggle");
const liveCaptionsToggleEl = document.getElementById("liveCaptionsToggle");
const gpsLocationToggleEl = document.getElementById("gpsLocationToggle");
const debugTranscriptTimestampsToggleEl = document.getElementById("debugTranscriptTimestampsToggle");
const recordStartBtn = document.getElementById("recordStart");
const recordStopBtn = document.getElementById("recordStop");
const recordStatusEl = document.getElementById("recordStatus");
const liveCaptionsPanelEl = document.getElementById("liveCaptionsPanel");
const liveCaptionsStatusEl = document.getElementById("liveCaptionsStatus");
const liveCaptionsTextEl = document.getElementById("liveCaptionsText");
const uploadStatusEl = document.getElementById("uploadStatus");
const permissionStatusEl = document.getElementById("permissionStatus");
const manualTitleEl = document.getElementById("manualTitle");
const manualFileEl = document.getElementById("manualFile");
const manualUploadBtn = document.getElementById("manualUpload");
const manualStatusEl = document.getElementById("manualStatus");
const micEnableBtn = document.getElementById("micEnable");
const recordingsListEl = document.getElementById("recordingsList");
const recordingsSearchEl = document.getElementById("recordingsSearch");
const refreshRecordingsBtn = document.getElementById("refreshRecordings");
const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
const visualizerCanvas = document.getElementById("recordVisualizer");
const projectVersionEl = document.getElementById("projectVersion");
const docsVersionEl = document.getElementById("docsVersion");
const docsSwaggerLinkEl = document.getElementById("docsSwaggerLink");
const docsOpenApiLinkEl = document.getElementById("docsOpenApiLink");
const brandLogoEl = document.getElementById("brandLogo");
const authEmailEl = document.getElementById("authEmail");
const authPasswordEl = document.getElementById("authPassword");
const authRegisterNameEl = document.getElementById("authRegisterName");
const authRegisterEmailEl = document.getElementById("authRegisterEmail");
const authRegisterPasswordEl = document.getElementById("authRegisterPassword");
const authRegisterBtn = document.getElementById("authRegister");
const authLoginBtn = document.getElementById("authLogin");
const authLogoutBtn = document.getElementById("authLogout");
const authLoginRowEl = document.getElementById("authLoginRow");
const authLogoutRowEl = document.getElementById("authLogoutRow");
const authChangePasswordGroupEl = document.getElementById("authChangePasswordGroup");
const authCurrentPasswordEl = document.getElementById("authCurrentPassword");
const authNewPasswordEl = document.getElementById("authNewPassword");
const authChangePasswordBtn = document.getElementById("authChangePassword");
const authResetEmailEl = document.getElementById("authResetEmail");
const authForgotPasswordBtn = document.getElementById("authForgotPassword");
const authStatusEl = document.getElementById("authStatus");
const adminUsersCardEl = document.getElementById("adminUsersCard");
const apiConnectionsCardEl = document.getElementById("apiConnectionsCard");
const serverBackupCardEl = document.getElementById("serverBackupCard");
const adminUsersQueryEl = document.getElementById("adminUsersQuery");
const adminUsersStatusEl = document.getElementById("adminUsersStatus");
const adminUsersRoleEl = document.getElementById("adminUsersRole");
const adminUsersSortEl = document.getElementById("adminUsersSort");
const adminUsersRefreshBtn = document.getElementById("adminUsersRefresh");
const adminUsersStatusTextEl = document.getElementById("adminUsersStatusText");
const adminUsersTableBodyEl = document.getElementById("adminUsersTableBody");
const openSignupToggleEl = document.getElementById("openSignupToggle");
const saveOpenSignupBtn = document.getElementById("saveOpenSignup");
const openSignupStatusEl = document.getElementById("openSignupStatus");
const openApiKeyNameEl = document.getElementById("openApiKeyName");
const createOpenApiKeyBtn = document.getElementById("createOpenApiKey");
const openApiKeyCreateStatusEl = document.getElementById("openApiKeyCreateStatus");
const openApiKeyListEl = document.getElementById("openApiKeyList");
const generalSettingsCardEl = document.getElementById("generalSettingsCard");
const automationCardEl = document.getElementById("automationCard");
const docsCardEl = document.getElementById("docsCard");

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
const playbackControllers = new Map();
const playbackLoaders = new Map();
const transcriptWordRegistry = new Map();

let autoTranscribeEnabled = localStorage.getItem(AUTO_TRANSCRIBE_KEY);
autoTranscribeEnabled = autoTranscribeEnabled === null ? false : autoTranscribeEnabled === "true";
let autoSummarizeEnabled = localStorage.getItem(AUTO_SUMMARIZE_KEY);
autoSummarizeEnabled = autoSummarizeEnabled === null ? false : autoSummarizeEnabled === "true";
let identifyVoicesEnabled = localStorage.getItem(IDENTIFY_VOICES_KEY);
identifyVoicesEnabled = identifyVoicesEnabled === null ? false : identifyVoicesEnabled === "true";
let summaryProvider = localStorage.getItem(SUMMARY_PROVIDER_KEY) || DEFAULT_SUMMARY_PROVIDER;
let summaryModel = localStorage.getItem(SUMMARY_MODEL_KEY) || DEFAULT_SUMMARY_MODEL;
let summaryApiKey = localStorage.getItem(SUMMARY_API_KEY_KEY) || "";
let summaryTemplate = localStorage.getItem(SUMMARY_TEMPLATE_KEY) || DEFAULT_SUMMARY_TEMPLATE;
let preferredTimeZone = localStorage.getItem(TIME_ZONE_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const parsedDeadAirThreshold = Number(localStorage.getItem(DEAD_AIR_THRESHOLD_KEY));
let deadAirThresholdSeconds = Number.isFinite(parsedDeadAirThreshold) && parsedDeadAirThreshold > 0
  ? parsedDeadAirThreshold
  : 1.5;
let lastAutoRecordingTitle = "";
let cloudRecordings = [];
let cloudOffset = 0;
let cloudHasMore = true;
let cloudLoading = false;
let cloudQuery = "";
let recordingsScrollTicking = false;
let authToken = localStorage.getItem(AUTH_TOKEN_KEY) || "";
let authUser = null;
const CLOUD_PAGE_SIZE = 25;
const SCROLL_LOAD_THRESHOLD_PX = 1000;
const nativeFetch = window.fetch.bind(window);

function shouldAttachAuth(url) {
  const target = normalizeRequestUrl(String(url || ""));
  if (!authToken) return false;
  if (target.startsWith(`${API_BASE}/api/`)) return true;
  if (target.startsWith("/api/")) return true;
  return false;
}

window.fetch = async (input, init = {}) => {
  const url = normalizeRequestUrl(typeof input === "string" ? input : (input?.url || ""));
  const normalizedInput = typeof input === "string"
    ? url
    : (input instanceof Request ? new Request(url, input) : input);
  const nextInit = { ...init };
  const headers = new Headers(nextInit.headers || {});
  if (shouldAttachAuth(url) && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  nextInit.headers = headers;
  const response = await nativeFetch(normalizedInput, nextInit);
  if (response.status === 401 && shouldAttachAuth(url)) {
    setAuthState("", null);
  }
  return response;
};

async function readResponsePayload(response) {
  const text = await response.text();
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  const looksJson = contentType.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("[");
  if (looksJson) {
    try {
      return JSON.parse(text);
    } catch (_error) {
      // fall through
    }
  }
  return text;
}

function getApiErrorMessage(response, payload, fallback) {
  if (payload && typeof payload === "object" && payload.error) {
    return `${payload.error} (${response.status})`;
  }
  if (typeof payload === "string" && payload.trim()) {
    const trimmed = payload.trim().slice(0, 160);
    return `${trimmed} (${response.status})`;
  }
  return `${fallback} (${response.status})`;
}

function getMobileApkTag() {
  try {
    const capacitor = window.Capacitor;
    if (!capacitor) return null;
    const platform = typeof capacitor.getPlatform === "function" ? capacitor.getPlatform() : "";
    const isNative = typeof capacitor.isNativePlatform === "function"
      ? capacitor.isNativePlatform()
      : Boolean(platform && platform !== "web");
    if (platform === "android" || (isNative && /android/i.test(navigator.userAgent))) {
      return "mobile";
    }
  } catch (_error) {
    // Ignore platform detection errors.
  }
  return null;
}

async function getPermissionState(name) {
  if (!navigator.permissions || typeof navigator.permissions.query !== "function") return "unknown";
  try {
    const status = await navigator.permissions.query({ name });
    return String(status?.state || "unknown");
  } catch (_error) {
    return "unknown";
  }
}

function isAllowedPermissionState(state) {
  return state === "granted";
}

async function updatePermissionStatus() {
  if (!permissionStatusEl) return;
  const [micState, gpsState] = await Promise.all([
    getPermissionState("microphone"),
    getPermissionState("geolocation")
  ]);
  const micLabel = isAllowedPermissionState(micState)
    ? "Microphone Permissions Allowed"
    : "Microphone Permissions Not Allowed";
  const gpsAllowed = gpsLocationEnabled && isAllowedPermissionState(gpsState);
  const gpsLabel = gpsAllowed
    ? "GPS Locations Allowed"
    : "GPS Locations Not Allowed";
  permissionStatusEl.textContent = `${micLabel} | ${gpsLabel}`;
}

function buildGpsLocationPayload(position) {
  if (!position || !position.coords) return null;
  const coords = position.coords;
  const payload = {
    latitude: Number(coords.latitude),
    longitude: Number(coords.longitude),
    accuracyMeters: Number(coords.accuracy),
    capturedAt: new Date(position.timestamp || Date.now()).toISOString(),
    provider: "geolocation"
  };
  if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) return null;
  if (!Number.isFinite(payload.accuracyMeters)) delete payload.accuracyMeters;
  if (Number.isFinite(coords.altitude)) payload.altitude = Number(coords.altitude);
  if (Number.isFinite(coords.altitudeAccuracy)) payload.altitudeAccuracy = Number(coords.altitudeAccuracy);
  if (Number.isFinite(coords.heading)) payload.heading = Number(coords.heading);
  if (Number.isFinite(coords.speed)) payload.speed = Number(coords.speed);
  return payload;
}

async function getGpsLocationMetadata() {
  if (!gpsLocationEnabled || !navigator.geolocation) return null;
  return await new Promise((resolve) => {
    let resolved = false;
    const finish = (value) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };
    const timeoutMs = 5000;
    const timer = setTimeout(() => finish(null), timeoutMs + 250);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer);
        finish(buildGpsLocationPayload(position));
      },
      () => {
        clearTimeout(timer);
        finish(null);
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 15000
      }
    );
  });
}

function normalizeCityTag(value) {
  const clean = String(value || "")
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ");
  if (!clean) return null;
  return clean.length > 40 ? clean.slice(0, 40).trim() : clean;
}

async function getNearestCityTagFromLocation(gpsLocation) {
  if (!gpsLocation || !Number.isFinite(Number(gpsLocation.latitude)) || !Number.isFinite(Number(gpsLocation.longitude))) {
    return null;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const lat = Number(gpsLocation.latitude);
    const lon = Number(gpsLocation.longitude);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`,
      {
        headers: {
          Accept: "application/json"
        },
        signal: controller.signal
      }
    );
    if (!response.ok) return null;
    const payload = await response.json();
    const address = payload?.address || {};
    const city = address.city || address.town || address.village || address.hamlet || address.county || "";
    const normalized = normalizeCityTag(city);
    return normalized || null;
  } catch (_error) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function setAuthState(token, user) {
  authToken = String(token || "");
  authUser = user || null;
  if (!authUser) {
    cloudRecordings = [];
    cloudOffset = 0;
    cloudHasMore = false;
  }
  if (authToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, authToken);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
  if (authStatusEl) {
    if (authUser) {
      authStatusEl.textContent = `Logged in as ${authUser.email} (${authUser.role})`;
    } else {
      authStatusEl.textContent = "Not logged in.";
    }
  }
  applyAdminVisibility();
  applySettingsVisibility();
  renderUploadModeStatus();
}

function isAdminSession() {
  return Boolean(authUser && authUser.role === "admin");
}

function applyAdminVisibility() {
  const show = isAdminSession();
  if (adminUsersCardEl) adminUsersCardEl.hidden = !show;
  if (apiConnectionsCardEl) apiConnectionsCardEl.hidden = !show;
  if (serverBackupCardEl) serverBackupCardEl.hidden = !show;
}

function applySettingsVisibility() {
  const loggedIn = Boolean(authUser);
  if (authLoginRowEl) authLoginRowEl.hidden = loggedIn;
  if (authLogoutRowEl) authLogoutRowEl.hidden = !loggedIn;
  if (authChangePasswordGroupEl) authChangePasswordGroupEl.hidden = !loggedIn;
  if (generalSettingsCardEl) generalSettingsCardEl.hidden = !loggedIn;
  if (automationCardEl) automationCardEl.hidden = !loggedIn;
  if (docsCardEl) docsCardEl.hidden = !loggedIn;
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function createLocalRecording({ title, blob, downloadUrl, createdAt, durationSeconds = 0, captionAnchors = [] }) {
  const id = `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const entry = {
    id,
    title,
    status: "local",
    createdAt: createdAt || new Date().toISOString(),
    blob,
    downloadUrl,
    durationSeconds: Number.isFinite(Number(durationSeconds)) ? Number(durationSeconds) : 0,
    captionAnchors: Array.isArray(captionAnchors) ? captionAnchors : [],
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
  return date.toLocaleString(undefined, { timeZone: preferredTimeZone });
}

function validateTimeZone(value) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch (_error) {
    return false;
  }
}

function buildDefaultRecordingTitle(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: preferredTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return `Recording ${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function applyDefaultRecordingTitle(force = false) {
  if (!recordingTitleEl) return;
  const current = recordingTitleEl.value.trim();
  if (!force && current && current !== lastAutoRecordingTitle) return;
  const next = buildDefaultRecordingTitle();
  recordingTitleEl.value = next;
  lastAutoRecordingTitle = next;
}

function renderTimeZoneSettings() {
  if (timeZoneInputEl) timeZoneInputEl.value = preferredTimeZone;
  if (timeZoneStatusEl) {
    timeZoneStatusEl.textContent = `Default recording title time zone: ${preferredTimeZone}`;
  }
}

function sanitizeDeadAirThresholdSeconds(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return deadAirThresholdSeconds;
  return Math.min(10, Math.max(0.3, parsed));
}

function renderDeadAirSettings() {
  deadAirThresholdSeconds = sanitizeDeadAirThresholdSeconds(deadAirThresholdSeconds);
  if (deadAirThresholdInputEl) {
    deadAirThresholdInputEl.value = String(deadAirThresholdSeconds);
  }
  if (deadAirThresholdStatusEl) {
    deadAirThresholdStatusEl.textContent = `Silence runs >= ${deadAirThresholdSeconds.toFixed(1)}s will be removed.`;
  }
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
  if (identifyVoicesToggleEl) identifyVoicesToggleEl.checked = identifyVoicesEnabled;
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
  identifyVoicesEnabled = Boolean(identifyVoicesToggleEl?.checked);

  localStorage.setItem(SUMMARY_PROVIDER_KEY, summaryProvider);
  localStorage.setItem(SUMMARY_MODEL_KEY, summaryModel);
  localStorage.setItem(SUMMARY_API_KEY_KEY, summaryApiKey);
  localStorage.setItem(SUMMARY_TEMPLATE_KEY, summaryTemplate);
  localStorage.setItem(AUTO_TRANSCRIBE_KEY, String(autoTranscribeEnabled));
  localStorage.setItem(AUTO_SUMMARIZE_KEY, String(autoSummarizeEnabled));
  localStorage.setItem(IDENTIFY_VOICES_KEY, String(identifyVoicesEnabled));

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
  identifyVoicesEnabled = false;

  localStorage.setItem(SUMMARY_PROVIDER_KEY, summaryProvider);
  localStorage.setItem(SUMMARY_MODEL_KEY, summaryModel);
  localStorage.setItem(SUMMARY_API_KEY_KEY, summaryApiKey);
  localStorage.setItem(SUMMARY_TEMPLATE_KEY, summaryTemplate);
  localStorage.setItem(AUTO_TRANSCRIBE_KEY, String(autoTranscribeEnabled));
  localStorage.setItem(AUTO_SUMMARIZE_KEY, String(autoSummarizeEnabled));
  localStorage.setItem(IDENTIFY_VOICES_KEY, String(identifyVoicesEnabled));
  renderAiSettings();
  if (aiSettingsStatusEl) aiSettingsStatusEl.textContent = "AI settings restored to defaults.";
}

function buildTranscriptMarkdown(recording) {
  const transcriptText = buildFormattedTranscriptText(recording);
  return [
    `# Transcript - ${recording.title}`,
    "",
    `- Recording ID: ${recording.id}`,
    `- Generated: ${new Date().toISOString()}`,
    "",
    transcriptText
  ].join("\n");
}

function buildFormattedTranscriptText(recording) {
  const transcriptText = recording.metadata?.transcript?.text || "No transcript available.";
  const segments = Array.isArray(recording.metadata?.transcript?.segments)
    ? recording.metadata.transcript.segments
    : [];
  if (!segments.length) return transcriptText;
  const speakerLabels = recording.metadata?.speakers?.labels || {};
  return segments
    .map((seg) => {
      const speakerId = seg?.speakerId;
      const speaker = speakerLabels[speakerId] || speakerId || "Speaker";
      const text = String(seg?.text || "").trim();
      return text ? `**${speaker}:** ${text}` : `**${speaker}:**`;
    })
    .join("\n\n");
}

const SPEAKER_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#7c3aed", "#ea580c", "#0891b2", "#be123c"];

function getSpeakerColor(speakerId) {
  let hash = 0;
  for (let i = 0; i < String(speakerId || "").length; i += 1) {
    hash = ((hash << 5) - hash) + String(speakerId).charCodeAt(i);
    hash |= 0;
  }
  return SPEAKER_COLORS[Math.abs(hash) % SPEAKER_COLORS.length];
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

function getPlaybackMetaStorageKey(recordingId) {
  return `${PLAYBACK_META_KEY_PREFIX}${recordingId}`;
}

function getCachedPlaybackMeta(recordingId) {
  try {
    const raw = localStorage.getItem(getPlaybackMetaStorageKey(recordingId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (_error) {
    return null;
  }
}

function saveCachedPlaybackMeta(recordingId, patch) {
  if (!recordingId || !patch || typeof patch !== "object") return;
  const current = getCachedPlaybackMeta(recordingId) || {};
  const next = { ...current, ...patch };
  try {
    localStorage.setItem(getPlaybackMetaStorageKey(recordingId), JSON.stringify(next));
  } catch (_error) {
    // Ignore storage limits.
  }
}

async function fetchRecordingAudioBlob(recordingId) {
  const response = await fetch(`${API_BASE}/api/v1/recordings/${recordingId}/file`);
  if (!response.ok) {
    throw new Error(`Audio request failed (${response.status})`);
  }
  return response.blob();
}

function getRecordingAudioUrl(recordingId) {
  return `${API_BASE}/api/v1/recordings/${recordingId}/file`;
}

function getRecordingDurationHint(recording) {
  const durationSeconds = Number(recording?.metadata?.audio?.durationSeconds);
  if (Number.isFinite(durationSeconds) && durationSeconds > 0) return durationSeconds;
  const durationMs = Number(recording?.metadata?.audio?.durationMs);
  if (Number.isFinite(durationMs) && durationMs > 0) return durationMs / 1000;
  const transcript = recording?.metadata?.transcript || {};
  const candidateEnds = [];
  if (Array.isArray(transcript.wordTimings)) {
    transcript.wordTimings.forEach((entry) => {
      const end = Number(entry?.end);
      const start = Number(entry?.start);
      if (Number.isFinite(end) && end > 0) candidateEnds.push(end);
      else if (Number.isFinite(start) && start > 0) candidateEnds.push(start);
    });
  }
  if (Array.isArray(transcript.providerSegments)) {
    transcript.providerSegments.forEach((entry) => {
      const end = Number(entry?.end);
      const start = Number(entry?.start);
      if (Number.isFinite(end) && end > 0) candidateEnds.push(end);
      else if (Number.isFinite(start) && start > 0) candidateEnds.push(start);
    });
  }
  if (Array.isArray(transcript.segments)) {
    transcript.segments.forEach((entry) => {
      const end = Number(entry?.end);
      const start = Number(entry?.start);
      if (Number.isFinite(end) && end > 0) candidateEnds.push(end);
      else if (Number.isFinite(start) && start > 0) candidateEnds.push(start);
    });
  }
  if (candidateEnds.length) {
    return Math.max(...candidateEnds);
  }
  return 0;
}

function getRecordingWaveformPeaks(recording) {
  const peaks = recording?.metadata?.audio?.waveformPeaks;
  if (!Array.isArray(peaks)) return [];
  return peaks
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0);
}

function getCaptionAnchors(recording) {
  const raw = recording?.metadata?.audio?.captionAnchors;
  if (!Array.isArray(raw) || !raw.length) return [];
  const normalized = raw
    .map((entry) => ({
      text: String(entry?.text || "").trim(),
      at: Number(entry?.at)
    }))
    .filter((entry) => entry.text && Number.isFinite(entry.at) && entry.at >= 0)
    .sort((a, b) => a.at - b.at);
  if (!normalized.length) return [];
  const anchors = [];
  let previousEnd = 0;
  normalized.forEach((entry, index) => {
    const nextAt = index < normalized.length - 1 ? normalized[index + 1].at : NaN;
    const end = Number.isFinite(nextAt) && nextAt > entry.at
      ? nextAt
      : (entry.at + 1.2);
    const start = Math.max(0, Math.max(entry.at, previousEnd));
    if (end > start) {
      anchors.push({
        text: entry.text,
        start,
        end
      });
      previousEnd = end;
    }
  });
  return anchors;
}

function injectPauseAnchors(anchors, minGapSeconds = 1.1) {
  if (!Array.isArray(anchors) || anchors.length < 2) return anchors || [];
  const merged = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const current = anchors[i];
    merged.push(current);
    if (i >= anchors.length - 1) continue;
    const next = anchors[i + 1];
    const gap = Number(next.start) - Number(current.end);
    if (Number.isFinite(gap) && gap >= minGapSeconds) {
      merged.push({
        text: "[pause]",
        start: Number(current.end),
        end: Number(next.start)
      });
    }
  }
  return merged;
}

function buildTimedWordsFromCaptionAnchors(recording) {
  const raw = recording?.metadata?.audio?.captionAnchors;
  if (!Array.isArray(raw) || !raw.length) return [];
  const anchors = raw
    .map((entry) => ({
      text: String(entry?.text || "").trim(),
      at: Number(entry?.at)
    }))
    .filter((entry) => entry.text && Number.isFinite(entry.at) && entry.at >= 0)
    .sort((a, b) => a.at - b.at);
  if (!anchors.length) return [];

  const timedWords = [];
  for (let i = 0; i < anchors.length; i += 1) {
    const current = anchors[i];
    const nextAt = i < anchors.length - 1 ? anchors[i + 1].at : NaN;
    const words = String(current.text).split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    const chunkStart = current.at;
    const naturalEnd = chunkStart + Math.max(0.45, words.length * 0.22);
    const chunkEnd = Number.isFinite(nextAt)
      ? Math.max(chunkStart + 0.2, Math.min(nextAt, naturalEnd))
      : naturalEnd;
    const span = Math.max(0.2, chunkEnd - chunkStart);
    words.forEach((word, index) => {
      timedWords.push({
        word,
        start: chunkStart + (span * (index / words.length)),
        end: chunkStart + (span * ((index + 1) / words.length))
      });
    });
    if (Number.isFinite(nextAt) && nextAt - chunkEnd >= 1.1) {
      timedWords.push({
        word: "[pause]",
        start: chunkEnd,
        end: nextAt
      });
    }
  }
  return timedWords;
}

function getCaptionAnchorsFromSentenceAnchors(recording) {
  const anchors = buildSentenceAnchors(recording)
    .map((entry) => ({
      text: String(entry?.text || "").trim(),
      at: Number(entry?.start)
    }))
    .filter((entry) => entry.text && Number.isFinite(entry.at) && entry.at >= 0);
  return anchors.slice(0, 500);
}

async function ensureCaptionAnchorsPersisted(recordingId) {
  if (!recordingId) return;
  const response = await fetch(`${API_BASE}/api/v1/recordings/${recordingId}`);
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload.error;
    throw new Error(message || `Recording lookup failed (${response.status})`);
  }
  const recording = payload;
  const existing = recording?.metadata?.audio?.captionAnchors;
  if (Array.isArray(existing) && existing.length) return;
  const anchors = getCaptionAnchorsFromSentenceAnchors(recording);
  if (!anchors.length) return;
  await saveCaptionAnchors(recordingId, anchors);
}

async function resolveCaptionAnchorsForExport(recording) {
  const existing = getCaptionAnchors(recording);
  if (existing.length) return existing;
  const synthesized = getCaptionAnchorsFromSentenceAnchors(recording);
  if (!synthesized.length) return [];
  if (recording?.id && recording?.metadata?.audio?.fileName) {
    try {
      await saveCaptionAnchors(recording.id, synthesized);
    } catch (_error) {
      // Best-effort persistence; still allow export.
    }
  }
  return synthesized;
}

function formatSrtTimestamp(seconds) {
  const clamped = Math.max(0, Number(seconds) || 0);
  const totalMs = Math.floor(clamped * 1000);
  const ms = String(totalMs % 1000).padStart(3, "0");
  const totalSeconds = Math.floor(totalMs / 1000);
  const sec = String(totalSeconds % 60).padStart(2, "0");
  const totalMinutes = Math.floor(totalSeconds / 60);
  const min = String(totalMinutes % 60).padStart(2, "0");
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  return `${hour}:${min}:${sec},${ms}`;
}

function buildSrtFromAnchors(anchors, durationHintSeconds = 0) {
  if (!Array.isArray(anchors) || !anchors.length) return "";
  const durationHint = Number(durationHintSeconds) > 0 ? Number(durationHintSeconds) : 0;
  const lines = [];
  anchors.forEach((entry, index) => {
    const start = Math.max(0, Number(entry?.at) || 0);
    const next = index < anchors.length - 1 ? Number(anchors[index + 1]?.at) : NaN;
    const end = Number.isFinite(next) && next > start
      ? next
      : Math.min(durationHint || (start + 2), start + 2);
    const text = String(entry?.text || "").trim();
    if (!text) return;
    lines.push(String(lines.length + 1));
    lines.push(`${formatSrtTimestamp(start)} --> ${formatSrtTimestamp(Math.max(start + 0.1, end))}`);
    lines.push(text);
    lines.push("");
  });
  return lines.join("\n").trim();
}

async function saveCaptionAnchors(recordingId, anchors) {
  const response = await fetch(`${API_BASE}/api/v1/recordings/${recordingId}/captions`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anchors })
  });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === "string" ? payload : payload.error;
    throw new Error(message || `Save CC failed (${response.status})`);
  }
  return payload?.recording || null;
}

function getSpeechWindowFromWaveform(recording, durationHintSeconds = 0) {
  const duration = Number(durationHintSeconds) > 0
    ? Number(durationHintSeconds)
    : Number(getRecordingDurationHint(recording));
  const peaks = getRecordingWaveformPeaks(recording);
  if (!(duration > 0) || !peaks.length) return null;
  const maxPeak = Math.max(...peaks, 0);
  const minPeak = Math.min(...peaks, maxPeak);
  if (!(maxPeak > 0)) return null;
  const dynamicThreshold = minPeak + ((maxPeak - minPeak) * 0.18);
  const threshold = Math.max(0.12, dynamicThreshold);
  let firstActive = -1;
  let lastActive = -1;
  peaks.forEach((value, index) => {
    if (value >= threshold) {
      if (firstActive < 0) firstActive = index;
      lastActive = index;
    }
  });
  if (firstActive < 0 || lastActive < 0) return null;
  const bucketSeconds = duration / peaks.length;
  const start = Math.max(0, (firstActive * bucketSeconds) - Math.max(0.12, bucketSeconds * 0.6));
  const end = Math.min(duration, ((lastActive + 1) * bucketSeconds) + Math.max(0.16, bucketSeconds * 0.8));
  if (!(end > start)) return null;
  return { start, end };
}

function mapWaveformFractionToTime(weights, bucketSeconds, startSeconds, fraction) {
  if (!Array.isArray(weights) || !weights.length || !(bucketSeconds > 0)) {
    return Number(startSeconds) || 0;
  }
  const clamped = Math.min(1, Math.max(0, Number(fraction) || 0));
  const totalWeight = weights.reduce((acc, value) => acc + (Number(value) || 0), 0);
  if (!(totalWeight > 0)) {
    return startSeconds + (weights.length * bucketSeconds * clamped);
  }
  const target = totalWeight * clamped;
  let cumulative = 0;
  for (let i = 0; i < weights.length; i += 1) {
    const weight = Math.max(0, Number(weights[i]) || 0);
    const next = cumulative + weight;
    if (target <= next || i === weights.length - 1) {
      const localRatio = weight > 0 ? ((target - cumulative) / weight) : 0;
      return startSeconds + ((i + Math.min(1, Math.max(0, localRatio))) * bucketSeconds);
    }
    cumulative = next;
  }
  return startSeconds + (weights.length * bucketSeconds);
}

function getWaveformWeightedSpeechMap(recording, durationHintSeconds = 0) {
  const duration = Number(durationHintSeconds) > 0
    ? Number(durationHintSeconds)
    : Number(getRecordingDurationHint(recording));
  const peaks = getRecordingWaveformPeaks(recording);
  if (!(duration > 0) || peaks.length < 4) return null;
  const maxPeak = Math.max(...peaks, 0);
  const minPeak = Math.min(...peaks, maxPeak);
  if (!(maxPeak > minPeak)) return null;

  // Keep quiet speech at the tail, but still down-weight silence.
  const lowThreshold = Math.max(0.085, minPeak + ((maxPeak - minPeak) * 0.04));
  let firstActive = -1;
  let lastActive = -1;
  peaks.forEach((value, index) => {
    if (value >= lowThreshold) {
      if (firstActive < 0) firstActive = index;
      lastActive = index;
    }
  });
  if (firstActive < 0 || lastActive < 0 || lastActive <= firstActive) return null;

  const bucketSeconds = duration / peaks.length;
  const weights = [];
  for (let i = firstActive; i <= lastActive; i += 1) {
    const peak = peaks[i];
    const voiced = Math.max(0, peak - lowThreshold);
    // Baseline keeps timing monotonic through pauses; voiced energy pulls more words to speech.
    weights.push(0.08 + (voiced * 4.5));
  }
  const startSeconds = firstActive * bucketSeconds;
  return {
    startSeconds,
    bucketSeconds,
    weights,
    mapFraction: (fraction) => mapWaveformFractionToTime(weights, bucketSeconds, startSeconds, fraction)
  };
}

function buildWaveformSpanWordWindows(recording, spanStart, spanEnd, wordCount, durationHintSeconds = 0) {
  const duration = Number(durationHintSeconds) > 0
    ? Number(durationHintSeconds)
    : Number(getRecordingDurationHint(recording));
  const peaks = getRecordingWaveformPeaks(recording);
  if (!(duration > 0) || !peaks.length || !(spanEnd > spanStart) || wordCount <= 0) return null;
  const bucketSeconds = duration / peaks.length;
  if (!(bucketSeconds > 0)) return null;
  const startIndex = Math.max(0, Math.floor(spanStart / bucketSeconds));
  const endIndex = Math.min(peaks.length - 1, Math.ceil(spanEnd / bucketSeconds));
  if (endIndex <= startIndex) return null;

  const localPeaks = peaks.slice(startIndex, endIndex + 1);
  const maxPeak = Math.max(...localPeaks, 0);
  const minPeak = Math.min(...localPeaks, maxPeak);
  const threshold = Math.max(0.085, minPeak + ((maxPeak - minPeak) * 0.05));
  const weights = localPeaks.map((value) => {
    const voiced = Math.max(0, value - threshold);
    // Keep monotonic progress through pauses, but heavily favor voiced buckets.
    return 0.06 + (voiced * 5.2);
  });
  const localStartSeconds = startIndex * bucketSeconds;
  const localSpanSeconds = (endIndex - startIndex + 1) * bucketSeconds;
  const normalizedMap = (fraction) => {
    const mapped = mapWaveformFractionToTime(weights, bucketSeconds, localStartSeconds, fraction);
    return Math.min(spanEnd, Math.max(spanStart, mapped));
  };

  const windows = [];
  for (let i = 0; i < wordCount; i += 1) {
    const startRatio = i / wordCount;
    const endRatio = (i + 1) / wordCount;
    const mappedStart = normalizedMap(startRatio);
    const mappedEnd = normalizedMap(endRatio);
    const fallbackStart = spanStart + ((spanEnd - spanStart) * startRatio);
    const fallbackEnd = spanStart + ((spanEnd - spanStart) * endRatio);
    const start = Number.isFinite(mappedStart) ? mappedStart : fallbackStart;
    const end = Number.isFinite(mappedEnd) ? Math.max(start + 0.04, mappedEnd) : Math.max(start + 0.04, fallbackEnd);
    windows.push({ start, end });
  }
  if (!windows.length) return null;
  // Ensure final word still reaches near segment end so tail alignment doesn't regress.
  windows[windows.length - 1].end = Math.max(windows[windows.length - 1].end, spanEnd - 0.02);
  return windows;
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
    if (apiBaseLabelEl) apiBaseLabelEl.textContent = "API URL must start with http:// or https://";
    if (mobileApiBaseStatusEl) mobileApiBaseStatusEl.textContent = "Invalid URL: use http:// or https://";
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
  if (apiBaseInputEl) apiBaseInputEl.value = API_BASE;
  if (mobileApiBaseInputEl) mobileApiBaseInputEl.value = API_BASE;
  if (apiBaseLabelEl) {
    apiBaseLabelEl.textContent = `Using API: ${API_BASE} | page=${window.location.origin || window.location.protocol}`;
  }
  if (mobileApiBaseStatusEl) {
    mobileApiBaseStatusEl.textContent = `Using server: ${API_BASE}`;
  }
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
    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }
    if (!response.ok || !payload?.version) {
      throw new Error(`Version lookup failed (${response.status}).`);
    }
    const data = payload;

    const releaseDate = data.releaseDate ? ` (${data.releaseDate})` : "";
    const source = data.source ? ` via ${data.source}` : "";
    const versionLabel = `Version: v${data.version}${releaseDate}${source}`;
    if (projectVersionEl) projectVersionEl.textContent = versionLabel;
    if (docsVersionEl) docsVersionEl.textContent = versionLabel;
  } catch (error) {
    console.error("[version] load failed", error);
    if (projectVersionEl) {
      projectVersionEl.textContent = "";
      projectVersionEl.hidden = true;
    }
    if (docsVersionEl) {
      docsVersionEl.textContent = "";
      docsVersionEl.hidden = true;
    }
  }
}

async function loadBranding() {
  if (!brandLogoEl) return;
  try {
    const response = await fetch(`${API_BASE}/api/v1/public/branding`);
    if (!response.ok) {
      console.error(`[branding] lookup failed (${response.status})`);
      brandLogoEl.hidden = true;
      return;
    }
    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }
    const url = String(payload?.brandLogoUrl || "").trim();
    if (!url) {
      console.error("[branding] brandLogoUrl missing");
      brandLogoEl.hidden = true;
      return;
    }
    brandLogoEl.src = url;
    brandLogoEl.hidden = false;
  } catch (_error) {
    console.error("[branding] load failed", _error);
    brandLogoEl.hidden = true;
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
    const tags = [];
    const mobileTag = getMobileApkTag();
    if (mobileTag) tags.push(mobileTag);
    const gpsLocation = await getGpsLocationMetadata();
    if (gpsLocationEnabled && gpsLocation) {
      const nearestCityTag = await getNearestCityTagFromLocation(gpsLocation);
      if (nearestCityTag) tags.push(nearestCityTag);
    }
    const dedupedTags = Array.from(new Set(tags.map((tag) => String(tag || "").trim()).filter(Boolean)));
    const metadata = {};
    if (dedupedTags.length) metadata.tags = dedupedTags;
    if (gpsLocation) metadata.location = gpsLocation;
    const response = await fetch(`${API_BASE}/api/v1/recordings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: titleOverride || recordingTitleEl.value || "Test memo from app",
        ...(Object.keys(metadata).length ? { metadata } : {})
      })
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
      body: JSON.stringify({ identifySpeakers: identifyVoicesEnabled })
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
  loadRecordings({ refreshCloud: false, silent: true, preserveScroll: true });

  const run = async () => {
    const active = getRecordingUiState(recordingId);
    updateRecordingUiState(recordingId, {
      activeTaskLabel: label,
      queuedTasks: Math.max(0, (active.queuedTasks || 1) - 1)
    });
    loadRecordings({ refreshCloud: false, silent: true, preserveScroll: true });
    try {
      return await taskFn();
    } finally {
      const end = getRecordingUiState(recordingId);
      updateRecordingUiState(recordingId, { activeTaskLabel: null, queuedTasks: end.queuedTasks || 0 });
      loadRecordings({ refreshCloud: false, silent: true, preserveScroll: true });
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

async function runTranscriptionFlow(recordingId, options = {}) {
  const response = await fetch(`${API_BASE}/api/v1/recordings/${recordingId}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifySpeakers: identifyVoicesEnabled })
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
  try {
    await ensureCaptionAnchorsPersisted(recordingId);
  } catch (_error) {
    // Caption anchor persistence is best-effort.
  }
  await loadRecordings({ preserveScroll: true });
  const summaryMode = options.summaryMode || "auto";
  if (summaryMode === "always" || (summaryMode !== "never" && autoSummarizeEnabled)) {
    await runSummaryFlow(recordingId, { forceCreate: true });
  }
}

async function runSummaryFlow(recordingId, options = {}) {
  const markdown = await getSummaryPreview(recordingId, {
    forceCreate: Boolean(options.forceCreate),
    forceRefresh: Boolean(options.forceRefresh)
  });
  updateRecordingUiState(recordingId, { summaryMarkdown: markdown, showSummary: true });
  await loadRecordings({ preserveScroll: true });
  return markdown;
}

async function loadBackups() {
  if (!backupListEl) return;
  if (!authUser || authUser.role !== "admin") {
    backupListEl.textContent = "Admin only.";
    return;
  }
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
  if (!authUser || authUser.role !== "admin") {
    backupStatusEl.textContent = "Admin only.";
    return;
  }
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
  renderUploadModeStatus();
}

function canUseCloudUploads() {
  return Boolean(authUser);
}

function getEffectiveUploadEnabled() {
  return canUseCloudUploads() && Boolean(uploadEnabled);
}

function renderUploadModeStatus() {
  if (!uploadStatusEl) return;
  if (!canUseCloudUploads()) {
    uploadStatusEl.textContent = "Not logged in. Local recording only.";
    return;
  }
  uploadStatusEl.textContent = uploadEnabled
    ? "Uploads enabled by default."
    : "Uploads disabled. Recordings stay on this device.";
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

function buildRecordingsUrl(limit, offset, queryText) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (queryText) params.set("q", queryText);
  return `${API_BASE}/api/v1/recordings?${params.toString()}`;
}

function shouldLoadMoreCloud() {
  if (cloudLoading || !cloudHasMore) return false;
  const doc = document.documentElement;
  const remaining = doc.scrollHeight - (window.scrollY + window.innerHeight);
  return remaining <= SCROLL_LOAD_THRESHOLD_PX;
}

async function fetchCloudRecordings({ reset = false, append = false } = {}) {
  if (!authUser) {
    if (reset) {
      cloudOffset = 0;
      cloudHasMore = false;
      cloudRecordings = [];
    }
    return;
  }
  if (cloudLoading) return;
  cloudLoading = true;
  try {
    if (reset) {
      cloudOffset = 0;
      cloudHasMore = true;
      cloudRecordings = [];
    }
    const offset = append ? cloudOffset : 0;
    const response = await fetch(buildRecordingsUrl(CLOUD_PAGE_SIZE, offset, cloudQuery), { cache: "no-store" });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || `Failed loading recordings (${response.status})`);
    }
    const rows = Array.isArray(payload) ? payload : (Array.isArray(payload.recordings) ? payload.recordings : []);
    const hasMore = Boolean(payload?.pagination?.hasMore) || rows.length === CLOUD_PAGE_SIZE;
    if (append) {
      const merged = [...cloudRecordings, ...rows];
      const seen = new Set();
      cloudRecordings = merged.filter((row) => {
        if (!row?.id || seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      });
    } else {
      cloudRecordings = rows;
    }
    cloudOffset = append ? (cloudOffset + rows.length) : rows.length;
    cloudHasMore = hasMore;
  } finally {
    cloudLoading = false;
  }
}

function queueRecordingsViewportRefresh() {
  if (!authUser) return;
  if (recordingsScrollTicking) return;
  recordingsScrollTicking = true;
  requestAnimationFrame(async () => {
    recordingsScrollTicking = false;
    if (shouldLoadMoreCloud()) {
      await loadRecordings({ appendCloud: true, silent: true });
    }
  });
}

async function loadRecordings(options = {}) {
  const {
    refreshCloud = true,
    appendCloud = false,
    silent = false,
    preserveScroll = false
  } = options;
  if (!recordingsListEl) return;
  const restoreY = preserveScroll ? window.scrollY : null;
  try {
    transcriptWordRegistry.clear();
    if (!silent && !recordingsListEl.children.length) {
      recordingsListEl.innerHTML = "";
      for (let i = 0; i < 3; i += 1) {
        const placeholder = document.createElement("div");
        placeholder.className = "recordings-skeleton";
        recordingsListEl.appendChild(placeholder);
      }
    }

    if (refreshCloud) {
      await fetchCloudRecordings({ reset: !appendCloud, append: appendCloud });
    }

    recordingsListEl.innerHTML = "";
    const listTarget = document.createDocumentFragment();
    const localItems = Array.from(localRecordings.values())
      .filter((recording) => {
        if (!cloudQuery) return true;
        return String(recording.title || "").toLowerCase().includes(cloudQuery.toLowerCase());
      })
      .sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    const cloudItems = authUser ? cloudRecordings : [];
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
      badge.className = recording.uploadStatus === "uploading"
        ? "badge badge-uploading"
        : "status-icon status-local";
      badge.textContent = recording.uploadStatus === "uploading" ? "Uploading" : "\uD83C\uDFE0";
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
        uploadRecording(
          recording.blob,
          recording.title,
          recording.id,
          recording.durationSeconds || 0,
          recording.captionAnchors || []
        );
      });
      actions.appendChild(uploadBtn);

      const removeDeadAirLocalBtn = document.createElement("button");
      removeDeadAirLocalBtn.type = "button";
      removeDeadAirLocalBtn.textContent = "Remove Dead Air";
      removeDeadAirLocalBtn.disabled = recording.uploadStatus === "uploading";
      removeDeadAirLocalBtn.addEventListener("click", async () => {
        try {
          const result = await enqueueRecordingTask(recording.id, "Removing dead air", async () => (
            runDeadAirRemovalFlow(recording)
          ));
          alert(`Created ${result.recordingId}. Removed ${result.removedSeconds.toFixed(1)}s of silence.`);
        } catch (error) {
          alert(`Dead-air removal failed: ${error.message}`);
        }
      });
      actions.appendChild(removeDeadAirLocalBtn);

      const exportCcLocalBtn = document.createElement("button");
      exportCcLocalBtn.type = "button";
      exportCcLocalBtn.textContent = "CC";
      exportCcLocalBtn.className = "icon-action-btn";
      exportCcLocalBtn.title = "Download captions (.srt)";
      exportCcLocalBtn.setAttribute("aria-label", "Download captions");
      exportCcLocalBtn.addEventListener("click", async () => {
        const anchors = (Array.isArray(recording.captionAnchors) ? recording.captionAnchors : [])
          .map((entry) => ({ text: String(entry?.text || "").trim(), at: Number(entry?.at) }))
          .filter((entry) => entry.text && Number.isFinite(entry.at) && entry.at >= 0);
        if (!anchors.length) {
          const synthesized = getCaptionAnchorsFromSentenceAnchors(recording);
          if (!synthesized.length) {
            alert("No CC data is available for this recording yet.");
            return;
          }
          const srtFallback = buildSrtFromAnchors(synthesized, recording.durationSeconds || 0);
          downloadTextFile(`${sanitizeFilename(recording.title)}-captions.srt`, srtFallback, "application/x-subrip;charset=utf-8");
          return;
        }
        const srt = buildSrtFromAnchors(anchors, recording.durationSeconds || 0);
        if (!srt) {
          alert("Unable to build captions file.");
          return;
        }
        downloadTextFile(`${sanitizeFilename(recording.title)}-captions.srt`, srt, "application/x-subrip;charset=utf-8");
      });
      actions.appendChild(exportCcLocalBtn);

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
        releasePlayback(recording.id);
        playbackLoaders.delete(recording.id);
        localRecordings.delete(recording.id);
        loadRecordings();
      });
      actions.appendChild(deleteLocalBtn);

      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(badges);
      if (recording.blob) {
        const localLoader = async () => recording.blob;
        localLoader.durationHint = Number(recording.durationSeconds) || 0;
        playbackLoaders.set(recording.id, localLoader);
        item.appendChild(createPlaybackSection(recording.id, localLoader));
        preloadPlaybackForRecording(recording.id);
      }
      if (recording.uploadStatus === "uploading") {
        item.appendChild(buildLoadingBar("Uploading..."));
      }
      if (recording.downloading) {
        item.appendChild(buildLoadingBar("Downloading..."));
      }
      item.appendChild(actions);
      listTarget.appendChild(item);
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
      badge.className = "status-icon status-cloud";
      badge.textContent = "\u2601\uFE0F";

      const actions = document.createElement("div");
      actions.className = "recording-actions";
      actions.appendChild(badge);

      if (recording.metadata?.audio?.fileName) {
        const downloadBtn = document.createElement("button");
        downloadBtn.type = "button";
        downloadBtn.textContent = "\u2B07\uFE0F";
        downloadBtn.className = "icon-action-btn";
        downloadBtn.title = "Download audio";
        downloadBtn.setAttribute("aria-label", "Download audio");
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

        const downloadCcBtn = document.createElement("button");
        downloadCcBtn.type = "button";
        downloadCcBtn.textContent = "CC";
        downloadCcBtn.className = "icon-action-btn";
        downloadCcBtn.title = "Download captions (.srt)";
        downloadCcBtn.setAttribute("aria-label", "Download captions");
        downloadCcBtn.addEventListener("click", async () => {
          const anchors = await resolveCaptionAnchorsForExport(recording);
          if (!anchors.length) {
            alert("No CC data is available for this recording yet.");
            return;
          }
          const durationHint = getRecordingDurationHint(recording);
          const srt = buildSrtFromAnchors(anchors, durationHint);
          if (!srt) {
            alert("Unable to build captions file.");
            return;
          }
          downloadTextFile(`${sanitizeFilename(recording.title)}-captions.srt`, srt, "application/x-subrip;charset=utf-8");
        });
        actions.appendChild(downloadCcBtn);
      }

      const deleteCloudBtn = document.createElement("button");
      deleteCloudBtn.type = "button";
      deleteCloudBtn.textContent = "\uD83D\uDDD1\uFE0F";
      deleteCloudBtn.className = "icon-action-btn";
      deleteCloudBtn.title = "Delete cloud";
      deleteCloudBtn.setAttribute("aria-label", "Delete cloud");
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
          releasePlayback(recording.id);
          playbackLoaders.delete(recording.id);
          recordingUiState.delete(recording.id);
          loadRecordings();
        } catch (error) {
          alert(`Delete failed: ${error.message}`);
          updateRecordingUiState(recording.id, { deleting: false });
          loadRecordings();
        }
      });
      actions.appendChild(deleteCloudBtn);

      if (recording.metadata?.audio?.fileName) {
        const removeDeadAirBtn = document.createElement("button");
        removeDeadAirBtn.type = "button";
        removeDeadAirBtn.textContent = "\u2702\uFE0F";
        removeDeadAirBtn.className = "icon-action-btn";
        removeDeadAirBtn.title = `Remove dead air (>= ${deadAirThresholdSeconds.toFixed(1)}s)`;
        removeDeadAirBtn.setAttribute("aria-label", "Remove dead air");
        removeDeadAirBtn.disabled = Boolean(uiState.activeTaskLabel);
        removeDeadAirBtn.addEventListener("click", async () => {
          try {
            const result = await enqueueRecordingTask(recording.id, "Removing dead air", async () => (
              runDeadAirRemovalFlow(recording)
            ));
            alert(`Created ${result.recordingId}. Removed ${result.removedSeconds.toFixed(1)}s of silence.`);
          } catch (error) {
            alert(`Dead-air removal failed: ${error.message}`);
          }
        });
        actions.appendChild(removeDeadAirBtn);
      }

      const transcriptSection = document.createElement("div");
      transcriptSection.className = "recording-preview";
      const transcriptHeader = document.createElement("div");
      transcriptHeader.className = "recording-section-header";
      const transcribeBtn = document.createElement("button");
      transcribeBtn.type = "button";
      transcribeBtn.textContent = "\u21BB";
      transcribeBtn.className = "section-refresh-btn";
      transcribeBtn.title = "Re-transcribe";
      transcribeBtn.setAttribute("aria-label", "Re-transcribe");
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
      const transcriptToggle = document.createElement("button");
      transcriptToggle.type = "button";
      transcriptToggle.className = "toggle-button prominent-toggle section-main-btn";
      const transcriptExpanded = Boolean(uiState.showTranscript);
      transcriptToggle.textContent = `${transcriptExpanded ? "\u25BE" : "\u25B8"} Transcript`;
      const transcriptBody = document.createElement("div");
      transcriptBody.hidden = !transcriptExpanded;
      const transcriptText = document.createElement("pre");
      const transcriptWords = document.createElement("div");
      transcriptWords.className = "timed-words";
      transcriptWords.hidden = true;
      const timedWords = buildTimedWords(recording);
      const sentenceAnchors = buildSentenceAnchors(recording);
      const sentenceTimeline = buildSentenceWordTimeline(sentenceAnchors);
      const transcriptWordTotal = String(recording.metadata?.transcript?.text || "")
        .split(/\s+/)
        .filter(Boolean)
        .length;
      const speechEndHintSeconds = getSpeechEndHint(sentenceAnchors, Number(getRecordingDurationHint(recording)) || 0);
      const segments = Array.isArray(recording.metadata?.transcript?.segments) ? recording.metadata.transcript.segments : [];
      const speakerLabels = { ...(recording.metadata?.speakers?.labels || {}) };
      if (recording.metadata?.transcriptionError?.message) {
        transcriptText.textContent = `Transcription failed: ${recording.metadata.transcriptionError.message}`;
      } else if (segments.length) {
        transcriptText.hidden = true;
      } else if (recording.metadata?.transcript?.text) {
        transcriptText.textContent = recording.metadata.transcript.text;
      } else {
        transcriptText.textContent = "No transcript yet. Expand to generate transcription.";
      }

      if (!recording.metadata?.transcriptionError?.message && recording.metadata?.transcript?.text && !segments.length) {
        transcriptWords.hidden = false;
        transcriptText.hidden = true;
        const transcriptWordTokens = String(recording.metadata?.transcript?.text || "").split(/(\s+)/);
        const transcriptWordCount = transcriptWordTokens.filter((token) => token && token.trim()).length;
        const durationHintSeconds = Math.max(
          0,
          speechEndHintSeconds || 0
        );
        let timedIndex = 0;
        let fallbackWordIndex = 0;
        transcriptWordTokens.forEach((token) => {
          if (!token) return;
          if (!token.trim()) {
            transcriptWords.appendChild(document.createTextNode(token));
            return;
          }
          const cleanToken = cleanWordToken(token);
          const expectedStart = transcriptWordCount > 0 && durationHintSeconds > 0
            ? (durationHintSeconds * (fallbackWordIndex / transcriptWordCount))
            : NaN;
          const timedMatch = findBestTimedWordMatch({
            cleanToken,
            expectedStart,
            windowStart: 0,
            windowEnd: durationHintSeconds || NaN,
            timedWords,
            startIndex: timedIndex,
            lookahead: 56
          });
          let matched = timedMatch.match;
          timedIndex = timedMatch.nextIndex;
          if (!matched) {
            for (let i = timedIndex; i < sentenceTimeline.length; i += 1) {
              const candidate = sentenceTimeline[i];
              if (candidate.cleanWord === cleanToken) {
                matched = candidate;
                timedIndex = i + 1;
                break;
              }
            }
          }
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "timed-word";
          btn.textContent = token;
          const fallbackStart = expectedStart;
          const seekStart = matched && Number.isFinite(matched.start)
            ? matched.start
            : fallbackStart;
          const matchedEnd = matched && Number.isFinite(matched.end)
            ? matched.end
            : NaN;
          const seekEnd = Number.isFinite(matchedEnd)
            ? Math.min(matchedEnd, seekStart + 0.32)
            : (Number.isFinite(seekStart) ? (seekStart + 0.22) : NaN);
          fallbackWordIndex += 1;
          if (Number.isFinite(seekStart)) {
            btn.title = `${formatDuration(seekStart * 1000)}`;
            btn.addEventListener("click", async () => {
              try {
                await seekRecordingToTime(recording.id, seekStart);
              } catch (error) {
                alert(`Jump failed: ${error.message}`);
              }
            });
            registerTranscriptWord(recording.id, btn, seekStart, seekEnd);
          } else {
            btn.disabled = true;
          }
          transcriptWords.appendChild(btn);
        });
      }

      const speakerEditor = document.createElement("div");
      speakerEditor.className = "recording-actions";
      speakerEditor.hidden = !segments.length;
      const uniqueSpeakerIds = Array.from(new Set(segments.map((seg) => seg.speakerId).filter(Boolean)));
      uniqueSpeakerIds.forEach((speakerId) => {
        if (!speakerLabels[speakerId]) speakerLabels[speakerId] = `Person ${uniqueSpeakerIds.indexOf(speakerId) + 1}`;
        const wrap = document.createElement("label");
        wrap.className = "speaker-label-editor";
        wrap.style.borderColor = getSpeakerColor(speakerId);
        const chip = document.createElement("span");
        chip.className = "speaker-chip";
        chip.style.backgroundColor = getSpeakerColor(speakerId);
        chip.textContent = speakerId;
        const input = document.createElement("input");
        input.value = speakerLabels[speakerId];
        input.addEventListener("input", () => {
          speakerLabels[speakerId] = input.value.trim() || speakerLabels[speakerId];
        });
        wrap.appendChild(chip);
        wrap.appendChild(input);
        speakerEditor.appendChild(wrap);
      });
      if (uniqueSpeakerIds.length) {
        const saveLabelsBtn = document.createElement("button");
        saveLabelsBtn.type = "button";
        saveLabelsBtn.textContent = "Save Speaker Labels";
        saveLabelsBtn.addEventListener("click", async () => {
          try {
            const response = await fetch(`${API_BASE}/api/v1/recordings/${recording.id}/speakers`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ labels: speakerLabels })
            });
            const isJson = response.headers.get("content-type")?.includes("application/json");
            const payload = isJson ? await response.json() : await response.text();
            if (!response.ok) {
              const message = typeof payload === "string" ? payload : payload.error;
              throw new Error(message || `Save failed (${response.status})`);
            }
            loadRecordings();
          } catch (error) {
            alert(`Save speaker labels failed: ${error.message}`);
          }
        });
        speakerEditor.appendChild(saveLabelsBtn);
      }

      const transcriptSegmentsView = document.createElement("div");
      transcriptSegmentsView.className = "transcript-segments";
      transcriptSegmentsView.hidden = !segments.length;
      let segmentTimelineIndex = 0;
      let segmentTimedIndex = 0;
      segments.forEach((seg) => {
        const row = document.createElement("div");
        row.className = "transcript-segment";
        const chip = document.createElement("span");
        chip.className = "speaker-chip";
        chip.style.backgroundColor = getSpeakerColor(seg.speakerId);
        chip.textContent = speakerLabels[seg.speakerId] || seg.speakerId;
        const text = document.createElement("span");
        const tokens = String(seg.text || "").split(/(\s+)/);
        const segStart = Number(seg.start);
        const segEndRaw = Number(seg.end);
        const segWordCount = tokens.filter((token) => token && token.trim()).length;
        const segEnd = segEndRaw;
        let segWordIndex = 0;
        tokens.forEach((token) => {
          if (!token) return;
          if (!token.trim()) {
            text.appendChild(document.createTextNode(token));
            return;
          }
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "timed-word";
          btn.textContent = token;
          const cleanToken = cleanWordToken(token);
          let timedMatched = null;
          // Prefer same-token nearby match first.
          for (let i = segmentTimedIndex; i < Math.min(timedWords.length, segmentTimedIndex + 12); i += 1) {
            const candidate = timedWords[i];
            if (cleanWordToken(candidate.word) === cleanToken && Number.isFinite(candidate.start)) {
              timedMatched = candidate;
              segmentTimedIndex = i + 1;
              break;
            }
          }
          // If no token match, use next timed word in sequence to preserve pause gaps.
          if (!timedMatched) {
            for (let i = segmentTimedIndex; i < timedWords.length; i += 1) {
              const candidate = timedWords[i];
              if (isPauseMarker(candidate.word)) continue;
              if (Number.isFinite(candidate.start)) {
                timedMatched = candidate;
                segmentTimedIndex = i + 1;
                break;
              }
            }
          }
          let matched = null;
          for (let i = segmentTimelineIndex; i < sentenceTimeline.length; i += 1) {
            const candidate = sentenceTimeline[i];
            if (candidate.cleanWord === cleanToken) {
              matched = candidate;
              segmentTimelineIndex = i + 1;
              break;
            }
          }
          const proportionalStart = Number.isFinite(segStart) && Number.isFinite(segEnd) && segWordCount > 0
            ? (segStart + ((segEnd - segStart) * (segWordIndex / segWordCount)))
            : NaN;
          const proportionalEnd = Number.isFinite(segStart) && Number.isFinite(segEnd) && segWordCount > 0
            ? (segStart + ((segEnd - segStart) * ((segWordIndex + 1) / segWordCount)))
            : NaN;
          const seekStart = timedMatched && Number.isFinite(timedMatched.start)
            ? timedMatched.start
            : (matched && Number.isFinite(matched.start)
            ? matched.start
            : proportionalStart);
          const seekEnd = Number.isFinite(seekStart)
            ? (timedMatched && Number.isFinite(timedMatched.end)
                ? timedMatched.end
                : (matched && Number.isFinite(matched.end)
                ? matched.end
                : (Number.isFinite(proportionalEnd) ? proportionalEnd : (seekStart + 0.22))))
            : NaN;
          segWordIndex += 1;
          if (Number.isFinite(seekStart)) {
            btn.title = `${formatDuration(seekStart * 1000)}`;
            btn.addEventListener("click", async () => {
              try {
                await seekRecordingToTime(recording.id, seekStart);
              } catch (error) {
                alert(`Jump failed: ${error.message}`);
              }
            });
            registerTranscriptWord(recording.id, btn, seekStart, seekEnd);
          } else {
            btn.disabled = true;
          }
          text.appendChild(btn);
        });
        row.appendChild(chip);
        row.appendChild(text);
        transcriptSegmentsView.appendChild(row);
      });
      const transcriptActions = document.createElement("div");
      transcriptActions.className = "recording-actions";
      const transcriptMdBtn = document.createElement("button");
      transcriptMdBtn.type = "button";
      transcriptMdBtn.textContent = "Save Formatted";
      transcriptMdBtn.disabled = !recording.metadata?.transcript?.text;
      transcriptMdBtn.addEventListener("click", () => {
        const markdown = buildTranscriptMarkdown(recording);
        downloadTextFile(`${sanitizeFilename(recording.title)}-transcript.md`, markdown, "text/markdown;charset=utf-8");
      });
      const transcriptCopyMdBtn = document.createElement("button");
      transcriptCopyMdBtn.type = "button";
      transcriptCopyMdBtn.textContent = "Copy Formatted";
      transcriptCopyMdBtn.disabled = !recording.metadata?.transcript?.text;
      transcriptCopyMdBtn.addEventListener("click", async () => {
        try {
          await copyMarkdownFormatted(buildTranscriptMarkdown(recording));
        } catch (error) {
          alert(`Copy failed: ${error.message}`);
        }
      });
      const transcriptCopyTextBtn = document.createElement("button");
      transcriptCopyTextBtn.type = "button";
      transcriptCopyTextBtn.textContent = "Copy RAW";
      transcriptCopyTextBtn.disabled = !recording.metadata?.transcript?.text;
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
      transcriptBody.appendChild(speakerEditor);
      if (debugTranscriptTimestampsEnabled && sentenceAnchors.length) {
        const sentenceRef = document.createElement("div");
        sentenceRef.className = "sentence-reference";
        sentenceAnchors.forEach((entry) => {
          const row = document.createElement("div");
          row.className = "sentence-reference-row";
          row.textContent = `[${formatDuration(entry.start * 1000)}] ${entry.text}`;
          sentenceRef.appendChild(row);
        });
        transcriptBody.appendChild(sentenceRef);
      }
      transcriptBody.appendChild(transcriptSegmentsView);
      transcriptBody.appendChild(transcriptWords);
      transcriptBody.appendChild(transcriptText);
      transcriptBody.appendChild(transcriptActions);
      transcriptHeader.appendChild(transcriptToggle);
      transcriptHeader.appendChild(transcribeBtn);
      transcriptSection.appendChild(transcriptHeader);
      transcriptSection.appendChild(transcriptBody);
      transcriptToggle.addEventListener("click", async () => {
        const next = !transcriptBody.hidden;
        const expanded = !next;
        updateRecordingUiState(recording.id, { showTranscript: expanded });
        transcriptBody.hidden = !expanded;
        transcriptToggle.textContent = `${expanded ? "\u25BE" : "\u25B8"} Transcript`;
        if (!expanded) return;
        const refreshedState = getRecordingUiState(recording.id);
        const transcriptionBusy = Boolean(refreshedState.activeTaskLabel)
          || recording.status === "processing";
        if (transcriptionBusy) {
          return;
        }
        if (!recording.metadata?.transcript?.text && !recording.metadata?.transcriptionError?.message) {
          try {
            await enqueueRecordingTask(recording.id, "Transcribing audio", async () => {
              await runTranscriptionFlow(recording.id);
            });
          } catch (error) {
            alert(`Transcription failed: ${error.message}`);
          }
        }
      });

      const tagsSection = document.createElement("div");
      tagsSection.className = "tag-row";
      const currentTags = Array.isArray(recording.metadata?.tags) ? [...recording.metadata.tags] : [];
      currentTags.forEach((tag) => {
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.textContent = tag;
        tagsSection.appendChild(chip);
      });
      const tagsInput = document.createElement("input");
      tagsInput.className = "tag-input";
      tagsInput.placeholder = "Add tag";
      const addTagBtn = document.createElement("button");
      addTagBtn.type = "button";
      addTagBtn.textContent = "Save Tags";
      addTagBtn.addEventListener("click", async () => {
        const inputTags = String(tagsInput.value || "")
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);
        const merged = Array.from(new Set([...currentTags, ...inputTags])).slice(0, 20);
        try {
          const response = await fetch(`${API_BASE}/api/v1/recordings/${recording.id}/tags`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tags: merged })
          });
          const isJson = response.headers.get("content-type")?.includes("application/json");
          const payload = isJson ? await response.json() : await response.text();
          if (!response.ok) {
            const message = typeof payload === "string" ? payload : payload.error;
            throw new Error(message || `Save tags failed (${response.status})`);
          }
          loadRecordings();
        } catch (error) {
          alert(`Save tags failed: ${error.message}`);
        }
      });
      tagsSection.appendChild(tagsInput);
      tagsSection.appendChild(addTagBtn);
      if (!currentTags.length) {
        const hint = document.createElement("span");
        hint.className = "recording-meta";
        hint.textContent = "No tags yet.";
        tagsSection.appendChild(hint);
      }
      transcriptBody.appendChild(tagsSection);

      const summarySection = document.createElement("div");
      summarySection.className = "recording-summary";
      const summaryHeader = document.createElement("div");
      summaryHeader.className = "recording-section-header";
      const summarizeBtn = document.createElement("button");
      summarizeBtn.type = "button";
      summarizeBtn.textContent = "\u21BB";
      summarizeBtn.className = "section-refresh-btn";
      summarizeBtn.title = "Re-summarize";
      summarizeBtn.setAttribute("aria-label", "Re-summarize");
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
      const summaryToggle = document.createElement("button");
      summaryToggle.type = "button";
      summaryToggle.className = "toggle-button prominent-toggle section-main-btn";
      const summaryExpanded = Boolean(uiState.showSummary);
      summaryToggle.textContent = `${summaryExpanded ? "\u25BE" : "\u25B8"} \u2728 AI Summary`;
      const summaryBodyWrap = document.createElement("div");
      summaryBodyWrap.hidden = !summaryExpanded;
      const summaryWarn = document.createElement("div");
      summaryWarn.className = "recording-meta";
      summaryWarn.textContent = "Warning: AI summary may be incorrect. Review carefully.";
      const summaryBody = document.createElement("div");
      summaryBody.className = "markdown-body";
      const summaryMarkdown = uiState.summaryMarkdown || summaryCache.get(recording.id) || "";
      summaryBody.innerHTML = summaryMarkdown
        ? markdownToHtml(summaryMarkdown)
        : "<p>No summary yet. Expand to generate summary.</p>";
      const summaryActions = document.createElement("div");
      summaryActions.className = "recording-actions";

      const downloadSummaryBtn = document.createElement("button");
      downloadSummaryBtn.type = "button";
      downloadSummaryBtn.textContent = "Summary .md";
      downloadSummaryBtn.disabled = !summaryMarkdown;
      downloadSummaryBtn.addEventListener("click", () => {
        const md = buildSummaryMarkdown(recording, summaryMarkdown);
        downloadTextFile(`${sanitizeFilename(recording.title)}-summary.md`, md, "text/markdown;charset=utf-8");
      });
      summaryActions.appendChild(downloadSummaryBtn);

      const copySummaryMdBtn = document.createElement("button");
      copySummaryMdBtn.type = "button";
      copySummaryMdBtn.textContent = "Copy summary (md)";
      copySummaryMdBtn.disabled = !summaryMarkdown;
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
      copySummaryTextBtn.disabled = !summaryMarkdown;
      copySummaryTextBtn.addEventListener("click", async () => {
        try {
          await copyText(summaryMarkdown);
        } catch (error) {
          alert(`Copy failed: ${error.message}`);
        }
      });
      summaryActions.appendChild(copySummaryTextBtn);

      summaryBodyWrap.appendChild(summaryWarn);
      summaryBodyWrap.appendChild(summaryBody);
      summaryBodyWrap.appendChild(summaryActions);
      summaryHeader.appendChild(summaryToggle);
      summaryHeader.appendChild(summarizeBtn);
      summarySection.appendChild(summaryHeader);
      summarySection.appendChild(summaryBodyWrap);
      summaryToggle.addEventListener("click", async () => {
        const expanded = summaryBodyWrap.hidden;
        summaryBodyWrap.hidden = !expanded;
        summaryToggle.textContent = `${expanded ? "\u25BE" : "\u25B8"} \u2728 AI Summary`;
        updateRecordingUiState(recording.id, { showSummary: expanded });
        if (!expanded) return;
        const hasSummary = Boolean(getRecordingUiState(recording.id).summaryMarkdown || summaryCache.get(recording.id));
        if (!hasSummary) {
          try {
            await enqueueRecordingTask(recording.id, "Generating AI summary", async () => (
              runSummaryFlow(recording.id, { forceCreate: false, forceRefresh: false })
            ));
          } catch (error) {
            alert(`Summary failed: ${error.message}`);
          }
        }
      });

      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(actions);
      if (recording.metadata?.audio?.fileName) {
        const durationHint = getRecordingDurationHint(recording);
        const initialPeaks = getRecordingWaveformPeaks(recording);
        const cloudLoader = () => fetchRecordingAudioBlob(recording.id);
        cloudLoader.audioUrl = getRecordingAudioUrl(recording.id);
        cloudLoader.durationHint = durationHint;
        cloudLoader.initialPeaks = initialPeaks;
        if (durationHint > 0 || initialPeaks.length) {
          saveCachedPlaybackMeta(recording.id, {
            ...(durationHint > 0 ? { durationSeconds: durationHint } : {}),
            ...(initialPeaks.length ? { peaks: initialPeaks } : {})
          });
        }
        playbackLoaders.set(recording.id, cloudLoader);
        item.appendChild(createPlaybackSection(recording.id, cloudLoader));
        preloadPlaybackForRecording(recording.id);
      }
      if (uiState.downloading) {
        item.appendChild(buildLoadingBar("Downloading..."));
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
      item.appendChild(transcriptSection);
      item.appendChild(summarySection);
      listTarget.appendChild(item);
    });

    if (cloudLoading) {
      for (let i = 0; i < 2; i += 1) {
        const placeholder = document.createElement("div");
        placeholder.className = "recordings-skeleton";
        listTarget.appendChild(placeholder);
      }
    }

    recordingsListEl.replaceChildren(listTarget);
    if (restoreY !== null) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: restoreY });
      });
    }

    if (shouldLoadMoreCloud()) {
      loadRecordings({ appendCloud: true, silent: true }).catch(() => {
        // Ignore auto-pagination errors here; manual refresh can retry.
      });
    }
  } catch (error) {
    recordingsListEl.textContent = `Error loading recordings: ${error.message}`;
  }
}

let mediaRecorder = null;
let activeStream = null;
let recordedChunks = [];
let recordingTimer = null;
let recordingStartedAt = null;
let recordingElapsedMs = 0;
let downloadUrl = null;
let audioContext = null;
let analyserNode = null;
let animationFrame = null;
let stopActionOverride = null;
let pendingStopActionOverride = null;
let saveHoldTimer = null;
let saveHoldArmed = false;
let liveCaptionRecognition = null;
let liveCaptionFinalText = "";
let liveCaptionInterimText = "";
let liveCaptionShouldRestart = false;
let liveCaptionAnchors = [];

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

function getSpeechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function isLiveCaptionsSupported() {
  return Boolean(getSpeechRecognitionCtor());
}

function setLiveCaptionsStatus(message) {
  if (liveCaptionsStatusEl) {
    liveCaptionsStatusEl.textContent = message;
  }
}

function renderLiveCaptionsText() {
  if (!liveCaptionsTextEl) return;
  const finalText = String(liveCaptionFinalText || "").trim();
  const interimText = String(liveCaptionInterimText || "").trim();
  const joined = [finalText, interimText].filter(Boolean).join(finalText && interimText ? " " : "");
  liveCaptionsTextEl.textContent = joined || "Captions will appear here while recording.";
  liveCaptionsTextEl.scrollTop = liveCaptionsTextEl.scrollHeight;
}

function resetLiveCaptions() {
  liveCaptionFinalText = "";
  liveCaptionInterimText = "";
  liveCaptionAnchors = [];
  renderLiveCaptionsText();
}

function getCurrentRecordingElapsedSeconds() {
  const activeMs = recordingStartedAt ? (Date.now() - recordingStartedAt) : 0;
  const elapsedMs = Math.max(0, recordingElapsedMs + activeMs);
  return elapsedMs / 1000;
}

function stopLiveCaptions(options = {}) {
  const { keepFinal = true } = options;
  liveCaptionShouldRestart = false;
  if (keepFinal && String(liveCaptionInterimText || "").trim()) {
    const interim = String(liveCaptionInterimText || "").trim();
    liveCaptionFinalText = `${liveCaptionFinalText} ${interim}`.trim();
    const elapsed = getCurrentRecordingElapsedSeconds();
    const previous = liveCaptionAnchors[liveCaptionAnchors.length - 1];
    if (!previous || previous.text !== interim) {
      liveCaptionAnchors.push({
        text: interim,
        at: Number(elapsed.toFixed(3))
      });
    }
  }
  if (!keepFinal) {
    liveCaptionFinalText = "";
  }
  liveCaptionInterimText = "";
  if (liveCaptionRecognition) {
    try {
      liveCaptionRecognition.stop();
    } catch (_error) {
      // Ignore recognition stop errors.
    }
    liveCaptionRecognition = null;
  }
  renderLiveCaptionsText();
}

function startLiveCaptions() {
  if (!liveCaptionsEnabled) {
    setLiveCaptionsStatus("Live captions disabled in settings.");
    return;
  }
  const RecognitionCtor = getSpeechRecognitionCtor();
  if (!RecognitionCtor) {
    setLiveCaptionsStatus("Live captions unavailable in this browser.");
    return;
  }
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    return;
  }
  if (liveCaptionRecognition) return;

  const recognition = new RecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = navigator.language || "en-US";
  liveCaptionShouldRestart = true;

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const text = String(event.results[i][0]?.transcript || "").trim();
      if (!text) continue;
      if (event.results[i].isFinal) {
        liveCaptionFinalText = `${liveCaptionFinalText} ${text}`.trim();
        const elapsed = getCurrentRecordingElapsedSeconds();
        const previous = liveCaptionAnchors[liveCaptionAnchors.length - 1];
        if (!previous || previous.text !== text) {
          liveCaptionAnchors.push({
            text,
            at: Number(elapsed.toFixed(3))
          });
        }
      } else {
        interim = `${interim} ${text}`.trim();
      }
    }
    liveCaptionInterimText = interim;
    renderLiveCaptionsText();
  };

  recognition.onerror = (event) => {
    const code = String(event?.error || "unknown");
    if (code === "not-allowed" || code === "service-not-allowed") {
      setLiveCaptionsStatus("Live captions permission denied.");
      liveCaptionShouldRestart = false;
      return;
    }
    if (code === "no-speech") {
      setLiveCaptionsStatus("Live captions listening...");
      return;
    }
    setLiveCaptionsStatus(`Live captions error: ${code}`);
  };

  recognition.onend = () => {
    liveCaptionRecognition = null;
    const isActivelyRecording = Boolean(mediaRecorder && mediaRecorder.state === "recording");
    if (liveCaptionShouldRestart && isActivelyRecording) {
      setTimeout(() => {
        if (liveCaptionShouldRestart && mediaRecorder && mediaRecorder.state === "recording") {
          startLiveCaptions();
        }
      }, 150);
      return;
    }
    if (mediaRecorder && mediaRecorder.state === "paused") {
      setLiveCaptionsStatus("Live captions paused.");
    } else {
      setLiveCaptionsStatus("Live captions stopped.");
    }
  };

  try {
    recognition.start();
    liveCaptionRecognition = recognition;
    setLiveCaptionsStatus("Live captions listening...");
  } catch (_error) {
    liveCaptionRecognition = null;
    setLiveCaptionsStatus("Live captions failed to start.");
  }
}

function setRecordingUiState(state) {
  if (!recordStatusEl) return;
  recordStatusEl.textContent = state.message;
  recordStartBtn.disabled = state.startDisabled;
  recordStopBtn.disabled = state.stopDisabled;
  recordStartBtn.classList.toggle("is-recording", Boolean(state.isRecording));
  recordStartBtn.classList.toggle("is-paused", Boolean(state.isPaused));
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function cleanWordToken(value) {
  return String(value || "").replace(/^[^\w']+|[^\w']+$/g, "").toLowerCase();
}

function isPauseMarker(value) {
  return String(value || "").trim().toLowerCase() === "[pause]";
}

function clearTranscriptWordRegistry(recordingId) {
  if (!recordingId) return;
  transcriptWordRegistry.delete(recordingId);
}

function registerTranscriptWord(recordingId, element, start, end) {
  if (!recordingId || !element || !Number.isFinite(start)) return;
  const list = transcriptWordRegistry.get(recordingId) || [];
  list.push({
    element,
    start,
    end: Number.isFinite(end) ? end : start + 0.35
  });
  transcriptWordRegistry.set(recordingId, list);
}

function syncActiveTranscriptWord(recordingId, currentSeconds) {
  const entries = transcriptWordRegistry.get(recordingId);
  if (!entries || !entries.length || !Number.isFinite(currentSeconds)) return;
  const lastSpeechEnd = Math.max(...entries.map((entry) => Number(entry.end) || 0), 0);
  if (lastSpeechEnd > 0 && currentSeconds > (lastSpeechEnd + 0.2)) {
    entries.forEach((entry) => {
      entry.element.classList.remove("is-active");
    });
    return;
  }
  let activeIndex = -1;
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (currentSeconds >= entry.start && currentSeconds < entry.end) {
      activeIndex = i;
      break;
    }
  }
  entries.forEach((entry, index) => {
    entry.element.classList.toggle("is-active", index === activeIndex);
  });
}

function buildTimedWords(recording) {
  const transcript = recording.metadata?.transcript || {};
  const captionTimedWords = buildTimedWordsFromCaptionAnchors(recording);
  if (captionTimedWords.length) {
    return captionTimedWords;
  }
  const durationHint = Number(getRecordingDurationHint(recording));
  if (Array.isArray(transcript.wordTimings) && transcript.wordTimings.length) {
    return transcript.wordTimings
      .map((entry) => ({
        word: String(entry.word || "").trim(),
        start: Number(entry.start),
        end: Number(entry.end)
      }))
      .filter((entry) => entry.word && Number.isFinite(entry.start));
  }

  const segments = Array.isArray(transcript.providerSegments) ? transcript.providerSegments : [];
  const inferred = [];
  segments.forEach((segment) => {
    const text = String(segment?.text || "").trim();
    const start = Number(segment?.start);
    const end = Number(segment?.end);
    if (!text || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
    const words = text.split(/\s+/).filter(Boolean);
    if (!words.length) return;
    const duration = end - start;
    const windows = buildWaveformSpanWordWindows(recording, start, end, words.length, durationHint);
    words.forEach((word, index) => {
      const ratio = index / words.length;
      const mapped = windows?.[index];
      inferred.push({
        word,
        start: mapped?.start ?? (start + (duration * ratio)),
        end: mapped?.end ?? (start + (duration * ((index + 1) / words.length)))
      });
    });
  });
  return inferred;
}

function buildSentenceAnchors(recording) {
  const transcript = recording.metadata?.transcript || {};
  const fromSegments = Array.isArray(transcript.segments) ? transcript.segments : [];
  const fromProvider = Array.isArray(transcript.providerSegments) ? transcript.providerSegments : [];
  const normalizedSegments = fromSegments
    .map((entry) => ({
      text: String(entry?.text || "").trim(),
      start: Number(entry?.start),
      end: Number(entry?.end)
    }))
    .filter((entry) => entry.text && Number.isFinite(entry.start) && Number.isFinite(entry.end) && entry.end > entry.start);
  if (normalizedSegments.length) {
    return injectPauseAnchors(normalizedSegments);
  }
  if (fromProvider.length) {
    return injectPauseAnchors(fromProvider
      .map((entry) => ({
        text: String(entry?.text || "").trim(),
        start: Number(entry?.start),
        end: Number(entry?.end)
      }))
      .filter((entry) => entry.text && Number.isFinite(entry.start) && Number.isFinite(entry.end) && entry.end > entry.start));
  }
  const fromCaptions = getCaptionAnchors(recording);
  if (fromCaptions.length) {
    return injectPauseAnchors(fromCaptions);
  }

  const text = String(transcript.text || "").trim();
  const durationHint = Number(getRecordingDurationHint(recording));
  if (!text || !(Number.isFinite(durationHint) && durationHint > 0)) return [];
  const weightedMap = getWaveformWeightedSpeechMap(recording, durationHint);
  const speechWindow = getSpeechWindowFromWaveform(recording, durationHint) || { start: 0, end: durationHint };
  const speechSpan = Math.max(0.2, speechWindow.end - speechWindow.start);
  const sentences = text.split(/(?<=[.!?])\s+/).map((line) => line.trim()).filter(Boolean);
  if (!sentences.length) return [];
  const totalChars = Math.max(1, sentences.reduce((acc, line) => acc + line.length, 0));
  let consumedChars = 0;
  let cursor = speechWindow.start;
  const generated = sentences.map((line) => {
    const lineChars = Math.max(1, line.length);
    const startFraction = consumedChars / totalChars;
    consumedChars += lineChars;
    const endFraction = consumedChars / totalChars;
    const mappedStart = weightedMap
      ? weightedMap.mapFraction(startFraction)
      : cursor;
    const mappedEnd = weightedMap
      ? weightedMap.mapFraction(endFraction)
      : Math.min(speechWindow.end, cursor + Math.max(0.2, speechSpan * (lineChars / totalChars)));
    const start = Number.isFinite(mappedStart) ? mappedStart : cursor;
    const end = Number.isFinite(mappedEnd) ? Math.max(start + 0.2, mappedEnd) : (start + 0.2);
    cursor = Math.min(speechWindow.end, end);
    return { text: line, start, end };
  });
  return injectPauseAnchors(generated);
}

function buildSentenceWordTimeline(anchors) {
  const timeline = [];
  anchors.forEach((anchor) => {
    const words = String(anchor.text || "").split(/\s+/).filter(Boolean);
    if (!words.length) return;
    const span = Math.max(0.2, anchor.end - anchor.start);
    words.forEach((word, index) => {
      const start = anchor.start + (span * (index / words.length));
      const end = anchor.start + (span * ((index + 1) / words.length));
      timeline.push({
        cleanWord: cleanWordToken(word),
        start,
        end
      });
    });
  });
  return timeline;
}

function getSpeechEndHint(sentenceAnchors, fallbackDurationSeconds = 0) {
  if (Array.isArray(sentenceAnchors) && sentenceAnchors.length) {
    const maxEnd = Math.max(...sentenceAnchors.map((entry) => Number(entry.end) || 0), 0);
    if (maxEnd > 0) return maxEnd;
  }
  return Number.isFinite(fallbackDurationSeconds) ? Math.max(0, fallbackDurationSeconds) : 0;
}

function findBestTimedWordMatch({ cleanToken, expectedStart, windowStart, windowEnd, timedWords, startIndex = 0, lookahead = 48 }) {
  if (!cleanToken || !Array.isArray(timedWords) || !timedWords.length) {
    return { match: null, nextIndex: startIndex };
  }
  const from = Math.max(0, startIndex);
  const to = Math.min(timedWords.length, from + Math.max(8, lookahead));
  let best = null;
  let bestIndex = from;
  for (let i = from; i < to; i += 1) {
    const candidate = timedWords[i];
    if (cleanWordToken(candidate.word) !== cleanToken) continue;
    const start = Number(candidate.start);
    if (!Number.isFinite(start)) continue;
    if (Number.isFinite(windowStart) && start < windowStart - 0.8) continue;
    if (Number.isFinite(windowEnd) && start > windowEnd + 0.8) continue;
    const expectedDelta = Number.isFinite(expectedStart) ? Math.abs(start - expectedStart) : 0;
    const indexPenalty = (i - from) * 0.03;
    const score = expectedDelta + indexPenalty;
    if (!best || score < best.score) {
      best = { score, entry: candidate, index: i };
      bestIndex = i;
    }
  }
  if (!best) {
    return { match: null, nextIndex: startIndex };
  }
  return { match: best.entry, nextIndex: bestIndex + 1 };
}

async function seekRecordingToTime(recordingId, seconds) {
  const loader = playbackLoaders.get(recordingId);
  if (!loader) {
    throw new Error("Playback unavailable.");
  }
  const controller = await ensurePlaybackAttached(recordingId, loader);
  if (!controller.audio) return;
  const target = Number(seconds);
  if (Number.isFinite(target)) {
    controller.audio.currentTime = Math.max(0, target - 1);
  }
  await controller.audio.play();
}

function updateRecordingTimer() {
  const activeMs = recordingStartedAt ? (Date.now() - recordingStartedAt) : 0;
  const elapsed = recordingElapsedMs + activeMs;
  recordStatusEl.textContent = `Recording... ${formatDuration(elapsed)}`;
}

function startRecordingTimerLoop() {
  if (recordingTimer) {
    cancelAnimationFrame(recordingTimer);
    recordingTimer = null;
  }
  const tick = () => {
    if (!mediaRecorder || mediaRecorder.state !== "recording") {
      recordingTimer = null;
      return;
    }
    updateRecordingTimer();
    recordingTimer = requestAnimationFrame(tick);
  };
  updateRecordingTimer();
  recordingTimer = requestAnimationFrame(tick);
}

function stopRecordingTimerLoop() {
  if (recordingTimer) {
    cancelAnimationFrame(recordingTimer);
    recordingTimer = null;
  }
}

function sanitizeFilename(value) {
  return value.replace(/[^\w\-]+/g, "_").slice(0, 40) || "ovj_recording";
}

function getFileExtension(mimeType) {
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("aac")) return "aac";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

async function getAudioDurationSecondsFromBlob(blob) {
  if (!blob) return 0;
  const objectUrl = URL.createObjectURL(blob);
  const audio = new Audio();
  audio.preload = "metadata";
  try {
    const duration = await new Promise((resolve, reject) => {
      audio.addEventListener("loadedmetadata", () => resolve(Number(audio.duration)), { once: true });
      audio.addEventListener("error", () => reject(new Error("Unable to read audio metadata.")), { once: true });
      audio.src = objectUrl;
      audio.load();
    });
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
  } catch (_error) {
    return 0;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function getRecordingSourceBlob(recording) {
  if (!recording) throw new Error("Recording not found.");
  const local = localRecordings.get(recording.id);
  if (local?.blob) return local.blob;
  const loader = playbackLoaders.get(recording.id);
  if (loader) {
    try {
      const loaded = await Promise.resolve(loader());
      if (loaded) return loaded;
    } catch (_error) {
      // Continue to API fallback.
    }
  }
  if (recording.metadata?.audio?.fileName) {
    return fetchRecordingAudioBlob(recording.id);
  }
  throw new Error("No audio source available for this recording.");
}

function encodeWavFromChannels(channelData, sampleRate) {
  const channels = Math.max(1, Array.isArray(channelData) ? channelData.length : 0);
  const length = channels ? channelData[0].length : 0;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < length; i += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i] || 0));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }
  return new Blob([buffer], { type: "audio/wav" });
}

async function removeDeadAirFromBlob(blob, minSilenceSeconds) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) throw new Error("Web Audio API is unavailable in this browser.");
  const audioContext = new AudioCtx();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const input = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const sampleRate = input.sampleRate;
    const channelCount = input.numberOfChannels || 1;
    const totalSamples = input.length || 0;
    if (totalSamples <= 0) throw new Error("Audio file is empty.");

    const frameSamples = Math.max(256, Math.floor(sampleRate * 0.02));
    const frameCount = Math.ceil(totalSamples / frameSamples);
    const energies = new Array(frameCount).fill(0);
    for (let frame = 0; frame < frameCount; frame += 1) {
      const start = frame * frameSamples;
      const end = Math.min(totalSamples, start + frameSamples);
      let sum = 0;
      let count = 0;
      for (let channel = 0; channel < channelCount; channel += 1) {
        const data = input.getChannelData(channel);
        for (let i = start; i < end; i += 1) {
          sum += Math.abs(data[i] || 0);
          count += 1;
        }
      }
      energies[frame] = count > 0 ? (sum / count) : 0;
    }

    const sorted = [...energies].sort((a, b) => a - b);
    const noiseFloor = sorted[Math.floor(sorted.length * 0.2)] || 0;
    const peakEnergy = sorted[sorted.length - 1] || 0;
    const silenceThreshold = Math.max(0.0025, noiseFloor * 2.8, peakEnergy * 0.03);
    const minSilenceFrames = Math.max(1, Math.floor((Number(minSilenceSeconds) || 0) / (frameSamples / sampleRate)));

    const removableSilences = [];
    let runStart = -1;
    for (let frame = 0; frame < frameCount; frame += 1) {
      const isSilent = energies[frame] < silenceThreshold;
      if (isSilent) {
        if (runStart < 0) runStart = frame;
      } else if (runStart >= 0) {
        const runLength = frame - runStart;
        if (runLength >= minSilenceFrames) {
          removableSilences.push({
            start: runStart * frameSamples,
            end: Math.min(totalSamples, frame * frameSamples)
          });
        }
        runStart = -1;
      }
    }
    if (runStart >= 0) {
      const runLength = frameCount - runStart;
      if (runLength >= minSilenceFrames) {
        removableSilences.push({
          start: runStart * frameSamples,
          end: totalSamples
        });
      }
    }

    if (!removableSilences.length) {
      return {
        blob,
        removedSeconds: 0,
        originalSeconds: totalSamples / sampleRate,
        processedSeconds: totalSamples / sampleRate
      };
    }

    const keepRanges = [];
    let cursor = 0;
    removableSilences.forEach((gap) => {
      if (gap.start > cursor) {
        keepRanges.push({ start: cursor, end: gap.start });
      }
      cursor = Math.max(cursor, gap.end);
    });
    if (cursor < totalSamples) {
      keepRanges.push({ start: cursor, end: totalSamples });
    }
    const normalizedKeepRanges = keepRanges.filter((range) => range.end > range.start);
    if (!normalizedKeepRanges.length) {
      throw new Error("Dead-air removal would produce empty audio.");
    }

    const outputSamples = normalizedKeepRanges.reduce((sum, range) => sum + (range.end - range.start), 0);
    const outputChannels = Array.from({ length: channelCount }, () => new Float32Array(outputSamples));
    const fadeSamples = Math.max(32, Math.floor(sampleRate * 0.006));
    let writeOffset = 0;
    normalizedKeepRanges.forEach((range, rangeIndex) => {
      const span = range.end - range.start;
      for (let channel = 0; channel < channelCount; channel += 1) {
        const source = input.getChannelData(channel);
        const target = outputChannels[channel];
        target.set(source.subarray(range.start, range.end), writeOffset);
        if (rangeIndex > 0) {
          const fadeIn = Math.min(fadeSamples, span);
          for (let i = 0; i < fadeIn; i += 1) {
            const idx = writeOffset + i;
            target[idx] *= i / Math.max(1, fadeIn);
          }
        }
        if (rangeIndex < normalizedKeepRanges.length - 1) {
          const fadeOut = Math.min(fadeSamples, span);
          for (let i = 0; i < fadeOut; i += 1) {
            const idx = writeOffset + span - 1 - i;
            target[idx] *= i / Math.max(1, fadeOut);
          }
        }
      }
      writeOffset += span;
    });

    const processedBlob = encodeWavFromChannels(outputChannels, sampleRate);
    const originalSeconds = totalSamples / sampleRate;
    const processedSeconds = outputSamples / sampleRate;
    return {
      blob: processedBlob,
      removedSeconds: Math.max(0, originalSeconds - processedSeconds),
      originalSeconds,
      processedSeconds
    };
  } finally {
    await audioContext.close();
  }
}

async function runDeadAirRemovalFlow(recording) {
  const sourceBlob = await getRecordingSourceBlob(recording);
  const processed = await removeDeadAirFromBlob(sourceBlob, deadAirThresholdSeconds);
  if (processed.removedSeconds < 0.1) {
    throw new Error(`No silence blocks >= ${deadAirThresholdSeconds.toFixed(1)}s were detected.`);
  }
  const nextTitle = `${recording.title} [Dead Air Removed]`;
  const created = await createRecording(nextTitle);
  const [durationSeconds, waveformPeaks] = await Promise.all([
    getAudioDurationSecondsFromBlob(processed.blob),
    buildWaveformPeaks(processed.blob, 140).catch(() => [])
  ]);
  const formData = new FormData();
  formData.append("audio", processed.blob, `${sanitizeFilename(nextTitle)}.wav`);
  formData.append("title", nextTitle);
  if (durationSeconds > 0) {
    formData.append("durationSeconds", String(durationSeconds));
  }
  if (waveformPeaks.length) {
    formData.append("waveformPeaks", JSON.stringify(waveformPeaks));
  }
  const uploadResponse = await fetch(`${API_BASE}/api/v1/recordings/${created.id}/upload`, {
    method: "POST",
    body: formData
  });
  const uploadIsJson = uploadResponse.headers.get("content-type")?.includes("application/json");
  const uploadPayload = uploadIsJson ? await uploadResponse.json() : await uploadResponse.text();
  if (!uploadResponse.ok) {
    const message = typeof uploadPayload === "string" ? uploadPayload : uploadPayload.error;
    throw new Error(message || "Failed uploading processed audio");
  }
  if (durationSeconds > 0 || waveformPeaks.length) {
    saveCachedPlaybackMeta(created.id, {
      ...(durationSeconds > 0 ? { durationSeconds } : {}),
      ...(waveformPeaks.length ? { peaks: waveformPeaks } : {})
    });
  }
  await runTranscriptionFlow(created.id, { summaryMode: "always" });
  await loadRecordings({ refreshCloud: true, preserveScroll: true });
  return {
    recordingId: created.id,
    removedSeconds: processed.removedSeconds
  };
}

function getPlaybackController(recordingId) {
  if (!playbackControllers.has(recordingId)) {
    const cached = getCachedPlaybackMeta(recordingId) || {};
    playbackControllers.set(recordingId, {
      audio: null,
      objectUrl: null,
      peaks: Array.isArray(cached.peaks) ? cached.peaks : null,
      loadingPromise: null,
      peaksPromise: null,
      loadState: "idle",
      loadError: "",
      durationHint: Number.isFinite(Number(cached.durationSeconds)) ? Number(cached.durationSeconds) : 0
    });
  }
  return playbackControllers.get(recordingId);
}

async function buildWaveformPeaks(blob, bucketCount = 160) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return new Array(bucketCount).fill(0.15);
  const audioContext = new AudioCtx();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const channels = audioBuffer.numberOfChannels || 1;
    const length = audioBuffer.length || 1;
    const blockSize = Math.max(1, Math.floor(length / bucketCount));
    const peaks = new Array(bucketCount).fill(0);
    for (let bucket = 0; bucket < bucketCount; bucket += 1) {
      const start = bucket * blockSize;
      const end = Math.min(start + blockSize, length);
      let sum = 0;
      let count = 0;
      for (let channel = 0; channel < channels; channel += 1) {
        const data = audioBuffer.getChannelData(channel);
        for (let i = start; i < end; i += 1) {
          const value = Math.abs(data[i] || 0);
          sum += value;
          count += 1;
        }
      }
      peaks[bucket] = count ? (sum / count) : 0;
    }
    const max = Math.max(...peaks, 0.001);
    return peaks.map((value) => Math.max(0.08, value / max));
  } finally {
    await audioContext.close();
  }
}

function drawPlaybackWaveform(canvas, peaks, progress = 0) {
  const ctx = canvas.getContext("2d");
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || canvas.height;
  if (!ctx || !width || !height) return;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(19, 35, 26, 0.08)";
  ctx.fillRect(0, 0, width, height);
  const values = Array.isArray(peaks) && peaks.length ? peaks : new Array(120).fill(0.18);
  const barWidth = width / values.length;
  const playedX = width * Math.min(1, Math.max(0, progress));
  for (let i = 0; i < values.length; i += 1) {
    const amplitude = values[i];
    const h = Math.max(2, amplitude * (height - 6));
    const x = i * barWidth;
    const y = (height - h) / 2;
    ctx.fillStyle = x <= playedX ? "rgba(31, 122, 77, 0.9)" : "rgba(90, 106, 96, 0.55)";
    ctx.fillRect(x, y, Math.max(1, barWidth - 1), h);
  }
}

async function ensurePlaybackLoaded(recordingId, loadBlob) {
  const controller = getPlaybackController(recordingId);
  const loaderDurationHint = Number(loadBlob?.durationHint);
  if (Number.isFinite(loaderDurationHint) && loaderDurationHint > 0 && !controller.durationHint) {
    controller.durationHint = loaderDurationHint;
    saveCachedPlaybackMeta(recordingId, { durationSeconds: loaderDurationHint });
  }
  if (controller.audio) return controller;
  if (controller.loadingPromise) {
    await controller.loadingPromise;
    return controller;
  }
  controller.loadingPromise = (async () => {
    controller.loadState = "loading";
    controller.loadError = "";
    try {
      const directUrl = typeof loadBlob?.audioUrl === "string" ? loadBlob.audioUrl : "";
      let blob = null;
      let objectUrl = null;
      const audio = new Audio(directUrl || "");
      audio.preload = "auto";
      controller.audio = audio;
      controller.objectUrl = objectUrl;
      controller.loadState = Number.isFinite(controller.durationHint) && controller.durationHint > 0 ? "ready" : "loading";

      const hydratePeaks = (sourceBlob) => {
        if (!sourceBlob || controller.peaksPromise || controller.peaks) return;
        controller.peaksPromise = buildWaveformPeaks(sourceBlob)
          .then((peaks) => {
            controller.peaks = peaks;
            saveCachedPlaybackMeta(recordingId, { peaks });
          })
          .catch((_error) => {
            controller.peaks = null;
          })
          .finally(() => {
            controller.peaksPromise = null;
          });
      };

      await new Promise((resolve, reject) => {
        let attemptedBlobFallback = false;
        let resolved = false;
        const finalizeReady = () => {
          const durationSeconds = Number(audio.duration);
          if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
            controller.durationHint = durationSeconds;
            saveCachedPlaybackMeta(recordingId, { durationSeconds });
          }
          controller.loadState = "ready";
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        audio.addEventListener("loadedmetadata", finalizeReady, { once: true });
        audio.addEventListener("canplay", finalizeReady, { once: true });
        audio.addEventListener("error", () => {
          if (directUrl && !attemptedBlobFallback) {
            attemptedBlobFallback = true;
            Promise.resolve(loadBlob())
              .then((loadedBlob) => {
                blob = loadedBlob;
                objectUrl = URL.createObjectURL(loadedBlob);
                controller.objectUrl = objectUrl;
                audio.src = objectUrl;
                audio.load();
              })
              .catch((error) => reject(error));
            return;
          }
          reject(new Error("Audio load failed."));
        }, { once: false });

        if (directUrl) {
          audio.load();
          if (controller.durationHint > 0) {
            // Don't block UI/play on metadata when we already know duration.
            if (!resolved) {
              resolved = true;
              resolve();
            }
          }
        } else {
          Promise.resolve(loadBlob())
            .then((loadedBlob) => {
              blob = loadedBlob;
              objectUrl = URL.createObjectURL(loadedBlob);
              controller.objectUrl = objectUrl;
              audio.src = objectUrl;
              audio.load();
            })
            .catch((error) => reject(error));
        }
      });

      if (blob) {
        hydratePeaks(blob);
      } else if (!directUrl) {
        Promise.resolve(loadBlob())
          .then((loadedBlob) => hydratePeaks(loadedBlob))
          .catch((_error) => {
            // Ignore waveform background fetch errors.
          });
      } else if (!controller.peaks && !(Array.isArray(loadBlob?.initialPeaks) && loadBlob.initialPeaks.length)) {
        // Defer heavy blob fetch on cloud audio so it doesn't delay immediate scrubber/play startup.
        setTimeout(() => {
          Promise.resolve(loadBlob())
            .then((loadedBlob) => hydratePeaks(loadedBlob))
            .catch((_error) => {
              // Ignore waveform background fetch errors.
            });
        }, 5000);
      }
    } catch (error) {
      controller.loadState = "error";
      controller.loadError = error.message || "Failed loading audio.";
      throw error;
    }
  })();
  try {
    await controller.loadingPromise;
    return controller;
  } finally {
    controller.loadingPromise = null;
  }
}

function preloadPlaybackForRecording(recordingId) {
  const loader = playbackLoaders.get(recordingId);
  if (!loader) return;
  ensurePlaybackLoaded(recordingId, loader).catch((_error) => {
    // Keep the UI interactive; playback button can retry.
  });
}

async function ensurePlaybackAttached(recordingId, loadBlob) {
  const controller = getPlaybackController(recordingId);
  if (controller.audio) return controller;
  if (!controller.loadingPromise) {
    ensurePlaybackLoaded(recordingId, loadBlob).catch((_error) => {
      // Caller will surface playback errors on interaction.
    });
  }
  const startedAt = Date.now();
  while (!controller.audio && Date.now() - startedAt < 2000) {
    // Poll briefly because the audio object is attached very early in load flow.
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  if (!controller.audio) {
    throw new Error("Playback failed to initialize.");
  }
  return controller;
}

function releasePlayback(recordingId) {
  const controller = playbackControllers.get(recordingId);
  if (!controller) return;
  try {
    controller.audio?.pause();
  } catch (_error) {
    // Ignore pause errors.
  }
  if (controller.objectUrl) URL.revokeObjectURL(controller.objectUrl);
  playbackControllers.delete(recordingId);
}

function createPlaybackSection(recordingId, loadBlob) {
  const section = document.createElement("div");
  section.className = "playback-section";
  const controllerHint = getPlaybackController(recordingId);
  const initialDurationHint = Number(loadBlob?.durationHint);
  if (Number.isFinite(initialDurationHint) && initialDurationHint > 0 && !controllerHint.durationHint) {
    controllerHint.durationHint = initialDurationHint;
  }
  if (!controllerHint.peaks && Array.isArray(loadBlob?.initialPeaks) && loadBlob.initialPeaks.length) {
    controllerHint.peaks = loadBlob.initialPeaks;
  }

  const controls = document.createElement("div");
  controls.className = "playback-controls";

  const playPauseBtn = document.createElement("button");
  playPauseBtn.type = "button";
  playPauseBtn.className = "playback-toggle";
  playPauseBtn.textContent = "Play";

  const timeLabel = document.createElement("span");
  timeLabel.className = "playback-time";
  timeLabel.textContent = "00:00 / 00:00";

  controls.appendChild(playPauseBtn);
  controls.appendChild(timeLabel);

  const waveCanvas = document.createElement("canvas");
  waveCanvas.className = "playback-wave";
  waveCanvas.height = 54;

  const loadStatus = document.createElement("div");
  loadStatus.className = "playback-load-status";
  loadStatus.textContent = "Preparing scrubber...";

  const scrubber = document.createElement("input");
  scrubber.type = "range";
  scrubber.className = "playback-scrubber";
  scrubber.min = "0";
  scrubber.max = "1";
  scrubber.step = "0.001";
  scrubber.value = "0";
  scrubber.disabled = true;

  section.appendChild(controls);
  section.appendChild(waveCanvas);
  section.appendChild(loadStatus);
  section.appendChild(scrubber);

  let optimisticPlayStartedAt = 0;
  let optimisticBaseTime = 0;

  const refreshPlaybackUi = () => {
    const controller = getPlaybackController(recordingId);
    const audio = controller.audio;
    const isLoading = controller.loadState === "loading";
    const hasError = controller.loadState === "error";
    const duration = Number.isFinite(audio?.duration) && audio.duration > 0
      ? audio.duration
      : (Number.isFinite(controller.durationHint) ? controller.durationHint : 0);
    const measuredCurrent = Number.isFinite(audio?.currentTime) ? audio.currentTime : 0;
    let current = measuredCurrent;
    if (audio && !audio.paused && optimisticPlayStartedAt && duration > 0) {
      const optimistic = Math.min(
        duration,
        optimisticBaseTime + ((Date.now() - optimisticPlayStartedAt) / 1000)
      );
      current = Math.max(measuredCurrent, optimistic);
      if (measuredCurrent > optimisticBaseTime + 0.25) {
        optimisticPlayStartedAt = 0;
      }
    } else if (!audio || audio.paused) {
      optimisticPlayStartedAt = 0;
    }
    if (!(duration > 0)) {
      current = 0;
    } else if (current > duration) {
      current = duration;
    }
    const progress = duration > 0 ? Math.min(1, current / duration) : 0;
    scrubber.disabled = !audio || duration <= 0;
    scrubber.value = String(progress);
    drawPlaybackWaveform(waveCanvas, controller.peaks, progress);
    // Highlight should track real playback clock, not optimistic UI progress.
    syncActiveTranscriptWord(recordingId, measuredCurrent);
    section.classList.toggle("is-loading", isLoading);
    section.classList.toggle("has-error", hasError);
    if (hasError) {
      loadStatus.hidden = false;
      loadStatus.textContent = `Scrubber load failed: ${controller.loadError || "unknown error"}`;
    } else if (isLoading || !audio) {
      loadStatus.hidden = false;
      loadStatus.textContent = "Loading audio and scrubber...";
    } else {
      loadStatus.hidden = true;
    }
    const left = formatDuration(current * 1000);
    const right = formatDuration(duration * 1000);
    timeLabel.textContent = `${left} / ${right}`;
    playPauseBtn.classList.toggle("is-playing", Boolean(audio && !audio.paused));
    playPauseBtn.classList.toggle("is-paused", Boolean(audio && audio.paused && current > 0 && current < duration));
    playPauseBtn.textContent = audio && !audio.paused ? "Pause" : "Play";
  };

  playPauseBtn.addEventListener("click", async () => {
    playPauseBtn.disabled = true;
    try {
      const controller = await ensurePlaybackAttached(recordingId, loadBlob);
      if (controller.audio.paused) {
        const effectiveDuration = Number.isFinite(controller.audio.duration) && controller.audio.duration > 0
          ? controller.audio.duration
          : (Number.isFinite(controller.durationHint) ? controller.durationHint : 0);
        if (effectiveDuration > 0 && controller.audio.currentTime >= (effectiveDuration - 0.05)) {
          controller.audio.currentTime = 0;
        }
        optimisticBaseTime = Number.isFinite(controller.audio.currentTime) ? controller.audio.currentTime : 0;
        optimisticPlayStartedAt = Date.now();
        await controller.audio.play();
      } else {
        controller.audio.pause();
        optimisticPlayStartedAt = 0;
      }
      refreshPlaybackUi();
    } catch (error) {
      alert(`Playback failed: ${error.message}`);
    } finally {
      playPauseBtn.disabled = false;
      refreshPlaybackUi();
    }
  });

  scrubber.addEventListener("input", () => {
    const controller = getPlaybackController(recordingId);
    const audio = controller.audio;
    const duration = Number.isFinite(audio?.duration) && audio.duration > 0
      ? audio.duration
      : (Number.isFinite(controller.durationHint) ? controller.durationHint : 0);
    if (!audio || duration <= 0) return;
    audio.currentTime = Number(scrubber.value) * duration;
    optimisticPlayStartedAt = 0;
    refreshPlaybackUi();
  });

  const loop = () => {
    if (!section.isConnected) return;
    refreshPlaybackUi();
    requestAnimationFrame(loop);
  };
  drawPlaybackWaveform(waveCanvas, getPlaybackController(recordingId).peaks, 0);
  requestAnimationFrame(loop);
  ensurePlaybackLoaded(recordingId, loadBlob)
    .then(() => refreshPlaybackUi())
    .catch(() => refreshPlaybackUi());

  return section;
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
      stopDisabled: true
    });
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    activeStream = stream;
    recordedChunks = [];
    recordingElapsedMs = 0;
    recordingStartedAt = null;
    resetLiveCaptions();

    const mimeType = pickRecordingMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorder = recorder;

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) recordedChunks.push(event.data);
    });

    recorder.addEventListener("stop", () => {
      if (recordingStartedAt) {
        recordingElapsedMs += Date.now() - recordingStartedAt;
      }
      recordingStartedAt = null;
      const blob = new Blob(recordedChunks, { type: recorder.mimeType || "audio/webm" });
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = URL.createObjectURL(blob);
      const title = recordingTitleEl?.value?.trim() || buildDefaultRecordingTitle();
      const elapsedDurationSeconds = Math.max(0, recordingElapsedMs / 1000);
      const localEntry = createLocalRecording({
        title,
        blob,
        downloadUrl,
        durationSeconds: elapsedDurationSeconds,
        captionAnchors: [...liveCaptionAnchors]
      });

      setRecordingUiState({
        message: "Recording ready.",
        startDisabled: false,
        stopDisabled: true,
        isRecording: false,
        isPaused: false
      });
      stopLiveCaptions({ keepFinal: true });
      setLiveCaptionsStatus("Live captions complete.");

      const shouldUpload = canUseCloudUploads() && (
        pendingStopActionOverride === "upload"
        || (pendingStopActionOverride !== "local" && uploadEnabled)
      );
      const shouldPromptLocalDownload = !shouldUpload && getEffectiveUploadEnabled() === false && pendingStopActionOverride !== "local";
      pendingStopActionOverride = null;

      if (shouldUpload) {
        markLocalRecording(localEntry.id, { uploadStatus: "uploading" });
        loadRecordings();
        uploadRecording(blob, title, localEntry.id, localEntry.durationSeconds, localEntry.captionAnchors);
      } else {
        if (shouldPromptLocalDownload) {
          promptLocalDownload("Uploads are disabled. The recording is only on this device.");
        }
        loadRecordings();
      }
      applyDefaultRecordingTitle(true);

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
        isRecording: false,
        isPaused: false
      });
      stopLiveCaptions({ keepFinal: true });
      setLiveCaptionsStatus("Live captions stopped.");
      stopRecordingTimerLoop();
      mediaRecorder = null;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
        activeStream = null;
      }
    });

    recorder.start();
    recordingStartedAt = Date.now();
    startRecordingTimerLoop();
    // Start recording immediately; initialize secondary UI features after.
    setTimeout(() => {
      try {
        setupVisualizer(stream);
      } catch (_error) {
        // Visualizer failure should not block recording.
      }
      startLiveCaptions();
    }, 0);

    setRecordingUiState({
      message: "Recording... 00:00",
      startDisabled: false,
      stopDisabled: false,
      isRecording: true,
      isPaused: false
    });
  } catch (error) {
    stopLiveCaptions({ keepFinal: false });
    if (isLiveCaptionsSupported()) {
      setLiveCaptionsStatus("Live captions: ready");
    }
    stopRecordingTimerLoop();
    setRecordingUiState({
      message: `Recording failed: ${error.message}`,
      startDisabled: false,
      stopDisabled: true
    });
  }
}

function toggleRecordPause() {
  const recorder = mediaRecorder;
  if (!recorder) {
    startRecording();
    return;
  }

  if (recorder.state === "recording") {
    recorder.pause();
    stopLiveCaptions({ keepFinal: true });
    setLiveCaptionsStatus("Live captions paused.");
    if (recordingStartedAt) {
      recordingElapsedMs += Date.now() - recordingStartedAt;
    }
    recordingStartedAt = null;
    stopRecordingTimerLoop();
    setRecordingUiState({
      message: `Paused at ${formatDuration(recordingElapsedMs)}`,
      startDisabled: false,
      stopDisabled: false,
      isRecording: false,
      isPaused: true
    });
    return;
  }

  if (recorder.state === "paused") {
    recorder.resume();
    startLiveCaptions();
    recordingStartedAt = Date.now();
    startRecordingTimerLoop();
    setRecordingUiState({
      message: `Recording... ${formatDuration(recordingElapsedMs)}`,
      startDisabled: false,
      stopDisabled: false,
      isRecording: true,
      isPaused: false
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
    updatePermissionStatus();
  } catch (error) {
    if (recordStatusEl) {
      recordStatusEl.textContent = `Microphone permission denied: ${error.message}`;
    }
    updatePermissionStatus();
  }
}

function stopRecording() {
  const recorder = mediaRecorder;
  if (!recorder) return;
  stopLiveCaptions({ keepFinal: true });
  setLiveCaptionsStatus("Live captions stopped.");
  pendingStopActionOverride = stopActionOverride;
  stopActionOverride = null;
  saveHoldArmed = false;
  if (saveHoldTimer) {
    clearTimeout(saveHoldTimer);
    saveHoldTimer = null;
  }
  recordStopBtn.disabled = true;
  try {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  } catch (_error) {
    // Ignore stop errors.
  }
  stopRecordingTimerLoop();
  stopVisualizer();
}

function downloadRecording() {
  if (!downloadUrl) return;
  const fallbackTitle = recordingTitleEl?.value?.trim() || "ovj_recording";
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = `${sanitizeFilename(fallbackTitle)}.webm`;
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

async function uploadRecording(blob, title, localId, fallbackDurationSeconds = 0, captionAnchors = []) {
  if (!uploadStatusEl) return;
  if (!canUseCloudUploads()) {
    if (localId) {
      markLocalRecording(localId, { uploadStatus: "local" });
      loadRecordings();
    }
    uploadStatusEl.textContent = "Not logged in. Saved locally only.";
    return;
  }
  uploadStatusEl.textContent = "Preparing waveform...";
  try {
    const recording = await createRecording(title);
    const [measuredDurationSeconds, waveformPeaks] = await Promise.all([
      getAudioDurationSecondsFromBlob(blob),
      buildWaveformPeaks(blob, 140).catch(() => [])
    ]);
    const durationSeconds = Math.max(
      0,
      Number(measuredDurationSeconds) || 0,
      Number(fallbackDurationSeconds) || 0
    );
    const formData = new FormData();
    const fileName = `${sanitizeFilename(title)}.${getFileExtension(blob.type)}`;
    formData.append("audio", blob, fileName);
    formData.append("title", title);
    if (durationSeconds > 0) {
      formData.append("durationSeconds", String(durationSeconds));
    }
    if (waveformPeaks.length) {
      formData.append("waveformPeaks", JSON.stringify(waveformPeaks));
    }
    if (Array.isArray(captionAnchors) && captionAnchors.length) {
      const safeAnchors = captionAnchors
        .map((entry) => ({
          text: String(entry?.text || "").trim(),
          at: Number(entry?.at)
        }))
        .filter((entry) => entry.text && Number.isFinite(entry.at) && entry.at >= 0)
        .slice(0, 500);
      if (safeAnchors.length) {
        formData.append("captionAnchors", JSON.stringify(safeAnchors));
      }
    }
    uploadStatusEl.textContent = "Uploading recording...";

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

    if (durationSeconds > 0) {
      saveCachedPlaybackMeta(recording.id, { durationSeconds });
    }
    if (waveformPeaks.length) {
      saveCachedPlaybackMeta(recording.id, { peaks: waveformPeaks });
    }
    uploadStatusEl.textContent = `Uploaded: ${recording.id}`;
    if (localId) {
      const previous = localRecordings.get(localId);
      if (previous?.downloadUrl) {
        URL.revokeObjectURL(previous.downloadUrl);
      }
      releasePlayback(localId);
      playbackLoaders.delete(localId);
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
  if (!canUseCloudUploads()) {
    manualStatusEl.textContent = "Login required for manual cloud upload. Recording capture still works locally.";
    return;
  }
  const file = manualFileEl.files?.[0];
  if (!file) {
    manualStatusEl.textContent = "Please choose an audio file first.";
    return;
  }

  manualUploadBtn.disabled = true;
  manualStatusEl.textContent = "Preparing waveform...";

  try {
    const title = manualTitleEl?.value?.trim() || file.name.replace(/\.[^/.]+$/, "");
    const recording = await createRecording(title);
    const [durationSeconds, waveformPeaks] = await Promise.all([
      getAudioDurationSecondsFromBlob(file),
      buildWaveformPeaks(file, 140).catch(() => [])
    ]);
    const formData = new FormData();
    formData.append("audio", file, file.name);
    formData.append("title", title);
    if (durationSeconds > 0) {
      formData.append("durationSeconds", String(durationSeconds));
    }
    if (waveformPeaks.length) {
      formData.append("waveformPeaks", JSON.stringify(waveformPeaks));
    }
    manualStatusEl.textContent = "Uploading file...";

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

async function refreshAuthMe(silent = false) {
  if (!authToken) {
    setAuthState("", null);
    return null;
  }
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/me`);
    const payload = await readResponsePayload(response);
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload?.error;
      if (!silent) {
        if (authStatusEl) authStatusEl.textContent = `Auth check failed: ${message || response.status}`;
      }
      // Keep stored token unless server explicitly rejects session/auth.
      if (response.status === 401 || response.status === 403) {
        setAuthState("", null);
      }
      return null;
    }
    setAuthState(authToken, payload.user || null);
    return payload.user || null;
  } catch (error) {
    if (!silent && authStatusEl) authStatusEl.textContent = `Auth check failed: ${error.message}`;
    return null;
  }
}

async function registerAccount() {
  if (!authRegisterEmailEl || !authRegisterPasswordEl) return;
  const email = String(authRegisterEmailEl.value || "").trim();
  const password = String(authRegisterPasswordEl.value || "");
  const displayName = String(authRegisterNameEl?.value || "").trim();
  if (!email || !password) {
    if (authStatusEl) authStatusEl.textContent = "Registration email and password are required.";
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName })
    });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || `Registration failed (${response.status})`);
    }
    authRegisterPasswordEl.value = "";
    if (authStatusEl) authStatusEl.textContent = "Account created. You can sign in now.";
  } catch (error) {
    if (authStatusEl) authStatusEl.textContent = `Registration failed: ${error.message}`;
  }
}

async function loadAdminAuthSettings() {
  if (!isAdminSession()) return;
  if (!openSignupStatusEl) return;
  openSignupStatusEl.textContent = "Loading signup policy...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/settings/auth`);
    const payload = await readResponsePayload(response);
    if (!response.ok) {
      throw new Error(getApiErrorMessage(response, payload, "Signup settings failed"));
    }
    if (openSignupToggleEl) openSignupToggleEl.checked = Boolean(payload.openSignupEnabled);
    openSignupStatusEl.textContent = `Open signup is ${payload.openSignupEnabled ? "enabled" : "disabled"}.`;
  } catch (error) {
    openSignupStatusEl.textContent = `Signup settings failed: ${error.message}`;
  }
}

async function saveAdminAuthSettings() {
  if (!isAdminSession()) return;
  const openSignupEnabled = Boolean(openSignupToggleEl?.checked);
  if (openSignupStatusEl) openSignupStatusEl.textContent = "Saving signup policy...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/settings/auth`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openSignupEnabled })
    });
    const payload = await readResponsePayload(response);
    if (!response.ok) {
      throw new Error(getApiErrorMessage(response, payload, "Save failed"));
    }
    if (openSignupStatusEl) {
      openSignupStatusEl.textContent = `Open signup is ${payload.openSignupEnabled ? "enabled" : "disabled"}.`;
    }
  } catch (error) {
    if (openSignupStatusEl) openSignupStatusEl.textContent = `Save failed: ${error.message}`;
  }
}

function renderOpenApiKeys(keys) {
  if (!openApiKeyListEl) return;
  const rows = Array.isArray(keys) ? keys : [];
  openApiKeyListEl.innerHTML = "";
  if (!rows.length) {
    openApiKeyListEl.textContent = "No OpenAPI keys yet.";
    return;
  }
  rows.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "recording-item";
    const title = document.createElement("strong");
    title.textContent = `${entry.name} (${entry.prefix}...)`;
    const meta = document.createElement("p");
    meta.className = "hint";
    meta.textContent = `Created: ${formatTimestamp(entry.createdAt)} | Last used: ${entry.lastUsedAt ? formatTimestamp(entry.lastUsedAt) : "Never"} | ${entry.revokedAt ? "Revoked" : "Active"}`;
    const actions = document.createElement("div");
    actions.className = "inline-actions";
    const revokeBtn = document.createElement("button");
    revokeBtn.type = "button";
    revokeBtn.textContent = "Revoke";
    revokeBtn.disabled = Boolean(entry.revokedAt);
    revokeBtn.addEventListener("click", async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/admin/openapi-keys/${encodeURIComponent(String(entry.id || ""))}`, { method: "DELETE" });
        const payload = await readResponsePayload(response);
        if (!response.ok) throw new Error(getApiErrorMessage(response, payload, "Revoke failed"));
        await loadOpenApiKeys();
      } catch (error) {
        if (openApiKeyCreateStatusEl) openApiKeyCreateStatusEl.textContent = `Revoke failed: ${error.message}`;
      }
    });
    actions.appendChild(revokeBtn);
    item.appendChild(title);
    item.appendChild(meta);
    item.appendChild(actions);
    openApiKeyListEl.appendChild(item);
  });
}

async function loadOpenApiKeys() {
  if (!isAdminSession()) return;
  if (!openApiKeyListEl) return;
  openApiKeyListEl.textContent = "Loading OpenAPI keys...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/openapi-keys`);
    const payload = await readResponsePayload(response);
    if (!response.ok) throw new Error(getApiErrorMessage(response, payload, "Load failed"));
    renderOpenApiKeys(payload.keys || []);
  } catch (error) {
    openApiKeyListEl.textContent = `Load failed: ${error.message}`;
  }
}

async function createOpenApiKeyEntry() {
  if (!isAdminSession()) return;
  const name = String(openApiKeyNameEl?.value || "").trim();
  if (!name) {
    if (openApiKeyCreateStatusEl) openApiKeyCreateStatusEl.textContent = "Key name is required.";
    return;
  }
  if (openApiKeyCreateStatusEl) openApiKeyCreateStatusEl.textContent = "Creating key...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/openapi-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const payload = await readResponsePayload(response);
    if (!response.ok) throw new Error(getApiErrorMessage(response, payload, "Create failed"));
    const keyText = String(payload.key || "");
    if (openApiKeyCreateStatusEl) {
      openApiKeyCreateStatusEl.textContent = `Created key (shown once): ${keyText}`;
    }
    if (openApiKeyNameEl) openApiKeyNameEl.value = "";
    await loadOpenApiKeys();
  } catch (error) {
    if (openApiKeyCreateStatusEl) openApiKeyCreateStatusEl.textContent = `Create failed: ${error.message}`;
  }
}

async function loginWithEmailPassword() {
  if (!authEmailEl || !authPasswordEl) return;
  const email = String(authEmailEl.value || "").trim();
  const password = String(authPasswordEl.value || "");
  if (!email || !password) {
    if (authStatusEl) authStatusEl.textContent = "Email and password are required.";
    return;
  }
  if (authStatusEl) authStatusEl.textContent = "Signing in...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || `Login failed (${response.status})`);
    }
    setAuthState(payload.token, payload.user || null);
    authPasswordEl.value = "";
    await loadRecordings({ refreshCloud: true, appendCloud: false });
    await loadBackups();
    if (isAdminSession()) {
      await loadAdminUsers();
      await loadAdminAuthSettings();
      await loadOpenApiKeys();
    }
  } catch (error) {
    if (authStatusEl) authStatusEl.textContent = `Login failed: ${error.message}`;
  }
}

async function logoutCurrentSession() {
  try {
    if (authToken) {
      await fetch(`${API_BASE}/api/v1/auth/logout`, { method: "POST" });
    }
  } catch (_error) {
    // Ignore logout errors.
  } finally {
    setAuthState("", null);
    await loadRecordings({ refreshCloud: true, appendCloud: false });
    await loadBackups();
  }
}

async function changeCurrentPassword() {
  if (!authCurrentPasswordEl || !authNewPasswordEl) return;
  const currentPassword = String(authCurrentPasswordEl.value || "");
  const newPassword = String(authNewPasswordEl.value || "");
  if (!currentPassword || !newPassword) {
    if (authStatusEl) authStatusEl.textContent = "Current and new password are required.";
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || `Change password failed (${response.status})`);
    }
    authCurrentPasswordEl.value = "";
    authNewPasswordEl.value = "";
    if (authStatusEl) authStatusEl.textContent = "Password changed. Please log in again.";
    await logoutCurrentSession();
  } catch (error) {
    if (authStatusEl) authStatusEl.textContent = `Password change failed: ${error.message}`;
  }
}

async function sendForgotPassword() {
  if (!authResetEmailEl) return;
  const email = String(authResetEmailEl.value || "").trim();
  if (!email) {
    if (authStatusEl) authStatusEl.textContent = "Enter email for reset.";
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || `Reset request failed (${response.status})`);
    }
    if (authStatusEl) authStatusEl.textContent = "Reset link request accepted. Check server email logs.";
  } catch (error) {
    if (authStatusEl) authStatusEl.textContent = `Reset request failed: ${error.message}`;
  }
}

async function loadAdminUsers() {
  await refreshAuthMe(true);
  if (!isAdminSession()) return;
  if (!adminUsersCardEl || adminUsersCardEl.hidden) return;
  if (!adminUsersTableBodyEl) return;
  const query = encodeURIComponent(String(adminUsersQueryEl?.value || "").trim());
  const status = encodeURIComponent(String(adminUsersStatusEl?.value || "").trim());
  const role = encodeURIComponent(String(adminUsersRoleEl?.value || "").trim());
  const sort = encodeURIComponent(String(adminUsersSortEl?.value || "created_desc"));
  if (adminUsersStatusTextEl) adminUsersStatusTextEl.textContent = "Loading users...";
  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/users?query=${query}&status=${status}&role=${role}&sort=${sort}&limit=200&offset=0`);
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof payload === "string" ? payload : payload.error;
      throw new Error(message || `Failed loading users (${response.status})`);
    }
    const rows = Array.isArray(payload.users) ? payload.users : [];
    adminUsersTableBodyEl.textContent = "";
    rows.forEach((user) => {
      const userId = encodeURIComponent(String(user?.id || ""));
      if (!userId) return;
      const tr = document.createElement("tr");
      const usage = user.usage || {};
      const activity = user.usage?.lastActivityAt ? formatTimestamp(user.usage.lastActivityAt) : "Never";
      tr.innerHTML = `
        <td>${user.email || ""}</td>
        <td>${user.displayName || ""}</td>
        <td>${user.role || ""}</td>
        <td>${user.status || ""}</td>
        <td>${formatBytes(usage.audioBytesTotal || 0)}</td>
        <td>${usage.recordingsTotal || 0}</td>
        <td>${usage.transcriptCharsTotal || 0}</td>
        <td>${usage.summariesTotal || 0}</td>
        <td>${activity}</td>
        <td><div class="inline-actions"></div><div class="hint user-action-status"></div></td>
      `;
      const actions = tr.querySelector(".inline-actions");
      const actionStatus = tr.querySelector(".user-action-status");
      const setRowStatus = (message) => {
        if (actionStatus) actionStatus.textContent = message;
      };
      const blockBtn = document.createElement("button");
      blockBtn.type = "button";
      blockBtn.textContent = user.status === "blocked" ? "Unblock" : "Block";
      blockBtn.addEventListener("click", async () => {
        try {
          const endpoint = user.status === "blocked" ? "unblock" : "block";
          setRowStatus(`${endpoint}ing...`);
          const response = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/${endpoint}`, { method: "POST" });
          const payload2 = await readResponsePayload(response);
          if (!response.ok) {
            setRowStatus(getApiErrorMessage(response, payload2, `${endpoint} failed`));
            return;
          }
          setRowStatus("");
          await loadAdminUsers();
        } catch (error) {
          setRowStatus(error.message || "Request failed");
        }
      });
      const roleBtn = document.createElement("button");
      roleBtn.type = "button";
      if (user.role === "admin") {
        roleBtn.textContent = "Demote";
        roleBtn.disabled = Boolean(authUser && authUser.id === user.id);
        roleBtn.addEventListener("click", async () => {
          try {
            setRowStatus("Demoting...");
            const response = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/demote`, { method: "POST" });
            const payload2 = await readResponsePayload(response);
            if (!response.ok) {
              setRowStatus(getApiErrorMessage(response, payload2, "Demote failed"));
              return;
            }
            setRowStatus("");
            await loadAdminUsers();
          } catch (error) {
            setRowStatus(error.message || "Demote failed");
          }
        });
      } else {
        roleBtn.textContent = "Promote";
        roleBtn.addEventListener("click", async () => {
          try {
            setRowStatus("Promoting...");
            const response = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/promote`, { method: "POST" });
            const payload2 = await readResponsePayload(response);
            if (!response.ok) {
              setRowStatus(getApiErrorMessage(response, payload2, "Promote failed"));
              return;
            }
            setRowStatus("");
            await loadAdminUsers();
          } catch (error) {
            setRowStatus(error.message || "Promote failed");
          }
        });
      }
      const backupBtn = document.createElement("button");
      backupBtn.type = "button";
      backupBtn.textContent = "Backup";
      backupBtn.addEventListener("click", async () => {
        const response = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/backup`, { method: "POST" });
        const payload2 = await readResponsePayload(response);
        if (!response.ok) {
          alert(`Backup failed: ${(payload2 && payload2.error) || response.status}`);
          return;
        }
        const blob = new Blob([JSON.stringify(payload2.payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = payload2.backupFile || `${user.email}-backup.json`;
        anchor.click();
        URL.revokeObjectURL(url);
      });
      const restoreBtn = document.createElement("button");
      restoreBtn.type = "button";
      restoreBtn.textContent = "Restore";
      restoreBtn.addEventListener("click", async () => {
        const picker = document.createElement("input");
        picker.type = "file";
        picker.accept = ".json,application/json";
        picker.addEventListener("change", async () => {
          const file = picker.files?.[0];
          if (!file) {
            setRowStatus("Restore canceled: backup file required.");
            return;
          }
          try {
            setRowStatus("Restoring...");
            const formData = new FormData();
            formData.append("backup", file, file.name);
            const response = await fetch(`${API_BASE}/api/v1/admin/users/${user.id}/restore`, {
              method: "POST",
              body: formData
            });
            const payload2 = await readResponsePayload(response);
            if (!response.ok) {
              setRowStatus(getApiErrorMessage(response, payload2, "Restore failed"));
              return;
            }
            setRowStatus("Restore complete.");
            await loadAdminUsers();
          } catch (error) {
            setRowStatus(error.message || "Restore failed");
          }
        }, { once: true });
        picker.click();
      });
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", async () => {
        const confirmWord = prompt(`Type DELETE to remove ${user.email}`);
        if (confirmWord !== "DELETE") return;
        const response = await fetch(`${API_BASE}/api/v1/admin/users/${userId}?confirm=DELETE`, { method: "DELETE" });
        const payload2 = await readResponsePayload(response);
        if (!response.ok) {
          alert(`Delete failed: ${(payload2 && payload2.error) || response.status}`);
          return;
        }
        await loadAdminUsers();
      });
      actions.appendChild(blockBtn);
      actions.appendChild(roleBtn);
      actions.appendChild(backupBtn);
      actions.appendChild(restoreBtn);
      actions.appendChild(deleteBtn);
      adminUsersTableBodyEl.appendChild(tr);
    });
    if (adminUsersStatusTextEl) adminUsersStatusTextEl.textContent = `Loaded ${rows.length} users.`;
  } catch (error) {
    if (adminUsersStatusTextEl) adminUsersStatusTextEl.textContent = `Load failed: ${error.message}`;
  }
}

saveApiBaseBtn.addEventListener("click", () => setApiBase(apiBaseInputEl.value));
useEmulatorBtn.addEventListener("click", () => setApiBase("http://10.0.2.2:8080"));
useLocalhostBtn.addEventListener("click", () => setApiBase("http://localhost:8080"));
usePromptBtn.addEventListener("click", () => {
  const value = prompt("Enter API URL (example: http://192.168.1.85:8080)", API_BASE);
  if (value) setApiBase(value);
});
if (mobileSaveApiBaseBtn) {
  mobileSaveApiBaseBtn.addEventListener("click", () => {
    const next = String(mobileApiBaseInputEl?.value || "").trim();
    setApiBase(next);
  });
}
if (mobileUsePromptBtn) {
  mobileUsePromptBtn.addEventListener("click", () => {
    const value = prompt("Enter server API URL (example: https://rec.gamedirection.net/api)", API_BASE);
    if (value) setApiBase(value);
  });
}

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
    if (aiSettingsStatusEl) {
      aiSettingsStatusEl.textContent = `Auto transcribe: ${autoTranscribeEnabled ? "On" : "Off"} | Auto summarize: ${autoSummarizeEnabled ? "On" : "Off"}`;
    }
  });
}
if (autoSummarizeToggleEl) {
  autoSummarizeToggleEl.addEventListener("change", () => {
    autoSummarizeEnabled = Boolean(autoSummarizeToggleEl.checked);
    localStorage.setItem(AUTO_SUMMARIZE_KEY, String(autoSummarizeEnabled));
    if (aiSettingsStatusEl) {
      aiSettingsStatusEl.textContent = `Auto transcribe: ${autoTranscribeEnabled ? "On" : "Off"} | Auto summarize: ${autoSummarizeEnabled ? "On" : "Off"}`;
    }
  });
}
if (identifyVoicesToggleEl) {
  identifyVoicesToggleEl.addEventListener("change", () => {
    identifyVoicesEnabled = Boolean(identifyVoicesToggleEl.checked);
    localStorage.setItem(IDENTIFY_VOICES_KEY, String(identifyVoicesEnabled));
    if (aiSettingsStatusEl) {
      aiSettingsStatusEl.textContent = `Identify voices: ${identifyVoicesEnabled ? "On" : "Off"}`;
    }
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

if (liveCaptionsToggleEl) {
  liveCaptionsToggleEl.checked = Boolean(liveCaptionsEnabled);
  liveCaptionsToggleEl.addEventListener("change", (event) => {
    liveCaptionsEnabled = Boolean(event.target.checked);
    localStorage.setItem(LIVE_CAPTIONS_KEY, String(liveCaptionsEnabled));
    if (!liveCaptionsEnabled) {
      stopLiveCaptions({ keepFinal: false });
    }
    if (liveCaptionsPanelEl) {
      liveCaptionsPanelEl.hidden = !liveCaptionsEnabled;
    }
    if (liveCaptionsEnabled) {
      const captionsSupported = isLiveCaptionsSupported();
      setLiveCaptionsStatus(captionsSupported ? "Live captions: ready" : "Live captions unavailable in this browser.");
      renderLiveCaptionsText();
      if (mediaRecorder && mediaRecorder.state === "recording") {
        startLiveCaptions();
      }
    }
  });
}

if (gpsLocationToggleEl) {
  gpsLocationToggleEl.checked = Boolean(gpsLocationEnabled);
  gpsLocationToggleEl.addEventListener("change", (event) => {
    gpsLocationEnabled = Boolean(event.target.checked);
    localStorage.setItem(GPS_LOCATION_KEY, String(gpsLocationEnabled));
    updatePermissionStatus();
  });
}

if (debugTranscriptTimestampsToggleEl) {
  debugTranscriptTimestampsToggleEl.checked = Boolean(debugTranscriptTimestampsEnabled);
  debugTranscriptTimestampsToggleEl.addEventListener("change", (event) => {
    debugTranscriptTimestampsEnabled = Boolean(event.target.checked);
    localStorage.setItem(DEBUG_TRANSCRIPT_TIMESTAMPS_KEY, String(debugTranscriptTimestampsEnabled));
    loadRecordings({ refreshCloud: false, preserveScroll: true });
  });
}

if (recordStartBtn && recordStopBtn) {
  const supported = Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const captionsSupported = isLiveCaptionsSupported();
  setRecordingUiState({
    message: supported ? "Ready to record." : "Audio recording is not supported in this browser.",
    startDisabled: !supported,
    stopDisabled: true,
    isRecording: false
  });
  if (liveCaptionsPanelEl) {
    liveCaptionsPanelEl.hidden = !liveCaptionsEnabled;
  }
  if (liveCaptionsEnabled) {
    if (captionsSupported) {
      setLiveCaptionsStatus("Live captions: ready");
    } else {
      setLiveCaptionsStatus("Live captions unavailable in this browser.");
    }
    renderLiveCaptionsText();
  }
  recordStartBtn.addEventListener("click", toggleRecordPause);
  recordStopBtn.addEventListener("click", stopRecording);

  const beginSaveHold = () => {
    const recorder = mediaRecorder;
    if (!recorder || recorder.state === "inactive" || recordStopBtn.disabled) return;
    if (saveHoldTimer) clearTimeout(saveHoldTimer);
    saveHoldArmed = true;
    if (recordStatusEl) {
      if (!canUseCloudUploads()) {
        recordStatusEl.textContent = "Not logged in. Save will stay local.";
      } else {
        recordStatusEl.textContent = uploadEnabled
          ? "Hold Save for 3s to force local-only save."
          : "Hold Save for 3s to force upload.";
      }
    }
    saveHoldTimer = setTimeout(() => {
      if (!saveHoldArmed) return;
      if (!canUseCloudUploads()) {
        stopActionOverride = "local";
      } else {
        stopActionOverride = uploadEnabled ? "local" : "upload";
      }
      if (recordStatusEl) {
        if (!canUseCloudUploads()) {
          recordStatusEl.textContent = "Override set: this save will stay local.";
        } else {
          recordStatusEl.textContent = uploadEnabled
            ? "Override set: this save will stay local."
            : "Override set: this save will upload.";
        }
      }
    }, 3000);
  };

  const endSaveHold = () => {
    saveHoldArmed = false;
    if (saveHoldTimer) {
      clearTimeout(saveHoldTimer);
      saveHoldTimer = null;
    }
  };

  recordStopBtn.addEventListener("pointerdown", beginSaveHold);
  recordStopBtn.addEventListener("pointerup", endSaveHold);
  recordStopBtn.addEventListener("pointercancel", endSaveHold);
  recordStopBtn.addEventListener("pointerleave", endSaveHold);
}

if (micEnableBtn) {
  micEnableBtn.addEventListener("click", requestMicrophonePermission);
}

if (refreshRecordingsBtn) {
  refreshRecordingsBtn.addEventListener("click", () => {
    loadRecordings({ refreshCloud: true, appendCloud: false });
  });
}

updatePermissionStatus();

if (recordingsSearchEl) {
  recordingsSearchEl.addEventListener("input", () => {
    cloudQuery = String(recordingsSearchEl.value || "").trim();
    loadRecordings({ refreshCloud: true, appendCloud: false });
  });
}

if (createBackupBtn) {
  createBackupBtn.addEventListener("click", createBackup);
}

if (saveTimeZoneBtn) {
  saveTimeZoneBtn.addEventListener("click", () => {
    const nextValue = (timeZoneInputEl?.value || "").trim();
    if (!nextValue) {
      if (timeZoneStatusEl) timeZoneStatusEl.textContent = "Enter a valid IANA timezone.";
      return;
    }
    if (!validateTimeZone(nextValue)) {
      if (timeZoneStatusEl) timeZoneStatusEl.textContent = `Invalid timezone: ${nextValue}`;
      return;
    }
    preferredTimeZone = nextValue;
    localStorage.setItem(TIME_ZONE_KEY, preferredTimeZone);
    renderTimeZoneSettings();
    applyDefaultRecordingTitle(true);
    loadRecordings();
  });
}

if (useSystemTimeZoneBtn) {
  useSystemTimeZoneBtn.addEventListener("click", () => {
    preferredTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    localStorage.setItem(TIME_ZONE_KEY, preferredTimeZone);
    renderTimeZoneSettings();
    applyDefaultRecordingTitle(true);
    loadRecordings();
  });
}

if (saveDeadAirThresholdBtn) {
  saveDeadAirThresholdBtn.addEventListener("click", () => {
    deadAirThresholdSeconds = sanitizeDeadAirThresholdSeconds(deadAirThresholdInputEl?.value);
    localStorage.setItem(DEAD_AIR_THRESHOLD_KEY, String(deadAirThresholdSeconds));
    renderDeadAirSettings();
  });
}

if (deadAirThresholdInputEl) {
  deadAirThresholdInputEl.addEventListener("change", () => {
    deadAirThresholdSeconds = sanitizeDeadAirThresholdSeconds(deadAirThresholdInputEl.value);
    localStorage.setItem(DEAD_AIR_THRESHOLD_KEY, String(deadAirThresholdSeconds));
    renderDeadAirSettings();
  });
}

if (manualUploadBtn) {
  manualUploadBtn.addEventListener("click", uploadManualFile);
}
if (authLoginBtn) {
  authLoginBtn.addEventListener("click", loginWithEmailPassword);
}
if (authRegisterBtn) {
  authRegisterBtn.addEventListener("click", registerAccount);
}
if (authLogoutBtn) {
  authLogoutBtn.addEventListener("click", logoutCurrentSession);
}
if (authChangePasswordBtn) {
  authChangePasswordBtn.addEventListener("click", changeCurrentPassword);
}
if (authForgotPasswordBtn) {
  authForgotPasswordBtn.addEventListener("click", sendForgotPassword);
}
if (adminUsersRefreshBtn) {
  adminUsersRefreshBtn.addEventListener("click", loadAdminUsers);
}
if (adminUsersQueryEl) adminUsersQueryEl.addEventListener("input", loadAdminUsers);
if (adminUsersStatusEl) adminUsersStatusEl.addEventListener("change", loadAdminUsers);
if (adminUsersRoleEl) adminUsersRoleEl.addEventListener("change", loadAdminUsers);
if (adminUsersSortEl) adminUsersSortEl.addEventListener("change", loadAdminUsers);
if (saveOpenSignupBtn) {
  saveOpenSignupBtn.addEventListener("click", saveAdminAuthSettings);
}
if (createOpenApiKeyBtn) {
  createOpenApiKeyBtn.addEventListener("click", createOpenApiKeyEntry);
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
});

window.addEventListener("scroll", queueRecordingsViewportRefresh, { passive: true });
window.addEventListener("resize", queueRecordingsViewportRefresh);

renderApiBase();
renderAiSettings();
renderTimeZoneSettings();
renderDeadAirSettings();
applyAdminVisibility();
applySettingsVisibility();
applyDefaultRecordingTitle(true);
(async () => {
  await ensureReachableApiBase();
  await refreshAuthMe(true);
  await checkHealth();
  await loadVersion();
  await loadBranding();
  await loadRecordings({ refreshCloud: true, appendCloud: false });
  await loadBackups();
  if (isAdminSession()) {
    await loadAdminUsers();
    await loadAdminAuthSettings();
    await loadOpenApiKeys();
  }
  setActiveTab(localStorage.getItem(TAB_KEY) || "record");
})();





