/** Aligns with backend pricing when API_URL is set; used for local / fallback. */

import type { InstallmentOffer } from "@/lib/api/types";

export type RiskBand = "A" | "B" | "C";

const PRICE_PER_KW = 1650;
const FIXED_COST = 1800;
/** Annual rate as decimal (4.5% → 0.045); exposed as APR percent on offers. */
const ANNUAL_RATE = 0.045;

function pmt(principal: number, years: number, annualRate: number): number {
  if (principal <= 0) return 0;
  const n = years * 12;
  const r = annualRate / 12;
  const factor = (1 + r) ** n;
  return (principal * r * factor) / (factor - 1);
}

export function computeRiskBand(
  monthlyConsumptionKwh: number,
  systemSizeKw: number,
): RiskBand {
  const estMonthlyGen = systemSizeKw * 120;
  const ratio =
    estMonthlyGen > 0 ? monthlyConsumptionKwh / estMonthlyGen : 1;
  if (systemSizeKw >= 7 && ratio >= 0.35 && ratio <= 1.4) return "A";
  if (systemSizeKw >= 4 && ratio >= 0.2) return "B";
  return "C";
}

export function computePreQualification(input: {
  systemSizeKw: number;
  monthlyConsumptionKwh: number;
  downPayment?: number | null;
}): {
  systemPrice: number;
  riskBand: RiskBand;
  installmentOffers: InstallmentOffer[];
} {
  const down = Math.max(0, input.downPayment ?? 0);
  const raw = input.systemSizeKw * PRICE_PER_KW + FIXED_COST;
  const systemPrice = Math.max(0, Math.round(raw - down));
  const riskBand = computeRiskBand(
    input.monthlyConsumptionKwh,
    input.systemSizeKw,
  );
  const terms: (5 | 10 | 15)[] = [5, 10, 15];
  const aprPercent = ANNUAL_RATE * 100;
  const installmentOffers = terms.map((termYears) => ({
    termYears,
    monthlyPayment: Math.round(pmt(systemPrice, termYears, ANNUAL_RATE) * 100) / 100,
    apr: aprPercent,
    principalUsd: systemPrice,
  }));
  return { systemPrice, riskBand, installmentOffers };
}
