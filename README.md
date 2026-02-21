# Open-Voice-Journal

Open-Voice-Journal is a self-hosted, open-source transcription platform for teams that need secure voice memo workflows across web, PWA, and mobile.

## Vision

Capture audio, transcribe it, identify speakers, and convert conversations into searchable records and structured summaries.

Core product goals:
- Record and upload audio from phone, tablet, and desktop workflows.
- Transcribe recordings with speaker diarization.
- Click transcript text and jump to the matching audio timestamp.
- Export audio, transcripts, and subtitle formats (`txt`, `md`, `srt`, `vtt`).
- Re-assign speaker identities and attach contact information.
- Extract conversation segments and remove silence.
- Summarize with pluggable AI providers and user-selected models.
- Search voice memos quickly by metadata, keywords, and semantic meaning.
- Archive, delete, backup, and restore recordings.

## Scope

### v1
- Web app + PWA + Android app (Capacitor).
- Upload, transcription, diarization, searchable transcript view.
- Summarization with provider/model selection.
- Export, archive/delete, backup/restore APIs.
- Server-admin backend GUI baseline.

### v1.x
- iOS packaging hardening.
- Chrome extension.
- Additional local mobile model options.

### Future (out of scope)
- Music identification.

## Architecture

### Client surface
- `apps/web` (planned React web/PWA)
- `apps/mobile` (planned Capacitor Android)
- `apps/admin` (planned server-admin GUI)
- `frontend/` (current prototype settings shell)

### Backend surface
- `backend/src/app.js` Express API with REST + WebSocket-ready event endpoints.
- PostgreSQL-backed persistence for recordings, provider configs, and summaries.
- Async job model for transcription and summarization.

### Core services (Docker Compose)
- `api`: Node.js REST API.
- `worker`: background processing.
- `postgres`: metadata, FTS, pgvector.
- `redis`: job queue/event backbone.
- `keycloak`: OIDC auth and RBAC.
- `ollama`: local model runtime.
- `minio`: object storage for recordings/exports.
- `traefik`: HTTPS edge with Let's Encrypt (prod profile).

## AI Provider Strategy

Default summarization provider is local Ollama with `qwen2.5:7b-instruct`.

Users can choose summarization provider/model per workspace and per summary request.

Built-in provider types:
- `ollama_local`
- `ollama_cloud`
- `openai`
- `anthropic`
- `deepseek`
- `custom_openai` (OpenAI-compatible endpoint)

Security and governance:
- Provider secrets are stored as encrypted secret references.
- Secrets are redacted in logs.
- Server admins can allow/deny providers and models.
- Optional egress policy can restrict summarization to local-only.

## OpenAPI and Swagger

The backend serves OpenAPI docs and Swagger UI for contract-first development:
- OpenAPI JSON: `GET /api/openapi.json`
- Swagger UI: `GET /api/docs`

## Initial API Contracts

### Provider registry
- `GET /api/v1/ai/providers`
- `POST /api/v1/ai/providers`
- `PATCH /api/v1/ai/providers/:id`

### Summaries
- `POST /api/v1/recordings/:id/summaries`
- `GET /api/v1/summaries/:id`

`POST /api/v1/recordings/:id/summaries` payload:

```json
{
  "provider": "ollama_local",
  "model": "qwen2.5:7b-instruct",
  "template": "action_items",
  "temperature": 0.2,
  "max_tokens": 900
}
```

### Recording baseline
- `POST /api/v1/recordings`
- `GET /api/v1/recordings/:id`
- `POST /api/v1/recordings/:id/transcribe`

## Data Model Additions

Current bootstrap tables:
- `recordings`
- `ai_provider_configs`
- `summaries`

Planned schema entities:
- `ai_model_policies`
- `summary_jobs`
- `secret_store_refs`
- `transcript_segments`, `speakers`, `exports`, `audit_logs`

## Security

- OIDC auth via Keycloak.
- Role model: user-admin (own workspace) + server-admin.
- TLS encryption in transit (Traefik + Let's Encrypt).
- Encrypted provider secrets at rest.
- Audit logs for admin policy changes and model usage.

## Local Development (Windows Docker Desktop)

### 1) Configure env

```bash
copy .env.example .env
```

### 2) Start stack

```bash
docker compose up -d
```

### 3) Verify API + docs

- API health: `http://localhost:8080/api/health`
- OpenAPI JSON: `http://localhost:8080/api/openapi.json`
- Swagger UI: `http://localhost:8080/api/docs`

### 4) Run smoke test

```bash
cd backend
npm install
npm run smoke
```

## Roadmap

1. Docs and architecture baseline.
2. Backend contracts + provider framework.
3. Recording + transcription + diarization workers.
4. Search, export, archive/restore.
5. Web/PWA + Android productization.
6. iOS + extension in v1.x.

## Contributing

- Open issues for architecture and contract changes before implementation.
- Keep provider adapters behind `SummaryProvider` interface.
- Add tests for policy enforcement and provider error handling.

## License

MIT

## Basic Web Test

- Start core services + website:
  - `docker compose up -d api worker postgres redis ollama web`
- Open the test site:
  - `http://localhost:8088`
- The page can:
  - check API health
  - create a recording
  - queue a transcription job

## Android APK Test (Basic)

- Generated debug APK path:
  - `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- For emulator, API host fallback is `10.0.2.2:8080`.
- For a physical phone on LAN, access web UI via `http://<your-pc-ip>:8088` and ensure API is reachable at `<your-pc-ip>:8080`.

## APK Update-Friendly Build

To allow install-over-update (no uninstall required), Android builds now use:
- stable app signing key (`mobile/android/app/debug-keystore.jks`)
- incremented app version code in `mobile/android/app/build.gradle`

When creating a new APK, bump `versionCode` and `versionName` in:
- `mobile/android/app/build.gradle`

Then rebuild APK and install it over the existing app.
