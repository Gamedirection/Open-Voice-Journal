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
import { checkDbHealth, initDb } from "./store/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const openApiPath = path.join(rootDir, "docs", "openapi.yaml");
const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, "utf8"));

const app = express();
const port = Number(process.env.API_PORT || 8080);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", async (_req, res) => {
  const db = await checkDbHealth();
  const status = db ? "ok" : "degraded";
  res.status(db ? 200 : 503).json({ status, db, service: "open-voice-journal-api" });
});

app.get("/api/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use("/api/v1/ai/providers", providerRouter);
app.use("/api/v1", summaryRouter);
app.use("/api/v1", recordingsRouter);

async function start() {
  await initDb();
  app.listen(port, () => {
    console.log(`[api] listening on :${port}`);
  });
}

start().catch((error) => {
  console.error("[api] failed to start", error);
  process.exit(1);
});
