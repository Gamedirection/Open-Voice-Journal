import * as postgresStore from "./postgresStore.js";
import * as inMemoryStore from "./inMemoryStore.js";
import { checkDbHealth, initDb } from "./db.js";

const configuredBackend = (process.env.STORE_BACKEND || "postgres").trim().toLowerCase();
const allowFallback = String(process.env.STORE_FALLBACK_TO_MEMORY || "true").toLowerCase() !== "false";

let activeBackend = configuredBackend === "memory" ? "memory" : "postgres";
let fallbackReason = null;

function getStoreApi(backend) {
  return backend === "memory" ? inMemoryStore : postgresStore;
}

function shouldFallback(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("connect") ||
    message.includes("econnrefused") ||
    message.includes("timeout") ||
    message.includes("does not exist") ||
    message.includes("password authentication failed")
  );
}

async function runStoreOperation(operation, ...args) {
  const primary = getStoreApi(activeBackend);
  if (typeof primary[operation] !== "function") {
    throw new Error(`store operation '${operation}' is not implemented for backend '${activeBackend}'`);
  }

  try {
    return await primary[operation](...args);
  } catch (error) {
    if (activeBackend === "memory" || !allowFallback || !shouldFallback(error)) {
      throw error;
    }
    activeBackend = "memory";
    fallbackReason = error.message || String(error);
    console.warn(`[store] falling back to in-memory store: ${fallbackReason}`);

    const fallback = getStoreApi(activeBackend);
    if (typeof fallback[operation] !== "function") {
      throw error;
    }
    return fallback[operation](...args);
  }
}

export async function initStore() {
  if (activeBackend === "memory") {
    return { backend: activeBackend, fallback: false };
  }

  try {
    await initDb();
    return { backend: activeBackend, fallback: false };
  } catch (error) {
    if (!allowFallback) throw error;
    activeBackend = "memory";
    fallbackReason = error.message || String(error);
    console.warn(`[store] init failed, using in-memory store: ${fallbackReason}`);
    return { backend: activeBackend, fallback: true, reason: fallbackReason };
  }
}

export async function checkStoreHealth() {
  if (activeBackend === "memory") {
    return {
      status: "degraded",
      db: false,
      storage: "memory",
      fallback: true,
      reason: fallbackReason || "postgres unavailable"
    };
  }

  const db = await checkDbHealth();
  return {
    status: db ? "ok" : "degraded",
    db,
    storage: "postgres",
    fallback: false
  };
}

export function getActiveBackend() {
  return activeBackend;
}

export const createRecording = (...args) => runStoreOperation("createRecording", ...args);
export const getRecording = (...args) => runStoreOperation("getRecording", ...args);
export const updateRecordingStatus = (...args) => runStoreOperation("updateRecordingStatus", ...args);
export const updateRecordingMetadata = (...args) => runStoreOperation("updateRecordingMetadata", ...args);
export const listRecordings = (...args) => runStoreOperation("listRecordings", ...args);
export const deleteRecording = (...args) => runStoreOperation("deleteRecording", ...args);
export const createSummary = (...args) => runStoreOperation("createSummary", ...args);
export const getSummary = (...args) => runStoreOperation("getSummary", ...args);
export const listSummariesByRecording = (...args) => runStoreOperation("listSummariesByRecording", ...args);
export const listProviderConfigs = (...args) => runStoreOperation("listProviderConfigs", ...args);
export const upsertProviderConfig = (...args) => runStoreOperation("upsertProviderConfig", ...args);
export const patchProviderConfig = (...args) => runStoreOperation("patchProviderConfig", ...args);
export const createJob = (...args) => runStoreOperation("createJob", ...args);
export const getJob = (...args) => runStoreOperation("getJob", ...args);
export const listJobs = (...args) => runStoreOperation("listJobs", ...args);
export const claimNextQueuedJob = (...args) => runStoreOperation("claimNextQueuedJob", ...args);
export const completeJob = (...args) => runStoreOperation("completeJob", ...args);
export const failJob = (...args) => runStoreOperation("failJob", ...args);
