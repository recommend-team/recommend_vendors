import { describe, expect, it } from 'vitest';
import { STANDARD_FEE_PERCENT, percentText, vendorShare } from './fees';

describe('vendorShare', () => {
  it('takes the standard fee off the price when no rate is given', () => {
    expect(STANDARD_FEE_PERCENT).toBe(20);
    expect(vendorShare(10000)).toBe(8000);
    expect(vendorShare(3500)).toBe(2800);
  });

  it("takes the vendor's own rate off the price", () => {
    // A ₦650k laptop at 3%: the case per-category rates exist for.
    expect(vendorShare(650000, 3)).toBe(630500);
    expect(vendorShare(6000, 25)).toBe(4500);
    expect(vendorShare(6000, 12.5)).toBe(5250);
  });

  it('rounds to kobo rather than leaking float noise', () => {
    // 0.2 × 333.33 is 66.666…; the backend rounds the fee to 66.67.
    expect(vendorShare(333.33)).toBe(266.66);
  });

  it('writes a rate plainly', () => {
    expect(percentText(25)).toBe('25%');
    expect(percentText(7.5)).toBe('7.5%');
  });
});
