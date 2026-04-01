import { Injectable } from '@nestjs/common';
import type {
  QuoteOffer,
  QuoteResultPayload,
  RiskBand,
} from '../../common/types/quote-result.types';

const CURRENCY = 'EUR' as const;
const PRICE_PER_KW_EUR = 1200;
const TERM_YEARS = [5, 10, 15] as const;

const APR_BY_BAND: Record<RiskBand, number> = {
  A: 6.9,
  B: 8.9,
  C: 11.9,
};

/**
 * Pure pricing / amortization logic (domain layer).
 */
@Injectable()
export class PricingService {
  buildQuoteResult(input: {
    monthlyConsumptionKwh: number;
    systemSizeKw: number;
    downPaymentEur: number;
    installationAddress?: string;
  }): QuoteResultPayload {
    const systemPriceEur = this.roundEur(input.systemSizeKw * PRICE_PER_KW_EUR);
    const principalEur = this.roundEur(systemPriceEur - input.downPaymentEur);

    const riskBand = this.resolveRiskBand(
      input.monthlyConsumptionKwh,
      input.systemSizeKw,
    );
    const aprPercent = APR_BY_BAND[riskBand];

    const offers: QuoteOffer[] = TERM_YEARS.map((termYears) => ({
      termYears,
      apr: aprPercent,
      principalUsed: principalEur,
      monthlyPayment: this.monthlyPaymentEur(
        principalEur,
        aprPercent,
        termYears,
      ),
    }));

    return {
      inputs: {
        monthlyConsumptionKwh: input.monthlyConsumptionKwh,
        systemSizeKw: input.systemSizeKw,
        downPaymentEur: this.roundEur(input.downPaymentEur),
        ...(input.installationAddress !== undefined &&
        input.installationAddress !== ''
          ? { installationAddress: input.installationAddress }
          : {}),
      },
      derived: {
        currency: CURRENCY,
        systemPriceEur,
        principalEur,
        riskBand,
        aprPercent,
      },
      offers,
    };
  }

  private resolveRiskBand(
    monthlyConsumptionKwh: number,
    systemSizeKw: number,
  ): RiskBand {
    if (monthlyConsumptionKwh >= 400 && systemSizeKw <= 6) return 'A';
    if (monthlyConsumptionKwh >= 250) return 'B';
    return 'C';
  }

  /**
   * Standard fixed-rate loan amortization: M = P * [r(1+r)^n] / [(1+r)^n - 1]
   */
  monthlyPaymentEur(
    principal: number,
    annualAprPercent: number,
    termYears: number,
  ): number {
    const n = termYears * 12;
    const r = annualAprPercent / 100 / 12;
    if (r === 0) {
      return this.roundEur(principal / n);
    }
    const factor = Math.pow(1 + r, n);
    const payment = (principal * (r * factor)) / (factor - 1);
    return this.roundEur(payment);
  }

  private roundEur(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
