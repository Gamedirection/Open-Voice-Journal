# Changelog

All notable changes to Open-Voice-Journal will be documented in this file.

## v0.3.3 - 2026-02-23

- Added mobile-friendly **Select Server** input in the Account card so users can set and save desired API/server URL on-device.
- Persisted server selection in local storage and mirrored it across mobile/server URL fields.
- Improved mobile auth persistence behavior so transient API/network failures do not force logout; token is cleared only on explicit `401/403`.
- Built and published refreshed Android debug APK `1.0.5` (`versionCode 6`) to releases.

## v0.3.2 - 2026-02-23

- Added stricter logged-out behavior: local-only recording/uploads and session-local recordings view.
- Added dedicated Account UI visibility rules and hid non-account settings when logged out.
- Hardened admin action UX with better API error surfacing and safer non-JSON response handling.
- Updated restore UX to require selecting a backup file for per-user restore.
- Added admin settings/OpenAPI key response parsing hardening to avoid HTML/JSON parse crashes.
- Added production image tag support in `docker-compose.prod-server.yml` via `OVJ_IMAGE_TAG`.
- Updated production server env examples for `rec.gamedirection.net`.
- Updated backend/OpenAPI version metadata to `v0.3.2`.

## v0.3.1 - 2026-02-23

- Added dedicated **Account** settings card with login/register/change-password/forgot-password UX.
- Moved timezone controls into the main **Settings** card.
- Added admin-only UI gating for **API Connections**, **Server Backup**, and **Users & Data Governance**.
- Added admin open-signup policy controls (`auth.open_signup_enabled`) and registration enforcement (`signup_disabled`).
- Added admin user role actions: promote/demote with safeguards (`cannot_self_demote`, `cannot_demote_last_active_admin`).
- Added per-admin OpenAPI keys (create/list/revoke) with hash storage and one-time plaintext return on create.
- Protected `/api/openapi.json` with admin bearer auth or valid `X-OpenAPI-Key`.
- Added DB support for `app_settings` and `openapi_keys`, plus audit events for new admin actions.

## v0.3.0 - 2026-02-22

- Added immediate playback preload improvements with cached duration/waveform metadata.
- Added waveform + scrubber loading indicators and fixed playback restart behavior at end of audio.
- Added clickable transcript words and speaker transcript words with seek-to-word playback.
- Added active word highlighting during playback and improved timing alignment pipeline.
- Added sentence/word timing fallback improvements using provider timings, CC anchors, and waveform weighting.
- Added live captions while recording, including settings toggle and auto-scroll caption panel.
- Added caption timestamp persistence and per-recording `.srt` caption export (`CC` icon).
- Added dead-air removal tool to generate new `[Dead Air Removed]` recordings with re-transcribe + summary.
- Added recording tags UI and AI-generated 1-2 word tags from transcript content.
- Added recordings search by title/transcript/tags and paginated cloud loading.
- Added hold-to-save behavior override for local/cloud save flows.
- Added consolidated Settings/Documentation layout updates and refreshed transcript action labels.
- Added API deduplication for transcription queue requests (prevents duplicate jobs per recording while running).
- Added new recording metadata endpoints and updates (`/tags`, `/speakers`, `/captions`) and refreshed OpenAPI docs.
- Bumped backend/mobile/OpenAPI versions and Android app version code/name for release.

## v0.1.2 - 2026-02-21

- Added cloud and local recording deletion actions with confirmation warnings.
- Added server backup management in Settings: create, download, restore, and delete backups.
- Added local Whisper-backed transcription configuration and processing support.
- Added recording automation toggles: auto-transcribe after upload and auto-summarize after transcription.
- Added per-recording queued processing state with improved loading bars.
- Added transcript export/copy tools and AI summary export/copy tools.
- Added markdown-rendered AI summary preview and persistent summary section under recordings.
- Added editable summary prompt in Settings with save and restore-defaults controls.

## v0.1.0 - 2026-02-21

- Added basic web test surface at `http://localhost:8088` for API health and job flow testing.
- Added Capacitor Android scaffold and debug APK workflow.
- Added in-app API URL controls for emulator/LAN/custom endpoint switching.
- Added Android cleartext + network security configuration for local HTTP API calls from mobile app.
- Added mixed-content WebView setting in `MainActivity` so `https://localhost` WebView can call local HTTP API.
- Added stable Android signing setup and version bump strategy for update-in-place APK installs.

## v0.1.1 - 2026-02-21

- Added manual audio upload flow to the web test app.
- Added API base auto-detection for common swarm port layout (`3090` web -> `3089` API).
- Added Swagger viewer container option in Docker Compose.
- Updated OpenAPI contract with recording list and upload endpoints.

## v0.0.0 - 2026-02-20

- Initial project scaffolding.
- Added architecture README and Docker Compose baseline.
- Added backend API skeleton with OpenAPI and Swagger UI endpoints.
- Added pluggable summarization provider framework and policy controls.
- Added frontend prototype for provider configuration.
