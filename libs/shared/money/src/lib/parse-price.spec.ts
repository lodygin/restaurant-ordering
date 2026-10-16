import { parsePrice } from './parse-price';

describe('parsePrice', () => {
  it('turns dollars into cents', () => {
    expect(parsePrice('12.50')).toBe(1250);
    expect(parsePrice(' 12,5 ')).toBe(1250);
    expect(parsePrice('9')).toBe(900);
  });

  it('rejects anything that is not a positive amount with at most two decimals', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
    expect(parsePrice('0.00')).toBeNull();
    expect(parsePrice('-3')).toBeNull();
    expect(parsePrice('1.234')).toBeNull();
  });
});
