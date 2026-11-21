/**
 * Recommend's cut of each sale, as the vendor is told about it.
 *
 * Each vendor's rate comes from the server on their profile (`commission.percent`): a
 * rate agreed with them, their category's, or the standard one. It is applied to the item
 * subtotal only — delivery never enters it. `STANDARD_FEE_PERCENT` is only what to show
 * before the profile has loaded, or if it says nothing.
 */
export const STANDARD_FEE_PERCENT = 20;

/** 25 → "25%", 7.5 → "7.5%". */
export function percentText(percent: number): string {
  return `${Number(percent.toFixed(2))}%`;
}

/** What a vendor keeps from a sale at `price` at `percent`, rounded to kobo like the backend. */
export function vendorShare(price: number, percent = STANDARD_FEE_PERCENT): number {
  const fee = Math.round(price * percent) / 100;
  return Math.round((price - fee) * 100) / 100;
}
