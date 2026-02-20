export const PROVIDER_IDS = {
  OLLAMA_LOCAL: "ollama_local",
  OLLAMA_CLOUD: "ollama_cloud",
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  DEEPSEEK: "deepseek",
  CUSTOM_OPENAI: "custom_openai"
};

export const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b-instruct";
