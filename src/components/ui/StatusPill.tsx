import type { OrderStatus } from '../../lib/contract';

/**
 * An order's state, in words a vendor would actually use.
 *
 * Never the raw enum. And deliberately **the same words the buyer saw** — when a vendor
 * is on the phone to a customer asking where their food is, a shared vocabulary is what
 * makes that call short.
 *
 * `PAID` reads as "New order" rather than "Paid": to a vendor the money is not the
 * point, the work is. It is the only status that means *do something now*.
 */
const LABELS: Record<OrderStatus, { text: string; tone: string }> = {
  PENDING_PAYMENT: {
    text: 'Not paid',
    tone: 'bg-black/5 text-ink-faint',
  },
  PAID: {
    text: 'New order',
    tone: 'bg-accent/10 text-accent',
  },
  READY: {
    text: 'Ready for pickup',
    tone: 'bg-mint text-brand',
  },
  DISPATCHED: {
    text: 'On its way',
    tone: 'bg-brand/10 text-brand',
  },
  PROCESSING: {
    text: 'In progress',
    tone: 'bg-black/5 text-ink-soft',
  },
  COMPLETED: {
    text: 'Delivered',
    tone: 'bg-brand/10 text-brand',
  },
  CANCELLED: {
    text: 'Cancelled',
    tone: 'bg-black/5 text-ink-faint',
  },
  REFUNDED: {
    text: 'Refunded',
    tone: 'bg-black/5 text-ink-soft',
  },
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const label = LABELS[status] ?? {
    text: status,
    tone: 'bg-black/5 text-ink-faint',
  };

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide uppercase ${label.tone}`}
    >
      {label.text}
    </span>
  );
}
