import { listProviderIds } from "../providers/providers.js";

function parseAllowedProviders() {
  const configured = process.env.ALLOWED_SUMMARY_PROVIDERS;
  if (!configured) return new Set(listProviderIds());
  return new Set(configured.split(",").map((v) => v.trim()).filter(Boolean));
}

export function enforceProviderPolicy(providerId) {
  const allowSet = parseAllowedProviders();

  if (process.env.LOCAL_ONLY_SUMMARIZATION === "true" && providerId !== "ollama_local") {
    throw new Error("Policy blocks external summarization providers");
  }

  if (!allowSet.has(providerId)) {
    throw new Error(`Provider '${providerId}' is not allowed by policy`);
  }
}
