#!/usr/bin/env node
const raw = process.env.API_URL?.replace(/\/$/, "").trim();
if (!raw) {
  console.error(
    "GreenQuote: API_URL is required (e.g. http://localhost:3001/api). See frontend/.env.example.",
  );
  process.exit(1);
}

const healthUrl = `${raw}/health`;
const maxAttempts = Number(process.env.API_HEALTH_MAX_ATTEMPTS ?? 60);
const delayMs = Number(process.env.API_HEALTH_RETRY_MS ?? 1000);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  let lastErr = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(12_000) });
      if (res.ok) {
        const body = await res.json().catch(() => null);
        if (body && body.status === "ok") {
          if (attempt > 1) {
            console.log(`GreenQuote: API became healthy after ${attempt} attempt(s).`);
          }
          return;
        }
        lastErr = `invalid body: ${JSON.stringify(body)}`;
      } else {
        lastErr = `HTTP ${res.status}`;
      }
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
    if (attempt < maxAttempts) {
      await sleep(delayMs);
    }
  }
  console.error(`GreenQuote: API not reachable at ${healthUrl} after ${maxAttempts} attempt(s).`);
  console.error("Last error:", lastErr);
  process.exit(1);
})();
