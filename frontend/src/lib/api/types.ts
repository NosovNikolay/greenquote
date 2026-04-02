/** Mirrors openapi/openapi.yaml — replace with generated types when using openapi-generator. */

export interface PreQualifyRequest {
  fullName: string;
  email: string;
  streetLine: string;
  city: string;
  country: string;
  monthlyConsumptionKwh: number;
  systemSizeKw: number;
  downPayment?: number | null;
  addressLat?: number;
  addressLon?: number;
  /** User acknowledged address after geocoder found no match */
  confirmedUnverifiedAddress?: boolean;
}

export interface InstallmentOffer {
  termYears: 5 | 10 | 15;
  monthlyPayment: number;
  /** Annual percentage rate (e.g. 6.9 for 6.9%). */
  apr: number;
  /** Financed amount after down payment (EUR). */
  principalEur: number;
}

/** From `GET /quotes/{id}/amortization?termYears=` (server-computed). */
export interface AmortizationScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balanceRemaining: number;
}

export interface AmortizationScheduleResponse {
  termYears: 5 | 10 | 15;
  apr: number;
  principalEur: number;
  monthlyPayment: number;
  rows: AmortizationScheduleRow[];
  totalInterestEur: number;
}

export interface PreQualifyResponse {
  quoteId: string;
  systemPrice: number;
  riskBand: "A" | "B" | "C";
  installmentOffers: InstallmentOffer[];
}

export interface QuoteSummary {
  id: string;
  createdAt: string;
  systemSizeKw: number;
  systemPrice: number;
  riskBand: string;
  /** Present when the API returns contact context (e.g. list mine). */
  userName?: string;
  userEmail?: string;
  city?: string;
}

export interface AdminQuoteRow extends QuoteSummary {
  userEmail: string;
  userName: string;
}

export interface AdminQuotesListResponse {
  items: AdminQuoteRow[];
  total: number;
  page: number;
  limit: number;
}

/** Same shape as admin list; items are the current user's quotes only. */
export interface MyQuotesListResponse {
  items: QuoteSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface QuoteDetail extends QuoteSummary {
  fullName: string;
  email: string;
  /** Full single-line address for PDF / map search */
  address: string;
  streetLine?: string;
  city?: string;
  country?: string;
  monthlyConsumptionKwh: number;
  downPayment?: number | null;
  installmentOffers: InstallmentOffer[];
  addressLat?: number | null;
  addressLon?: number | null;
}
