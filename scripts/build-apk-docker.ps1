$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$sdkPath = $env:ANDROID_SDK_ROOT
if (-not $sdkPath) {
  $sdkPath = Join-Path $env:LOCALAPPDATA "Android\\Sdk"
}

if (-not (Test-Path $sdkPath)) {
  throw "Android SDK not found at '$sdkPath'. Set ANDROID_SDK_ROOT to your SDK path."
}

$gradleCache = Join-Path $env:USERPROFILE ".gradle"

docker run --rm -t `
  -v "${repoRoot}:/workspace" `
  -v "${sdkPath}:/sdk" `
  -v "${gradleCache}:/root/.gradle" `
  -e ANDROID_SDK_ROOT=/sdk `
  -e ANDROID_HOME=/sdk `
  -w /workspace/mobile `
  node:20-bullseye `
  bash -lc "apt-get update && apt-get install -y openjdk-17-jdk && npm install && npm run cap:sync && npm run apk:debug"
