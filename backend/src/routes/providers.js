import { Router } from "express";
import { listProviderIds } from "../providers/providers.js";
import { listProviderConfigs, patchProviderConfig, upsertProviderConfig } from "../store/postgresStore.js";
import { encryptSecret } from "../utils/secrets.js";
import { redact } from "../utils/redaction.js";

export const providerRouter = Router();

providerRouter.get("/", async (_req, res) => {
  try {
    const available = listProviderIds();
    const configs = (await listProviderConfigs()).map((item) => ({
      ...item,
      apiKeyRef: item.apiKeyRef ? redact(item.apiKeyRef) : null
    }));

    res.json({ providers: available, configs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

providerRouter.post("/", async (req, res) => {
  try {
    const { provider, endpoint, apiKey, enabled } = req.body || {};
    if (!provider) return res.status(400).json({ error: "provider is required" });

    const apiKeyRef = apiKey ? encryptSecret(apiKey) : null;
    const config = await upsertProviderConfig({ provider, endpoint, apiKeyRef, enabled });
    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

providerRouter.patch("/:id", async (req, res) => {
  try {
    const updated = await patchProviderConfig(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: "provider config not found" });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
