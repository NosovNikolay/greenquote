import {
  buildAmortizationSchedule,
  totalInterestPaid,
} from '../../../../src/common/utils/amortization';
import { PricingService } from '../../../../src/modules/quotes/pricing.service';

describe('amortization schedule', () => {
  const pricing = new PricingService();

  it('sums principal to the loan amount and ends at zero balance', () => {
    const principalEur = 10_000;
    const apr = 6.9;
    const termYears = 15;
    const monthlyPaymentEur = pricing.monthlyPaymentEur(
      principalEur,
      apr,
      termYears,
    );

    const rows = buildAmortizationSchedule({
      principalEur,
      annualAprPercent: apr,
      termYears,
      monthlyPaymentEur,
    });

    expect(rows).toHaveLength(180);
    const sumPrincipal = rows.reduce((s, r) => s + r.principal, 0);
    expect(sumPrincipal).toBeCloseTo(principalEur, 5);
    expect(rows[rows.length - 1]?.balanceRemaining).toBe(0);

    const sumPayments = rows.reduce((s, r) => s + r.payment, 0);
    const sumInterest = rows.reduce((s, r) => s + r.interest, 0);
    expect(sumPayments).toBeCloseTo(sumPrincipal + sumInterest, 5);
    expect(totalInterestPaid(rows)).toBeCloseTo(sumInterest, 5);
  });

  it('returns empty rows when principal is zero', () => {
    const rows = buildAmortizationSchedule({
      principalEur: 0,
      annualAprPercent: 6.9,
      termYears: 10,
      monthlyPaymentEur: 0,
    });
    expect(rows).toEqual([]);
  });

  it('handles 0% APR (straight principal / n)', () => {
    const principalEur = 12_000;
    const termYears = 10;
    const monthlyPaymentEur = pricing.monthlyPaymentEur(
      principalEur,
      0,
      termYears,
    );
    const rows = buildAmortizationSchedule({
      principalEur,
      annualAprPercent: 0,
      termYears,
      monthlyPaymentEur,
    });
    expect(rows).toHaveLength(120);
    expect(rows.reduce((s, r) => s + r.principal, 0)).toBe(principalEur);
    expect(rows.every((r) => r.interest === 0)).toBe(true);
  });
});
