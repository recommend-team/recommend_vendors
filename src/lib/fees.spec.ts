import { describe, expect, it } from 'vitest';
import { PLATFORM_FEE_PERCENT, vendorShare } from './fees';

describe('vendorShare', () => {
  it('takes the platform fee off the price', () => {
    expect(PLATFORM_FEE_PERCENT).toBe(20);
    expect(vendorShare(10000)).toBe(8000);
    expect(vendorShare(3500)).toBe(2800);
  });

  it('rounds to kobo rather than leaking float noise', () => {
    // 0.2 × 333.33 is 66.666…; the backend rounds the fee to 66.67.
    expect(vendorShare(333.33)).toBe(266.66);
  });
});
