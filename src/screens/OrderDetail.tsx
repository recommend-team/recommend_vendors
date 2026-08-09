import { Link, useNavigate, useParams } from 'react-router-dom';
import { StatusPill } from '../components/ui/StatusPill';
import { useMarkReady, useOrders } from '../hooks/useOrders';
import { formatNaira, formatOrderTime, orderLabel } from '../lib/format';

/**
 * One order in full — what to make, who it is for, and what the vendor is owed.
 *
 * Read from the list already in the cache rather than fetched on its own: the backend
 * has no single-order endpoint for vendors, and adding one would be a vendor-app-only
 * route, which is exactly what the plan says not to do if the React Native port is to
 * stay a re-skin.
 */
export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const markReady = useMarkReady();

  // Both tabs are drawn from one request, so either search finds any order.
  const { orders: active } = useOrders('active');
  const { orders: past } = useOrders('past');
  const order = [...active, ...past].find((candidate) => candidate.id === id);

  if (!order) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
        <p className="text-[14px] text-ink-soft">
          That order isn&apos;t in your list.
        </p>
        <Link
          to="/orders"
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-[14px] font-bold text-white"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const needsAction = order.status === 'PAID';

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <header className="flex items-center gap-3 px-4 pt-6 pb-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-ink"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[15px] font-extrabold text-ink">
            {orderLabel(order)}
          </p>
          <p className="text-[12px] text-ink-soft">
            {formatOrderTime(order.createdAt)}
          </p>
        </div>
        <StatusPill status={order.status} />
      </header>

      <div className="space-y-3 px-4 pb-4">
        <section className="rounded-2xl bg-surface p-4 shadow-sm">
          <h2 className="text-[11px] font-extrabold tracking-widest text-ink-faint uppercase">
            Items
          </h2>
          <ul className="mt-2 space-y-1.5">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline gap-2 text-[14px]"
              >
                <span className="shrink-0 font-extrabold text-ink-faint">
                  {item.quantity}×
                </span>
                <span className="min-w-0 flex-1 text-ink">
                  {item.productName}
                </span>
                <span className="shrink-0 text-ink-soft">
                  {formatNaira(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-surface p-4 shadow-sm">
          <h2 className="text-[11px] font-extrabold tracking-widest text-ink-faint uppercase">
            Customer
          </h2>
          <p className="mt-2 text-[15px] font-bold text-ink">
            {order.buyerName}
          </p>
          {/* A tap-to-call link, because the alternative is copying a number by hand
              while holding a pan. */}
          <a
            href={`tel:${order.buyerPhone}`}
            className="mt-0.5 inline-block text-[14px] font-bold text-accent"
          >
            {order.buyerPhone}
          </a>
          <p className="mt-2 text-[13px] leading-snug text-ink-soft">
            {order.fulfillmentType === 'DELIVERY'
              ? (order.deliveryAddress ?? 'Delivery address not given')
              : 'Customer is collecting'}
          </p>
          {order.notes && (
            <p className="mt-2 rounded-xl bg-amber px-3 py-2 text-[13px] leading-snug text-ink">
              {order.notes}
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-surface p-4 shadow-sm">
          <h2 className="text-[11px] font-extrabold tracking-widest text-ink-faint uppercase">
            Payment
          </h2>
          <Row label="Your items" value={formatNaira(order.totalAmount)} />
          <Row
            label="Platform fee"
            value={`−${formatNaira(order.platformFee)}`}
          />
          <Row
            label="You earn"
            value={formatNaira(order.vendorAmount)}
            strong
          />
          {/* Delivery belongs to the checkout, not to this vendor — showing it here
              would imply they are owed part of it. */}
          <p className="mt-2 text-[12px] leading-snug text-ink-faint">
            {order.paidAt
              ? `Paid ${formatOrderTime(order.paidAt)}`
              : 'Not paid yet'}
          </p>
        </section>
      </div>

      {needsAction && (
        <div
          className="mt-auto border-t border-hairline bg-surface p-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => markReady.mutate(order.id)}
            disabled={markReady.isPending}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-5 text-[15px] font-bold text-white transition active:scale-[0.99] disabled:opacity-50"
          >
            {markReady.isPending ? 'Saving…' : 'Mark ready for pickup'}
          </button>
          {markReady.isError && (
            <p
              role="alert"
              className="mt-2 text-center text-[13px] text-accent"
            >
              Couldn&apos;t update that. Nothing has changed — try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="mt-1.5 flex items-baseline justify-between">
      <span
        className={
          strong
            ? 'text-[14px] font-bold text-ink'
            : 'text-[14px] text-ink-soft'
        }
      >
        {label}
      </span>
      <span
        className={
          strong
            ? 'text-[17px] font-extrabold text-brand'
            : 'text-[14px] text-ink'
        }
      >
        {value}
      </span>
    </div>
  );
}
