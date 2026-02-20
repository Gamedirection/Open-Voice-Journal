export class SummaryProvider {
  constructor(providerId) {
    this.providerId = providerId;
  }

  async listModels(_context) {
    throw new Error("listModels not implemented");
  }

  async validateConfig(_config) {
    throw new Error("validateConfig not implemented");
  }

  async summarize(_transcript, _options) {
    throw new Error("summarize not implemented");
  }
}
