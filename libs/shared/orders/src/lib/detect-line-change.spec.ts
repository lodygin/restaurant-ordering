import { detectLineChange } from './detect-line-change';

const fixed = { unitPrice: 900, openPrice: false };
const open = { unitPrice: 1500, openPrice: true };

describe('detectLineChange', () => {
  it('passes a line whose item did not change', () => {
    expect(detectLineChange(fixed, { available: true, price: 900 })).toBeNull();
    expect(detectLineChange(open, { available: true, price: null })).toBeNull();
  });

  it('drops a line whose item is gone or sold out', () => {
    expect(detectLineChange(fixed, undefined)).toEqual({ type: 'unavailable' });
    expect(detectLineChange(open, { available: false, price: null })).toEqual({
      type: 'unavailable',
    });
  });

  it('reports a new fixed price', () => {
    expect(detectLineChange(fixed, { available: true, price: 1100 })).toEqual({
      type: 'price',
      price: 1100,
    });
  });

  it('reports an item that switched between fixed and open price', () => {
    expect(detectLineChange(fixed, { available: true, price: null })).toEqual({
      type: 'now-open',
    });
    expect(detectLineChange(open, { available: true, price: 1200 })).toEqual({
      type: 'now-fixed',
      price: 1200,
    });
  });
});
