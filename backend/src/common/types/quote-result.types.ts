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
    downPaymentEur: number;
    /** Installation site (from pre-qualification form). */
    installationAddress?: string;
    /** Snapshot from the quote request (may differ from the user profile later). */
    fullName?: string;
    email?: string;
  };
  derived: {
    currency: 'EUR';
    systemPriceEur: number;
    principalEur: number;
    riskBand: RiskBand;
    aprPercent: number;
  };
  offers: QuoteOffer[];
}
