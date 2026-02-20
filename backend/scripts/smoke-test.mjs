#!/usr/bin/env node

const baseUrl = process.env.API_BASE_URL || "http://localhost:8080";

async function req(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} - ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function main() {
  const health = await req("/api/health");
  if (!health?.db) {
    throw new Error("API is up but DB health is not OK");
  }

  const recording = await req("/api/v1/recordings", {
    method: "POST",
    body: JSON.stringify({
      title: "Smoke Test Recording",
      metadata: { source: "smoke-script" }
    })
  });

  const providerConfig = await req("/api/v1/ai/providers", {
    method: "POST",
    body: JSON.stringify({
      provider: "ollama_local",
      enabled: true
    })
  });

  const summaryResponse = await req(`/api/v1/recordings/${recording.id}/summaries`, {
    method: "POST",
    body: JSON.stringify({
      provider: "ollama_local",
      model: "qwen2.5:7b-instruct",
      template: "default"
    })
  });

  const summary = await req(`/api/v1/summaries/${summaryResponse.summary.id}`);

  console.log(JSON.stringify({
    ok: true,
    health,
    recordingId: recording.id,
    providerConfigId: providerConfig.id,
    summaryId: summary.id
  }, null, 2));
}

main().catch((error) => {
  console.error("Smoke test failed:", error.message);
  process.exit(1);
});
