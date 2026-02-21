# Changelog

All notable changes to Open-Voice-Journal will be documented in this file.

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
