import { PRICE_PER_KW_EUR } from "@greenquote/constants";

export { PRICE_PER_KW_EUR };

export function estimatedSystemPriceEur(systemSizeKw: number): number {
  return systemSizeKw * PRICE_PER_KW_EUR;
}
