/**
 * Money and time, as a vendor reads them.
 *
 * `lib/`, so React Native gets these unchanged.
 */

/**
 * Naira, never dollars.
 *
 * Amounts arrive from Postgres as decimal strings — `"3750.00"` — because JavaScript
 * numbers cannot be trusted with money. They are only turned into numbers here, at the
 * point of display, and never added up on the client: every total the vendor sees was
 * computed server-side.
 */
export function formatNaira(amount: string | number): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value)) return '₦0';
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

/** "2:45 PM" for today, "9 Aug" for anything older. */
export function formatOrderTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  return sameDay
    ? date.toLocaleTimeString('en-NG', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

/**
 * "2m ago", "3h ago", "5d ago" — for an activity feed, where the gap matters more than
 * the clock time. Anything older than a week is a date, because "23d ago" is arithmetic
 * the reader has to do themselves.
 */
export function formatAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

/**
 * A short handle for an order.
 *
 * Vendors read these aloud down a phone line, so the payment reference is preferable —
 * it is the one identifier the buyer, the vendor and admin all share. The order's own
 * uuid is the fallback, shortened, because thirty-six characters is not sayable.
 */
export function orderLabel(order: {
  id: string;
  checkout: { reference: string } | null;
}): string {
  return order.checkout?.reference ?? `#${order.id.slice(0, 8).toUpperCase()}`;
}
