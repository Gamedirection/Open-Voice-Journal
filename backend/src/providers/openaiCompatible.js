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

    const lines = transcript
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const preview = lines.slice(0, 6);

    const keyTopics = preview.slice(0, 3).map((line) => `- ${line.slice(0, 120)}`);
    const actionItems = preview.slice(3, 6).map((line) => `- ${line.slice(0, 120)}`);
    const safeTopics = keyTopics.length ? keyTopics.join("\n") : "- No clear topics extracted.";
    const safeActions = actionItems.length ? actionItems.join("\n") : "- No explicit action items identified.";

    return {
      provider: this.providerId,
      model: options.model,
      markdown: [
        "## General Description",
        "",
        transcript.slice(0, 380),
        "",
        "## Key Topics",
        "",
        safeTopics,
        "",
        "## Action Items",
        "",
        safeActions,
        "",
        "## Follow-Up",
        "",
        "- Confirm decisions and owners.",
        "- Schedule follow-up for unresolved items.",
        "",
        `Template: ${options.template || "default"}`
      ].join("\n"),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  }
}
