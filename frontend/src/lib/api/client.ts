/**
 * Browser-safe API client (calls same-origin BFF). Replace baseUrl with
 * process.env.NEXT_PUBLIC_API_URL when SDK talks to Nest directly with Bearer tokens.
 */
import type {
  AdminQuoteRow,
  PreQualifyRequest,
  PreQualifyResponse,
  QuoteDetail,
  QuoteSummary,
} from "@/lib/api/types";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
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

  async listMyQuotes(): Promise<QuoteSummary[]> {
    const res = await fetch("/api/quotes", { credentials: "include" });
    return parseJson<QuoteSummary[]>(res);
  },

  async listAdminQuotes(q?: string): Promise<AdminQuoteRow[]> {
    const url = new URL("/api/admin/quotes", window.location.origin);
    if (q) url.searchParams.set("q", q);
    const res = await fetch(url.toString(), { credentials: "include" });
    return parseJson<AdminQuoteRow[]>(res);
  },

  async getQuote(id: string): Promise<QuoteDetail> {
    const res = await fetch(`/api/quotes/${id}`, { credentials: "include" });
    return parseJson<QuoteDetail>(res);
  },
};
