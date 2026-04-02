import { extractCityFromAddress } from '../../../../src/common/utils/address';

describe('extractCityFromAddress', () => {
  it('uses the segment before a trailing ISO country code (DE)', () => {
    expect(extractCityFromAddress('5 Demo Str., Berlin, DE')).toBe('Berlin');
  });

  it('uses the segment before a trailing ISO country code (lowercase)', () => {
    expect(extractCityFromAddress('Hauptstr. 1, München, de')).toBe('München');
  });

  it('uses the segment before a full country name', () => {
    expect(extractCityFromAddress('Rue 1, Paris, France')).toBe('Paris');
  });

  it('returns the last segment when it is the city (no country suffix)', () => {
    expect(extractCityFromAddress('Some street, Hamburg')).toBe('Hamburg');
  });

  it('strips German PLZ from the city candidate when country is spelled out', () => {
    expect(extractCityFromAddress('Weg 2, 10115 Berlin, Germany')).toBe(
      'Berlin',
    );
  });
});
