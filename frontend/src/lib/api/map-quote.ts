import type {
  AdminQuoteRow,
  QuoteDetail,
  QuoteSummary,
} from "@/lib/api/types";
import type { components } from "@greenquote/sdk";

type ApiQuoteDetail = components["schemas"]["QuoteDetail"];
type ApiQuoteSummary = components["schemas"]["QuoteSummary"];
type ApiAdminRow = components["schemas"]["AdminQuoteRow"];
type ApiQuoteOffer = components["schemas"]["QuoteOffer"];

export function mapApiQuoteDetailToView(q: ApiQuoteDetail): QuoteDetail {
  const createdAt =
    typeof q.createdAt === "string"
      ? q.createdAt
      : new Date(q.createdAt as unknown as string).toISOString();
  return {
    id: q.id,
    createdAt,
    systemSizeKw: q.inputs.systemSizeKw,
    systemPrice: q.derived.systemPriceUsd,
    riskBand: q.derived.riskBand,
    fullName: q.contact?.fullName ?? "",
    email: q.contact?.email ?? "",
    address: q.inputs.installationAddress ?? "",
    streetLine: undefined,
    city: undefined,
    country: undefined,
    monthlyConsumptionKwh: q.inputs.monthlyConsumptionKwh,
    downPayment: q.inputs.downPaymentUsd,
    installmentOffers: q.offers.map((o: ApiQuoteOffer) => ({
      termYears: o.termYears as 5 | 10 | 15,
      monthlyPayment: o.monthlyPayment,
      apr: o.apr,
      principalUsd: o.principalUsed,
    })),
    addressLat: null,
    addressLon: null,
  };
}

export function mapApiQuoteSummaryToView(row: ApiQuoteSummary): QuoteSummary {
  const createdAt =
    typeof row.createdAt === "string"
      ? row.createdAt
      : new Date(row.createdAt as unknown as string).toISOString();
  return {
    id: row.id,
    createdAt,
    systemSizeKw: row.systemSizeKw,
    systemPrice: row.systemPrice,
    riskBand: row.riskBand,
    userName: row.userName,
    userEmail: row.userEmail,
    city: row.city,
  };
}

export function mapApiAdminRowToView(row: ApiAdminRow): AdminQuoteRow {
  return {
    ...mapApiQuoteSummaryToView(row),
    userEmail: row.userEmail,
    userName: row.userName,
  };
}
