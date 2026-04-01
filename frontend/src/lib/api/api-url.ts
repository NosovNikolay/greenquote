/**
 * Nest API base URL including global prefix (e.g. http://localhost:3001/api).
 * Required whenever the Next app runs; validated at config load and before `next dev` / `next start`.
 */
export function requireApiBaseUrl(): string {
  const baseUrl = process.env.API_URL?.replace(/\/$/, "").trim();
  if (!baseUrl) {
    throw new Error(
      "API_URL is required (e.g. http://localhost:3001/api). See frontend/.env.example.",
    );
  }
  return baseUrl;
}
