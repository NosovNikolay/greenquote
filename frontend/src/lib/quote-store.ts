import type { InstallmentOffer, QuoteSummary } from "@/lib/api/types";

/** In-memory store for dev BFF when backend is unavailable. Not durable across server restarts. */

export interface StoredQuote extends QuoteSummary {
  userId: string;
  userEmail: string;
  userName: string;
  address: string;
  /** Present for quotes created with structured address fields */
  streetLine?: string;
  country?: string;
  monthlyConsumptionKwh: number;
  downPayment?: number | null;
  installmentOffers: InstallmentOffer[];
  addressLat?: number | null;
  addressLon?: number | null;
}

const quotes = new Map<string, StoredQuote>();

export function saveQuote(row: StoredQuote): void {
  quotes.set(row.id, row);
}

export function listByUser(userId: string): StoredQuote[] {
  return [...quotes.values()]
    .filter((q) => q.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function getQuote(id: string): StoredQuote | undefined {
  return quotes.get(id);
}

export function listAll(filter?: string): StoredQuote[] {
  const q = filter?.trim().toLowerCase();
  let rows = [...quotes.values()];
  if (q) {
    rows = rows.filter(
      (r) =>
        r.userEmail.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q),
    );
  }
  return rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
