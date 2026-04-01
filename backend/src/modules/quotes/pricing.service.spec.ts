import { PricingService } from './pricing.service';

describe('PricingService', () => {
  const pricing = new PricingService();

  it('assigns band A and computes amortized offers', () => {
    const result = pricing.buildQuoteResult({
      monthlyConsumptionKwh: 400,
      systemSizeKw: 6,
      downPaymentUsd: 1200,
    });

    expect(result.derived.riskBand).toBe('A');
    expect(result.derived.aprPercent).toBe(6.9);
    expect(result.derived.systemPriceUsd).toBe(7200);
    expect(result.derived.principalUsd).toBe(6000);
    expect(result.offers.map((o) => o.termYears)).toEqual([5, 10, 15]);
    expect(result.offers[0].monthlyPayment).toBeGreaterThan(0);
  });
});
