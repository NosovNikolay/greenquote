/** Must match `PRICE_PER_KW_EUR` in `backend/src/modules/quotes/quotes.service.ts`. */
export const PRICE_PER_KW_EUR = 1200;

export function estimatedSystemPriceEur(systemSizeKw: number): number {
  return systemSizeKw * PRICE_PER_KW_EUR;
}
