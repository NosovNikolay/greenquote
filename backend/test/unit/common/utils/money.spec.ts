import { centsToEur, eurToCents } from '../../../../src/common/utils/money';

describe('money (EUR ↔ integer cents)', () => {
  describe('eurToCents', () => {
    it('converts whole euros', () => {
      expect(eurToCents(12.34)).toBe(1234);
    });

    it('rounds half-cent up (standard half-up for positive amounts)', () => {
      expect(eurToCents(0.015)).toBe(2);
    });

    it('rounds to nearest cent for fractional euros', () => {
      expect(eurToCents(1.235)).toBe(124);
    });

    it('handles zero', () => {
      expect(eurToCents(0)).toBe(0);
    });

    it('produces integer cents suitable for DB BIGINT / INTEGER columns', () => {
      expect(Number.isInteger(eurToCents(99.99))).toBe(true);
      expect(eurToCents(99.99)).toBe(9999);
    });

    it('avoids float drift for typical two-decimal EUR inputs', () => {
      const eur = 6480.0;
      expect(eurToCents(eur)).toBe(648000);
    });
  });

  describe('centsToEur', () => {
    it('converts cents to decimal EUR', () => {
      expect(centsToEur(1234)).toBe(12.34);
    });

    it('is inverse of eurToCents for two-decimal amounts', () => {
      const eur = 99.99;
      expect(centsToEur(eurToCents(eur))).toBe(eur);
    });

    it('handles zero', () => {
      expect(centsToEur(0)).toBe(0);
    });

    it('round-trip is identity for any integer cent amount stored in DB', () => {
      const cents = 7_200_00; // €7,200.00 in minor units
      expect(eurToCents(centsToEur(cents))).toBe(cents);
    });

    it('normalizes fractional cent input by rounding (defensive; DB should store integers only)', () => {
      expect(centsToEur(100.4)).toBe(1.0);
      expect(centsToEur(100.6)).toBe(1.01);
    });
  });

  describe('finance invariants', () => {
    it('preserves cent precision for principal-sized amounts used in quotes', () => {
      const principalEur = 6200.0;
      const cents = eurToCents(principalEur);
      expect(cents).toBe(620_000);
      expect(centsToEur(cents)).toBe(principalEur);
    });

    it('sum of parts in cents matches whole euros when components are rounded first', () => {
      const system = 7200.0;
      const down = 1000.0;
      const principalEur = Math.round((system - down) * 100) / 100;
      expect(eurToCents(principalEur)).toBe(
        eurToCents(system) - eurToCents(down),
      );
    });
  });
});
