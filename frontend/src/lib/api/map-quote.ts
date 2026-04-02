import type {
  AdminQuoteRow,
  PreQualifyResponse,
  QuoteDetail,
  QuoteSummary,
} from "@/lib/api/types";
import type {
  ApiAdminQuoteRow,
  ApiQuoteDetail,
  ApiQuoteOffer,
  ApiQuoteSummary,
} from "@/lib/api/sdk-types";

export function mapApiQuoteDetailToView(q: ApiQuoteDetail): QuoteDetail {
  const createdAt =
    typeof q.createdAt === "string"
      ? q.createdAt
      : new Date(q.createdAt as unknown as string).toISOString();
  return {
    id: q.id,
    createdAt,
    systemSizeKw: q.inputs.systemSizeKw,
    systemPrice: q.derived.systemPriceEur,
    riskBand: q.derived.riskBand,
    fullName: q.contact?.fullName ?? "",
    email: q.contact?.email ?? "",
    address: q.inputs.installationAddress ?? "",
    streetLine: undefined,
    city: undefined,
    country: undefined,
    monthlyConsumptionKwh: q.inputs.monthlyConsumptionKwh,
    downPayment: q.inputs.downPaymentEur,
    installmentOffers: q.offers.map((o: ApiQuoteOffer) => ({
      termYears: o.termYears as 5 | 10 | 15,
      monthlyPayment: o.monthlyPayment,
      apr: o.apr,
      principalEur: o.principalUsed,
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

export function mapApiAdminRowToView(row: ApiAdminQuoteRow): AdminQuoteRow {
  return mapApiQuoteSummaryToView(row) as AdminQuoteRow;
}

/** `POST /quotes` response shape → same payload the local BFF returns after pre-qualify. */
export function mapNestCreateQuoteToPreQualify(
  data: ApiQuoteDetail,
): PreQualifyResponse {
  return {
    quoteId: data.id,
    systemPrice: data.derived.systemPriceEur,
    riskBand: data.derived.riskBand as PreQualifyResponse["riskBand"],
    installmentOffers: data.offers.map((o: ApiQuoteOffer) => ({
      termYears: o.termYears as 5 | 10 | 15,
      monthlyPayment: o.monthlyPayment,
      apr: o.apr,
      principalEur: o.principalUsed,
    })),
  };
}
