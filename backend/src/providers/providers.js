import { OpenAICompatibleProvider } from "./openaiCompatible.js";
import { DEFAULT_MODEL, PROVIDER_IDS } from "../config.js";

export const providerRegistry = new Map([
  [PROVIDER_IDS.OLLAMA_LOCAL, new OpenAICompatibleProvider(PROVIDER_IDS.OLLAMA_LOCAL, { defaultModel: DEFAULT_MODEL })],
  [PROVIDER_IDS.OLLAMA_CLOUD, new OpenAICompatibleProvider(PROVIDER_IDS.OLLAMA_CLOUD, { defaultModel: "qwen2.5:7b-instruct" })],
  [PROVIDER_IDS.OPENAI, new OpenAICompatibleProvider(PROVIDER_IDS.OPENAI, { defaultModel: "gpt-4o-mini" })],
  [PROVIDER_IDS.ANTHROPIC, new OpenAICompatibleProvider(PROVIDER_IDS.ANTHROPIC, { defaultModel: "claude-3-5-sonnet-latest" })],
  [PROVIDER_IDS.DEEPSEEK, new OpenAICompatibleProvider(PROVIDER_IDS.DEEPSEEK, { defaultModel: "deepseek-chat" })],
  [PROVIDER_IDS.CUSTOM_OPENAI, new OpenAICompatibleProvider(PROVIDER_IDS.CUSTOM_OPENAI, { defaultModel: "custom-model" })]
]);

export function getProvider(providerId) {
  const provider = providerRegistry.get(providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);
  return provider;
}

export function listProviderIds() {
  return Array.from(providerRegistry.keys());
}
