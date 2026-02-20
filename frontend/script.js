const providerEl = document.getElementById("provider");
const modelEl = document.getElementById("model");
const endpointEl = document.getElementById("endpoint");
const saveBtn = document.getElementById("saveBtn");
const resultEl = document.getElementById("result");

saveBtn.addEventListener("click", async () => {
  const payload = {
    provider: providerEl.value,
    endpoint: endpointEl.value.trim() || undefined
  };

  resultEl.textContent = "Saving...";

  try {
    const response = await fetch("/api/v1/ai/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to save provider config");

    resultEl.textContent = JSON.stringify({ status: "saved", selectedModel: modelEl.value || "(set at summary time)", config: data }, null, 2);
  } catch (error) {
    resultEl.textContent = `Error: ${error.message}`;
  }
});
