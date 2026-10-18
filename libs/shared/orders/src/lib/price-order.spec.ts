import { priceOrder } from './price-order';

const lines = [
  { unitPrice: 900, qty: 2 },
  { unitPrice: 450, qty: 1 },
];

describe('priceOrder', () => {
  it('adds up the lines and takes the discount off', () => {
    expect(priceOrder(lines, 250)).toEqual({ subtotal: 2250, discount: 250, total: 2000 });
  });

  it('caps the discount at the subtotal', () => {
    expect(priceOrder(lines, 5000)).toEqual({ subtotal: 2250, discount: 2250, total: 0 });
  });
});
