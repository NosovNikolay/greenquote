/** Normalize openapi-fetch error payloads for JSON responses. */
export function formatUpstreamErrorMessage(error: unknown): string {
  if (error == null) {
    return "Upstream error";
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && "message" in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === "string") {
      return m;
    }
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Upstream error";
  }
}
