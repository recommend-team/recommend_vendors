import { Link } from 'react-router-dom';
import { Fab } from '../components/ui/Fab';
import { formatAgo, formatNaira, orderLabel } from '../lib/format';
import {
  useEarnings,
  useUpdateProfile,
  useVendorProfile,
} from '../hooks/useProfile';
import { useOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import type { Earnings, VendorOrder } from '../lib/contract';
import type { ReactNode } from 'react';

/**
 * The hub: what the business earned, and what has been happening.
 *
 * Deliberately not the landing screen — Orders is. A vendor opening this app mid-service
 * wants the work, not a summary. This is where they come between rushes.
 *
 * Everything on it is a number the server computed. The reference design shows tiles for
 * "today's orders" and "pending payouts"; neither exists as an API concept — there is no
 * payout ledger, and the orders list is fetched per tab so a same-day count across every
 * status would be wrong. The tiles keep the design's shape and carry figures that are
 * true instead.
 */
export function Dashboard() {
  const { data: profile, isLoading } = useVendorProfile();
  const { data: earnings } = useEarnings();
  const { orders, awaitingCount } = useOrders('active');
  const { total: productCount } = useProducts();
  const update = useUpdateProfile();

  const open = profile?.isOpen ?? false;
  const trend = monthOnMonth(earnings);

  return (
    <div className="flex min-h-full flex-col bg-canvas pb-28">
      <header className="px-4 pt-5 pb-3">
        <p className="text-[11px] font-extrabold tracking-widest text-ink-soft uppercase">
          Welcome back
        </p>
        <h1 className="mt-0.5 truncate text-[28px] leading-tight font-extrabold text-ink">
          {profile?.businessName ?? 'Your business'}
        </h1>

        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber px-3 py-1.5 text-[11px] font-bold text-ink-soft">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 3l8 3v6c0 4.4-3.4 8.3-8 9-4.6-.7-8-4.6-8-9V6l8-3z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          {profile?.status === 'APPROVED'
            ? 'Verified merchant'
            : 'Awaiting approval'}
          {profile?.slug && ` · ${profile.slug}`}
        </p>
      </header>

      <div className="space-y-3 px-4">
        {/* The shutter. One tap, near the top, because closing early is a decision made
            in a hurry and buried settings are how a vendor takes orders they cannot fill. */}
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm">
          <span
            className={[
              'h-3 w-3 shrink-0 rounded-full',
              open ? 'bg-brand' : 'bg-ink-faint',
            ].join(' ')}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold text-ink">
              {open ? 'Open for orders' : 'Closed'}
            </p>
            <p className="text-[12px] leading-snug text-ink-soft">
              {open
                ? 'Buyers can see and order your products.'
                : 'Your products are hidden until you open again.'}
            </p>
          </div>
          <button
            onClick={() => update.mutate({ isOpen: !open })}
            disabled={isLoading || update.isPending}
            role="switch"
            aria-checked={open}
            aria-label={open ? 'Close the shop' : 'Open the shop'}
            className={[
              'relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50',
              open ? 'bg-brand' : 'bg-hairline',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-1 h-5 w-5 rounded-full bg-white transition-all',
                open ? 'left-6' : 'left-1',
              ].join(' ')}
            />
          </button>
        </div>

        <section className="rounded-2xl bg-amber p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-extrabold tracking-widest text-ink-soft uppercase">
              Total earnings
            </p>
            <span className="text-ink-faint" aria-hidden>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <rect
                  x="2"
                  y="6"
                  width="20"
                  height="12"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="2.6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </span>
          </div>

          <p className="mt-1 text-[34px] leading-none font-extrabold text-accent">
            {earnings ? formatNaira(earnings.netTotal) : '—'}
          </p>

          {trend ? (
            <p
              className={[
                'mt-2 text-[12px] font-bold',
                trend.up ? 'text-brand' : 'text-ink-soft',
              ].join(' ')}
            >
              {trend.up ? '↑' : '↓'} {trend.percent}% from last month
            </p>
          ) : (
            <p className="mt-2 text-[12px] text-ink-soft">
              After the platform fee. Paid out manually for now.
            </p>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Waiting on you"
            value={String(awaitingCount)}
            icon={
              <path
                d="M3 7h11v8H3V7zm11 3h4l3 3v2h-7v-5z"
                stroke="currentColor"
                strokeWidth="1.6"
                fill="none"
                strokeLinejoin="round"
              />
            }
          />
          <Stat
            label="Products listed"
            value={String(productCount)}
            icon={
              <path
                d="M4 7l8-4 8 4v10l-8 4-8-4V7zm8 4 8-4M4 7l8 4v10"
                stroke="currentColor"
                strokeWidth="1.6"
                fill="none"
                strokeLinejoin="round"
              />
            }
          />
        </div>

        <h2 className="pt-2 text-[15px] font-extrabold text-ink">
          Vendor toolkit
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/products/new"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-4 text-[14px] font-bold text-white active:scale-[0.99]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
            Add product
          </Link>
          <Link
            to="/products"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-mint px-4 text-[14px] font-bold text-brand active:scale-[0.99]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 6h16M4 12h16M4 18h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Manage stock
          </Link>
        </div>

        <div className="flex items-baseline justify-between pt-2">
          <h2 className="text-[15px] font-extrabold text-ink">Live activity</h2>
          <Link to="/orders" className="text-[13px] font-bold text-accent">
            View all
          </Link>
        </div>

        <section className="overflow-hidden rounded-2xl bg-surface shadow-sm">
          {orders.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] leading-relaxed text-ink-soft">
              Nothing yet. Orders appear here the moment a customer pays.
            </p>
          ) : (
            orders
              .slice(0, 4)
              .map((order, index) => (
                <ActivityRow
                  key={order.id}
                  order={order}
                  last={index === Math.min(orders.length, 4) - 1}
                />
              ))
          )}
        </section>

        {profile && profile.profileCompleteness < 100 && (
          <p className="px-1 pb-2 text-[12px] leading-snug text-ink-soft">
            Your profile is {profile.profileCompleteness}% complete. Filling it
            in helps buyers find and trust you.
          </p>
        )}
      </div>

      <Fab to="/products/new" label="Add a product" />
    </div>
  );
}

