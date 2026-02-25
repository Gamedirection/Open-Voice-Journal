# Open-Voice-Journal

Open-Voice-Journal is a self-hosted, open-source transcription platform for teams that need secure voice memo workflows across web, PWA, and mobile.

All hostnames, domains, and environment values shown in this README use anonymized examples. Replace them with your real production values.

## Latest Release

- Current backend/API version: `v0.3.2`
- Current Android app version: `1.0.5` (`versionCode 6`)
- Current mobile package version: `0.3.3`
- Release date: `2026-02-23`

Recent release highlights:
- mobile "Select Server" input with persisted API URL selection
- improved mobile session persistence (no forced logout on transient connectivity failures)
- admin-gated settings and account card layout improvements
- per-admin OpenAPI key lifecycle + protected `/api/openapi.json`
- admin promote/demote safeguards and open-signup controls
- faster scrubber preload and waveform playback behavior
- clickable transcript + active word highlighting
- live captions with subtitle (`.srt`) export
- dead-air removal workflow with automatic re-transcription/summarization
- tags/search/pagination and queue deduplication improvements

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
- OpenAPI JSON: `GET /api/openapi.json` (admin bearer token or `X-OpenAPI-Key` required)
- Swagger UI: `GET /api/docs`
- Standalone Swagger viewer (Docker): `http://localhost:8090` (prod-server uses `:3091`)

## Auth and Admin Governance

- Dedicated account UX supports login/logout, registration (when enabled), password change, and forgot-password flow.
- Admin-only settings/tools are hidden from non-admin users:
  - API Connections
  - Server Backup
  - Users & Data Governance
- Open signup is controlled by admins via `auth.open_signup_enabled`.
- Admins can promote/demote users with guardrails:
  - self-demotion blocked
  - last active admin cannot be demoted
- Per-admin OpenAPI keys can be created/revoked and are hash-stored server-side.

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
- `GET /api/v1/recordings`
- `DELETE /api/v1/recordings/:id`
- `POST /api/v1/recordings/:id/upload`
- `GET /api/v1/recordings/:id/file`
- `POST /api/v1/recordings/:id/transcribe`

### Backups
- `GET /api/v1/backups`
- `POST /api/v1/backups`
- `GET /api/v1/backups/:name/download`
- `DELETE /api/v1/backups/:name`
- `POST /api/v1/backups/:name/restore`

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

Set transcription provider values in `.env` (required for real transcripts):
- `TRANSCRIPTION_API_BASE_URL` (example: `https://api.openai.com`)
- `TRANSCRIPTION_ENDPOINT_PATH` (default: `/v1/audio/transcriptions`)
- `TRANSCRIPTION_MODEL` (default: `whisper-1`)
- `TRANSCRIPTION_API_KEY` (API key for your transcription provider)
- Optional: `TRANSCRIPTION_LANGUAGE`, `TRANSCRIPTION_TIMEOUT_MS` (set to `0` to disable timeout)

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

## Major Milestones

- 2026-02-21: Backend contract skeleton, provider config endpoints, and web test surface.
- 2026-02-21: Android scaffold with update-friendly APK signing and LAN API controls.
- 2026-02-21: Manual upload flow in web test app plus Swagger viewer container option.

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
  - upload a file from disk (manual upload)
  - auto-transcribe/auto-summarize uploaded recordings (configurable in Settings)
  - preview transcript and markdown-rendered AI summary
  - export transcript/summary as `.md` or copy to clipboard
  - delete local/cloud recordings with confirmation warnings
  - create/download/restore/delete server backups

## Mobile Build Notes

See `mobile/README.md` for Android build, update, and Docker-based APK instructions.


## Production Notes

- If the web app and API are exposed on different ports (example: web `:3090`, API `:3089`), set the API URL in the Settings tab to `http://<server-ip>:3089`.
- HTTPS deployments should expose the API via the same origin (reverse proxy `/api`) to avoid mixed-content blocking.

### Prod Server Compose (`ovj.example.com`)

- `docker-compose.prod-server.yml` uses GHCR images for `web`, `api`, and `worker`.
- Image tag is controlled with `OVJ_IMAGE_TAG` (defaults to `latest`). Published tags include `latest` and `2026-02-25`.
- Recommended `server.env` values:
  - `DOMAIN=ovj.example.com`
  - `APP_PUBLIC_BASE_URL=https://ovj.example.com`
  - `OVJ_IMAGE_TAG=2026-02-25`
- If you run Nginx Proxy Manager separately, keep host port mapping:
  - web `3090 -> 80`
  - api `3089 -> 8080`
