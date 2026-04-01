import { PricingService } from '../../../../src/modules/quotes/pricing.service';
import {
  deserializeQuoteResultStored,
  serializeQuoteResultPayload,
} from '../../../../src/common/types/quote-result-storage';
import { eurToCents } from '../../../../src/common/utils/money';

describe('quote-result-storage (EUR decimals ↔ integer cents)', () => {
  const pricing = new PricingService();

  it('round-trips serialize → deserialize for a full payload', () => {
    const payload = pricing.buildQuoteResult({
      monthlyConsumptionKwh: 450,
      systemSizeKw: 5.4,
      downPaymentEur: 1500.12,
      installationAddress: '1 Test St',
    });
    const withContact = {
      ...payload,
      inputs: {
        ...payload.inputs,
        fullName: 'A User',
        email: 'a@b.com',
      },
    };
    const stored = serializeQuoteResultPayload(withContact);
    const back = deserializeQuoteResultStored(stored);
    expect(back.inputs.downPaymentEur).toBeCloseTo(1500.12, 2);
    expect(back.derived.systemPriceEur).toBeCloseTo(
      withContact.derived.systemPriceEur,
      2,
    );
    expect(back.derived.principalEur).toBeCloseTo(
      withContact.derived.principalEur,
      2,
    );
    expect(back.offers).toHaveLength(withContact.offers.length);
    for (let i = 0; i < back.offers.length; i++) {
      expect(back.offers[i].principalUsed).toBeCloseTo(
        withContact.offers[i].principalUsed,
        2,
      );
      expect(back.offers[i].monthlyPayment).toBeCloseTo(
        withContact.offers[i].monthlyPayment,
        2,
      );
    }
    expect(back.inputs.installationAddress).toBe('1 Test St');
    expect(back.inputs.fullName).toBe('A User');
    expect(back.inputs.email).toBe('a@b.com');
  });

  it('omits optional address when empty string in payload', () => {
    const payload = pricing.buildQuoteResult({
      monthlyConsumptionKwh: 100,
      systemSizeKw: 4,
      downPaymentEur: 0,
      installationAddress: '',
    });
    const stored = serializeQuoteResultPayload(payload);
    expect(stored.inputs).not.toHaveProperty('installationAddress');
  });

  it('stores all monetary fields as integer cents (DB-safe)', () => {
    const payload = pricing.buildQuoteResult({
      monthlyConsumptionKwh: 400,
      systemSizeKw: 6,
      downPaymentEur: 1234.56,
    });
    const stored = serializeQuoteResultPayload(payload);
    expect(Number.isInteger(stored.inputs.downPaymentEurCents)).toBe(true);
    expect(Number.isInteger(stored.derived.systemPriceEurCents)).toBe(true);
    expect(Number.isInteger(stored.derived.principalEurCents)).toBe(true);
    for (const o of stored.offers) {
      expect(Number.isInteger(o.principalUsedCents)).toBe(true);
      expect(Number.isInteger(o.monthlyPaymentCents)).toBe(true);
    }
  });

  it('stored cents match eurToCents of rounded EUR domain values', () => {
    const payload = pricing.buildQuoteResult({
      monthlyConsumptionKwh: 350,
      systemSizeKw: 5,
      downPaymentEur: 500,
    });
    const stored = serializeQuoteResultPayload(payload);
    expect(stored.derived.systemPriceEurCents).toBe(
      eurToCents(payload.derived.systemPriceEur),
    );
    expect(stored.derived.principalEurCents).toBe(
      eurToCents(payload.derived.principalEur),
    );
    expect(stored.inputs.downPaymentEurCents).toBe(
      eurToCents(payload.inputs.downPaymentEur),
    );
  });
});