/**
 * Month-on-month movement, or nothing.
 *
 * Returns `null` unless there are two months to compare and the earlier one is non-zero —
 * "up 100% from last month" against a base of zero is noise dressed as insight, and a
 * percentage is the easiest number on a dashboard to quietly get wrong.
 */
function monthOnMonth(
  earnings: Earnings | undefined,
): { up: boolean; percent: number } | null {
  const months = earnings?.monthlyBreakdown ?? [];
  if (months.length < 2) return null;

  const previous = months[months.length - 2].net;
  const latest = months[months.length - 1].net;
  if (!previous) return null;

  const change = ((latest - previous) / previous) * 100;
  return { up: change >= 0, percent: Math.abs(Math.round(change)) };
}

/** What an order looks like as a line in a feed. */
function ActivityRow({ order, last }: { order: VendorOrder; last: boolean }) {
  const copy = {
    PAID: { title: 'New order', tone: 'bg-accent/10 text-accent' },
    READY: { title: 'Marked ready', tone: 'bg-mint-soft text-brand' },
    DISPATCHED: { title: 'Rider on the way', tone: 'bg-mint-soft text-brand' },
  }[order.status as 'PAID' | 'READY' | 'DISPATCHED'] ?? {
    title: 'Order updated',
    tone: 'bg-black/5 text-ink-soft',
  };

  const first = order.items[0];
  const detail = first
    ? `${first.quantity}× ${first.productName}`
    : orderLabel(order);

  return (
    <Link
      to={`/orders/${order.id}`}
      className={[
        'flex items-center gap-3 px-4 py-3',
        last ? '' : 'border-b border-hairline',
      ].join(' ')}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${copy.tone}`}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 8h14l-1 12H6L5 8zm3 0V6a4 4 0 0 1 8 0v2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-ink">{copy.title}</p>
        <p className="truncate text-[12px] text-ink-soft">{detail}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[14px] font-extrabold text-ink">
          {formatNaira(order.totalAmount)}
        </p>
        <p className="text-[11px] text-ink-faint">
          {formatAgo(order.paidAt ?? order.createdAt)}
        </p>
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-amber p-4">
      <span className="text-ink-soft" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24">
          {icon}
        </svg>
      </span>
      <p className="mt-1 text-2xl font-extrabold text-ink">{value}</p>
      <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">{label}</p>
    </div>
  );
}
