/**
 * Browser client: same-origin `/api/*` routes only (cookie session).
 * For Nest types & shapes, import from `@/lib/api/types` or `@greenquote/sdk` `components`.
 *
 * Server-side calls to Nest use `createServerSdk` in Route Handlers — not this file.
 * `API_URL` must be set; the app is wired to the Nest API only.
 */
import type {
  AdminQuotesListResponse,
  AmortizationScheduleResponse,
  MyQuotesListResponse,
  PreQualifyRequest,
  PreQualifyResponse,
  QuoteDetail,
} from "@/lib/api/types";

function messageFromErrorBody(text: string, fallback: string): string {
  try {
    const parsed = JSON.parse(text) as {
      error?: unknown;
      message?: unknown;
    };
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error.trim();
    }
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message.trim();
    }
  } catch {
    /* not JSON */
  }
  const trimmed = text.trim();
  return trimmed || fallback;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(messageFromErrorBody(text, res.statusText));
  }
  return res.json() as Promise<T>;
}

export const api = {
  async preQualify(body: PreQualifyRequest): Promise<PreQualifyResponse> {
    const res = await fetch("/api/quotes/pre-qualify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    return parseJson<PreQualifyResponse>(res);
  },

  async listMyQuotes(
    page = 1,
    limit = 30,
  ): Promise<MyQuotesListResponse> {
    const url = new URL("/api/quotes", window.location.origin);
    url.searchParams.set("page", String(Math.max(1, page)));
    url.searchParams.set("limit", String(Math.min(30, Math.max(1, limit))));
    const res = await fetch(url.toString(), { credentials: "include" });
    return parseJson<MyQuotesListResponse>(res);
  },

  async listAdminQuotes(
    q?: string,
    page = 1,
  ): Promise<AdminQuotesListResponse> {
    const url = new URL("/api/admin/quotes", window.location.origin);
    if (q) url.searchParams.set("q", q);
    url.searchParams.set("page", String(Math.max(1, page)));
    url.searchParams.set("limit", "30");
    const res = await fetch(url.toString(), { credentials: "include" });
    return parseJson<AdminQuotesListResponse>(res);
  },

  async getQuote(id: string): Promise<QuoteDetail> {
    const res = await fetch(`/api/quotes/${id}`, { credentials: "include" });
    return parseJson<QuoteDetail>(res);
  },

  async getQuoteAmortization(
    quoteId: string,
    termYears: 5 | 10 | 15,
  ): Promise<AmortizationScheduleResponse> {
    const url = new URL(
      `/api/quotes/${encodeURIComponent(quoteId)}/amortization`,
      window.location.origin,
    );
    url.searchParams.set("termYears", String(termYears));
    const res = await fetch(url.toString(), { credentials: "include" });
    return parseJson<AmortizationScheduleResponse>(res);
  },
};
