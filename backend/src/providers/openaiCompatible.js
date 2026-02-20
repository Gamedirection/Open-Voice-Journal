import { SummaryProvider } from "./base.js";

export class OpenAICompatibleProvider extends SummaryProvider {
  constructor(providerId, defaults = {}) {
    super(providerId);
    this.defaults = defaults;
  }

  async listModels(context) {
    const fallback = this.defaults.defaultModel ? [this.defaults.defaultModel] : [];
    return { provider: this.providerId, models: context?.models?.length ? context.models : fallback };
  }

  async validateConfig(config) {
    const hasApiKey = Boolean(config?.apiKeyRef || config?.apiKey);
    const hasEndpoint = this.providerId === "ollama_local" ? true : Boolean(config?.endpoint);
    return { valid: hasApiKey || this.providerId === "ollama_local", details: { hasEndpoint } };
  }

  async summarize(transcript, options) {
    if (!transcript?.trim()) {
      throw new Error("Transcript content is required");
    }

    return {
      provider: this.providerId,
      model: options.model,
      markdown: `## Summary (${this.providerId})\n\nTemplate: ${options.template || "default"}\n\n${transcript.slice(0, 220)}...`,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }
}
