import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { providerRouter } from "./routes/providers.js";
import { summaryRouter } from "./routes/summaries.js";
import { recordingsRouter } from "./routes/recordings.js";
import { jobsRouter } from "./routes/jobs.js";
import { backupsRouter } from "./routes/backups.js";
import { authRouter } from "./routes/auth.js";
import { adminUsersRouter } from "./routes/adminUsers.js";
import { adminSettingsRouter } from "./routes/adminSettings.js";
import { checkStoreHealth, getActiveBackend, initStore } from "./store/store.js";
import { ensureDefaultAdmin, requireAdmin, requireAuth, requireOpenApiAccess } from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const projectDir = path.resolve(rootDir, "..");
const openApiPath = path.join(rootDir, "docs", "openapi.yaml");
const changelogPath = path.join(projectDir, "CHANGELOG.md");
const fallbackChangelogPath = path.join(rootDir, "CHANGELOG.md");
const backendPackagePath = path.join(rootDir, "package.json");

function readTextFileStripBom(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
}

const openApiDocument = YAML.parse(readTextFileStripBom(openApiPath));

const app = express();
const port = Number(process.env.API_PORT || 8080);

function compareSemver(a, b) {
  const partsA = a.split(".").map((value) => Number(value));
  const partsB = b.split(".").map((value) => Number(value));
  const max = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < max; i += 1) {
    const left = partsA[i] || 0;
    const right = partsB[i] || 0;
    if (left > right) return 1;
    if (left < right) return -1;
  }
  return 0;
}

function resolveVersionInfo() {
  const backendPackage = JSON.parse(readTextFileStripBom(backendPackagePath));
  const changelogFile = fs.existsSync(changelogPath)
    ? changelogPath
    : (fs.existsSync(fallbackChangelogPath) ? fallbackChangelogPath : null);
  const changelog = changelogFile ? readTextFileStripBom(changelogFile) : "";
  const matches = changelog
    ? Array.from(changelog.matchAll(/^##\s+v?(\d+\.\d+\.\d+)(?:\s*-\s*(\d{4}-\d{2}-\d{2}))?/gm))
    : [];

  let latest = null;
  for (const match of matches) {
    const candidate = { version: match[1], date: match[2] || null };
    if (!latest || compareSemver(candidate.version, latest.version) > 0) {
      latest = candidate;
    }
  }

  return {
    version: latest?.version || backendPackage.version || "0.0.0",
    source: latest ? "changelog" : "backend/package.json",
    releaseDate: latest?.date || null
  };
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", async (_req, res) => {
  const health = await checkStoreHealth();
  res.status(health.status === "ok" ? 200 : 503).json({
    status: health.status,
    db: health.db,
    storage: health.storage,
    fallback: health.fallback,
    reason: health.reason || null,
    service: "open-voice-journal-api"
  });
});

app.get("/api/version", (_req, res) => {
  try {
    const versionInfo = resolveVersionInfo();
    res.json({
      ...versionInfo,
      service: "open-voice-journal-api",
      backend: getActiveBackend()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/openapi.json", requireOpenApiAccess, (_req, res) => {
  res.json(openApiDocument);
});

app.get("/api/v1/public/branding", (_req, res) => {
  res.json({
    appName: "Open-Voice-Journal",
    brandLogoUrl: String(process.env.APP_BRAND_LOGO_URL || "").trim()
  });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use("/api/v1", authRouter);
app.use("/api/v1/ai/providers", requireAuth, requireAdmin, providerRouter);
app.use("/api/v1", requireAuth, summaryRouter);
app.use("/api/v1", requireAuth, recordingsRouter);
app.use("/api/v1", requireAuth, jobsRouter);
app.use("/api/v1", requireAuth, requireAdmin, backupsRouter);
app.use("/api/v1", requireAuth, requireAdmin, adminUsersRouter);
app.use("/api/v1", requireAuth, requireAdmin, adminSettingsRouter);

async function start() {
  await initStore();
  await ensureDefaultAdmin();
  app.listen(port, () => {
    console.log(`[api] listening on :${port}`);
  });
}

start().catch((error) => {
  console.error("[api] failed to start", error);
  process.exit(1);
});

