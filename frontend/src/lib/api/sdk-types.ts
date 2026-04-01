/**
 * Re-exports OpenAPI schema types from `@greenquote/sdk` so route handlers import
 * one module instead of repeating `components["schemas"]["…"]`.
 */
import type { components } from "@greenquote/sdk";

export type ApiQuoteSummary = components["schemas"]["QuoteSummary"];
export type ApiQuoteDetail = components["schemas"]["QuoteDetail"];
export type ApiAdminQuoteRow = components["schemas"]["AdminQuoteRow"];
export type ApiQuoteOffer = components["schemas"]["QuoteOffer"];
