import { describe, expect, it } from 'vitest';
import { formatNaira, orderLabel } from './format';

describe('formatNaira', () => {
  it('formats the decimal strings Postgres actually returns', () => {
    // Amounts arrive as strings — `"7900.00"`, not 7900 — because money must not go
    // through a JavaScript number on its way to or from the database.
    expect(formatNaira('7900.00')).toBe('₦7,900');
    expect(formatNaira('3750.50')).toBe('₦3,750.5');
  });

  it('is naira, never dollars', () => {
    // The reference designs show `$`. Every price in this product is naira.
    expect(formatNaira('100')).toMatch(/^₦/);
  });

  it('degrades to zero rather than NaN', () => {
    // A vendor seeing "₦NaN" against an order would rightly stop trusting the app.
    expect(formatNaira('not-a-number')).toBe('₦0');
    expect(formatNaira('')).toBe('₦0');
  });
});

describe('orderLabel', () => {
  it('prefers the payment reference, which everyone shares', () => {
    expect(orderLabel({ id: 'abc', checkout: { reference: 'REC-123' } })).toBe(
      'REC-123',
    );
  });

  it('falls back to a sayable id when there is no checkout', () => {
    // Thirty-six characters cannot be read down a phone line.
    expect(
      orderLabel({
        id: '8e519a1a-afef-4edc-a502-73a2d9ed7e18',
        checkout: null,
      }),
    ).toBe('#8E519A1A');
  });
});
