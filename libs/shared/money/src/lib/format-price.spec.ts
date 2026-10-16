import { formatPrice } from './format-price';
import { parsePrice } from './parse-price';

describe('formatPrice', () => {
  it('shows cents as an amount with two decimals', () => {
    expect(formatPrice(1250)).toBe('12.50');
    expect(formatPrice(900)).toBe('9.00');
    expect(formatPrice(5)).toBe('0.05');
  });

  it('round-trips with parsePrice', () => {
    expect(parsePrice(formatPrice(1999))).toBe(1999);
  });
});
