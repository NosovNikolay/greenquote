import { PricingService } from '../../../../src/modules/quotes/pricing.service';

describe('PricingService', () => {
  const pricing = new PricingService();

  describe('buildQuoteResult — amounts (system price & principal)', () => {
    it('computes system price as €1,200 per kW and principal after down payment', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 450,
        systemSizeKw: 6,
        downPaymentEur: 1000,
      });
      expect(r.derived.currency).toBe('EUR');
      expect(r.derived.systemPriceEur).toBe(7200);
      expect(r.derived.principalEur).toBe(6200);
    });

    it('rounds displayed inputs; principal uses raw down payment in subtraction then rounds', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 300,
        systemSizeKw: 5,
        downPaymentEur: 100.125,
      });
      expect(r.derived.systemPriceEur).toBe(6000);
      expect(r.inputs.downPaymentEur).toBe(100.13);
      // principalEur = roundEur(6000 - 100.125) → 5899.88, not 6000 − 100.13
      expect(r.derived.principalEur).toBe(5899.88);
    });
  });

  describe('buildQuoteResult — risk class (band) rules', () => {
    it('band A: consumption ≥ 400 kWh and system size ≤ 6 kW', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 400,
        systemSizeKw: 6,
        downPaymentEur: 500,
      });
      expect(r.derived.riskBand).toBe('A');
    });

    it('band A: still applies at exactly 400 kWh and 6 kW', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 400,
        systemSizeKw: 6,
        downPaymentEur: 0,
      });
      expect(r.derived.riskBand).toBe('A');
    });

    it('not band A when consumption is 399 kWh even if system ≤ 6 kW', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 399,
        systemSizeKw: 5,
        downPaymentEur: 0,
      });
      expect(r.derived.riskBand).not.toBe('A');
      expect(r.derived.riskBand).toBe('B');
    });

    it('not band A when system size > 6 kW even if consumption ≥ 400 kWh', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 500,
        systemSizeKw: 6.01,
        downPaymentEur: 0,
      });
      expect(r.derived.riskBand).toBe('B');
    });

    it('band B: consumption ≥ 250 kWh when not eligible for A', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 250,
        systemSizeKw: 10,
        downPaymentEur: 0,
      });
      expect(r.derived.riskBand).toBe('B');
    });

    it('band C: consumption below 250 kWh', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 100,
        systemSizeKw: 8,
        downPaymentEur: 0,
      });
      expect(r.derived.riskBand).toBe('C');
    });

    it('249 kWh is band C', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 249,
        systemSizeKw: 4,
        downPaymentEur: 0,
      });
      expect(r.derived.riskBand).toBe('C');
    });
  });

  describe('buildQuoteResult — subsidy / financing plan (APR by band + term offers)', () => {
    it('maps band A → 6.9% APR on all term offers', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 450,
        systemSizeKw: 5,
        downPaymentEur: 0,
      });
      expect(r.derived.riskBand).toBe('A');
      expect(r.derived.aprPercent).toBe(6.9);
      expect(r.offers.every((o) => o.apr === 6.9)).toBe(true);
    });

    it('maps band B → 8.9% APR', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 300,
        systemSizeKw: 8,
        downPaymentEur: 0,
      });
      expect(r.derived.riskBand).toBe('B');
      expect(r.derived.aprPercent).toBe(8.9);
    });

    it('maps band C → 11.9% APR', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 100,
        systemSizeKw: 8,
        downPaymentEur: 0,
      });
      expect(r.derived.riskBand).toBe('C');
      expect(r.derived.aprPercent).toBe(11.9);
    });

    it('exposes three standard terms: 5, 10, and 15 years', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 300,
        systemSizeKw: 5,
        downPaymentEur: 0,
      });
      expect(r.offers).toHaveLength(3);
      expect(r.offers.map((o) => o.termYears)).toEqual([5, 10, 15]);
    });

    it('uses the same principal on every offer row', () => {
      const r = pricing.buildQuoteResult({
        monthlyConsumptionKwh: 400,
        systemSizeKw: 6,
        downPaymentEur: 1000,
      });
      const p = r.derived.principalEur;
      expect(r.offers.every((o) => o.principalUsed === p)).toBe(true);
    });
  });

  describe('monthlyPaymentEur', () => {
    it('handles zero APR as straight division (interest-free)', () => {
      const p = pricing.monthlyPaymentEur(12000, 0, 10);
      expect(p).toBe(100);
    });

    it('matches standard amortization for a known case', () => {
      const p = pricing.monthlyPaymentEur(10000, 6.9, 15);
      expect(p).toBeCloseTo(89.0, 0);
    });

    it('total paid over life exceeds principal when APR > 0', () => {
      const principal = 10_000;
      const apr = 6.9;
      const termYears = 15;
      const monthly = pricing.monthlyPaymentEur(principal, apr, termYears);
      const total = monthly * 12 * termYears;
      expect(total).toBeGreaterThan(principal);
    });
  });
});
