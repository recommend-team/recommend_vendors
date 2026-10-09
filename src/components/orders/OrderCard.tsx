import { Link } from 'react-router-dom';
import { StatusPill } from '../ui/StatusPill';
import { formatNaira, formatOrderTime, orderLabel } from '../../lib/format';
import type { VendorOrder } from '../../lib/contract';
import { AddOnTag } from './AddOnTag';

/**
 * One order, as the reference draws it: a coloured spine, the reference, the customer,
 * the items, the money, and — if there is anything to do — one button.
 *
 * **There is no Accept and no Reject.** The reference shows both; neither exists.
 * Accepting was collapsed into "Ready for pickup" because they describe the same event
 * — the vendor has the goods and a rider can come — and two states for one event drift
 * apart. Declining is agreed but deliberately unbuilt: the money has already been taken,
 * so it needs a refund path, and half a refund path is worse than none. Until it exists
 * a decline is a phone call, recorded by admin as an override.
 *
 * The reference also puts a courier strip on a ready order — "David K. is 2 mins away".
 * There is no live location, so the strip says what is actually known: who has been
 * assigned to collect (with their number), or that nobody has yet.
 */
export function OrderCard({
  order,
  onMarkReady,
  busy = false,
}: {
  order: VendorOrder;
  onMarkReady: (id: string) => void;
  busy?: boolean;
}) {
  // The only status that means "do something now".
  const needsAction = order.status === 'PAID';

  return (
    <article
      className={[
        'overflow-hidden rounded-2xl bg-surface shadow-sm',
        // A left spine, so a vendor scanning the list sees what needs them before
        // reading a single word.
        'border-l-4',
        needsAction ? 'border-accent' : 'border-mint',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3.5">
        <div className="min-w-0">
          <p className="truncate font-mono text-[13px] font-extrabold text-ink">
            {orderLabel(order)}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-ink-soft">
            Customer: {order.buyerName}
          </p>
        </div>
        <StatusPill status={order.status} />
      </div>

      <ul className="mt-3 space-y-1.5 px-4">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-[14px]">
            <span className="shrink-0 text-brand" aria-hidden>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 4c0 8-5 12-11 12H5c0-8 5-12 11-12h4zM5 20c0-4 3-7 7-8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="shrink-0 font-extrabold text-ink">
              {item.quantity}×
            </span>
            <span className="min-w-0 flex-1 truncate text-ink">
              {item.productName}
              {item.isAddOn && <AddOnTag />}
            </span>
          </li>
        ))}
        {order.items.length === 0 && (
          <li className="text-[14px] text-ink-faint">No items recorded</li>
        )}
      </ul>

      {order.status === 'READY' && <ReadyStrip order={order} />}

      <div className="mt-3 flex items-baseline justify-between border-t border-hairline px-4 pt-3">
        <span className="text-[12px] text-ink-faint">
          Total amount
          {' · '}
          {order.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery'}
          {' · '}
          {formatOrderTime(order.createdAt)}
        </span>
        {/* This vendor's own subtotal — delivery belongs to the checkout, not to them. */}
        <span className="text-[17px] font-extrabold text-ink">
          {formatNaira(order.totalAmount)}
        </span>
      </div>

      <div className="flex gap-2 p-3">
        <Link
          to={`/orders/${order.id}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-mint px-4 text-[14px] font-bold text-brand transition active:scale-[0.99]"
        >
          View details
        </Link>

        {needsAction && (
          <button
            onClick={() => onMarkReady(order.id)}
            disabled={busy}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-accent px-4 text-[14px] font-bold text-white transition active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Mark ready'}
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * What a ready order is waiting for. A pickup, for the customer. A delivery, for the
 * rider admin has assigned — named, a tap away — or, until there is one, for admin.
 */
function ReadyStrip({ order }: { order: VendorOrder }) {
  const rider = order.checkout?.rider;
  const strip =
    'mx-4 mt-3 flex items-center justify-between gap-2 rounded-xl bg-mint-soft px-3 py-2 text-[12px] leading-snug font-bold text-brand';

  if (order.fulfillmentType === 'PICKUP') {
    return <p className={strip}>Ready — the customer is collecting it.</p>;
  }
  if (!rider) {
    return <p className={strip}>Ready — a rider is being assigned.</p>;
  }
  return (
    <p className={strip}>
      <span className="min-w-0 truncate">
        Ready — {rider.name} is collecting it.
      </span>
      {rider.phone && (
        <a
          href={`tel:${rider.phone}`}
          aria-label={`Call ${rider.name}`}
          className="shrink-0 rounded-full bg-brand px-3 py-1 text-[12px] font-extrabold text-white"
        >
          Call
        </a>
      )}
    </p>
  );
}
