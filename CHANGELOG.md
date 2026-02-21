# Changelog

All notable changes to Open-Voice-Journal will be documented in this file.

## v0.1.0 - 2026-02-21

- Added basic web test surface at `http://localhost:8088` for API health and job flow testing.
- Added Capacitor Android scaffold and debug APK workflow.
- Added in-app API URL controls for emulator/LAN/custom endpoint switching.
- Added Android cleartext + network security configuration for local HTTP API calls from mobile app.
- Added mixed-content WebView setting in `MainActivity` so `https://localhost` WebView can call local HTTP API.
- Added stable Android signing setup and version bump strategy for update-in-place APK installs.

## v0.0.0 - 2026-02-20

- Initial project scaffolding.
- Added architecture README and Docker Compose baseline.
- Added backend API skeleton with OpenAPI and Swagger UI endpoints.
- Added pluggable summarization provider framework and policy controls.
- Added frontend prototype for provider configuration.
