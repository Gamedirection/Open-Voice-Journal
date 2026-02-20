export function buildJobEvent(type, payload) {
  return { type, timestamp: new Date().toISOString(), payload };
}
