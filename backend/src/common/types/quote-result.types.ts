export type RiskBand = 'A' | 'B' | 'C';

export interface QuoteOffer {
  termYears: number;
  apr: number;
  principalUsed: number;
  monthlyPayment: number;
}

export interface QuoteResultPayload {
  inputs: {
    monthlyConsumptionKwh: number;
    systemSizeKw: number;
    downPaymentUsd: number;
    /** Installation site (from pre-qualification form). */
    installationAddress?: string;
  };
  derived: {
    currency: 'USD';
    systemPriceUsd: number;
    principalUsd: number;
    riskBand: RiskBand;
    aprPercent: number;
  };
  offers: QuoteOffer[];
}
