/**
 * Recommend's cut of each sale, as the vendor is told about it.
 *
 * Mirrors `PLATFORM_FEE_PERCENT` in `recommend-be` (default 20), which is applied to the
 * item subtotal only — delivery never enters it. Copied by hand for now; the backend
 * should expose the live rate so this cannot drift from what is actually charged. Until
 * then, this is the one place to change it.
 */
export const PLATFORM_FEE_PERCENT = 20;

/** What a vendor keeps from a sale at `price`, rounded to kobo like the backend. */
export function vendorShare(price: number): number {
  const fee = Math.round(price * PLATFORM_FEE_PERCENT) / 100;
  return Math.round((price - fee) * 100) / 100;
}
