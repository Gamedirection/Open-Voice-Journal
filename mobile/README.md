# Mobile (Capacitor) Quick Start

This folder wraps the `../frontend` web app into an Android app.

## Prerequisites

- Node.js 20+
- Android Studio
- Android SDK + platform tools
- Java 17

## Build Steps

1. Install dependencies:
   npm install

2. Add Android platform (first time only):
   npx cap add android

3. Sync web assets to Android project:
   npm run cap:sync

4. Build debug APK:
   npm run apk:debug

APK output path:
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

## Test with local backend

- Keep backend running on host port `8080`.
- Android emulator uses `10.0.2.2:8080` to reach host.
- Physical phone should use your PC LAN IP in `frontend/script.js`.
