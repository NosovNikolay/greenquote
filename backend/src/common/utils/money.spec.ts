import { centsToEur, eurToCents } from './money';

describe('money', () => {
  describe('eurToCents', () => {
    it('converts whole euros', () => {
      expect(eurToCents(12.34)).toBe(1234);
    });

    it('rounds half-cent up', () => {
      expect(eurToCents(0.015)).toBe(2);
    });

    it('rounds to nearest cent for fractional euros', () => {
      expect(eurToCents(1.235)).toBe(124);
    });

    it('handles zero', () => {
      expect(eurToCents(0)).toBe(0);
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
  });
});
