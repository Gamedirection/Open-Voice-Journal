# Mobile (Capacitor) Quick Start

This folder wraps the `../frontend` web app into an Android app.

## Prerequisites

- Node.js 20+
- Android Studio
- Android SDK + platform tools
- Java 17

## Build Steps (Local)

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

## Android App Updates and Builds (Docker)

This builds the APK in a one-off Docker container while using your **host Android SDK**. It is the recommended path for repeatable updates, especially when you want to keep the same signing key for install-over-update.

Prereqs:
- Docker Desktop
- Android SDK installed on the host
- Set `ANDROID_SDK_ROOT` if your SDK is not in `%LOCALAPPDATA%\Android\Sdk`

### 1) One-time setup checks

- Ensure the Android SDK has platform tools and build tools installed.
- If you use `adb`, confirm it is on your PATH (or use `%ANDROID_SDK_ROOT%\platform-tools\adb.exe`).

### 2) Bump app version for update installs

Update both `versionCode` and `versionName` in `mobile/android/app/build.gradle`.

### 3) Build a new debug APK via Docker

Run:
```powershell
.\scripts\build-apk-docker.ps1
```

APK output:
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`

### 4) Install/update on a device

Using `adb` (update in place):
```powershell
adb install -r mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

If `adb` is not on PATH:
```powershell
& "$env:ANDROID_SDK_ROOT\platform-tools\adb.exe" install -r mobile\android\app\build\outputs\apk\debug\app-debug.apk
```

### 5) Verify API connectivity

- For emulator, API host fallback is `10.0.2.2:8080`.
- For physical phone on LAN, set the API URL in the app Settings to `http://<your-pc-ip>:8080`.

### 6) Optional clean build

If you want to force a clean Gradle build, delete the host cache folder `%USERPROFILE%\.gradle` before running the script again.

## APK Update-Friendly Build

To allow install-over-update (no uninstall required), Android builds now use:
- stable app signing key (`mobile/android/app/debug-keystore.jks`)
- incremented app version code in `mobile/android/app/build.gradle`

When creating a new APK, bump `versionCode` and `versionName` in:
- `mobile/android/app/build.gradle`

Then rebuild APK and install it over the existing app.

## Test with local backend

- Keep backend running on host port `8080`.
- Android emulator uses `10.0.2.2:8080` to reach host.
- For physical phone on LAN, set the API URL in the app Settings to `http://<your-pc-ip>:8080`.
