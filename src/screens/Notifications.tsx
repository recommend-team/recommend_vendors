import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from '../hooks/useNotifications';
import { formatAgo } from '../lib/format';
import type { NotificationType, VendorNotification } from '../lib/contract';

/**
 * Everything that has happened, whether or not the vendor was told at the time.
 *
 * This is the record; push and email are best-effort layers over it. That distinction is
 * not academic — no vendor has ever granted push, so for now this is the only place any
 * of it can be seen inside the app.
 *
 * The whole history, not just the unread. A vendor looking for the order that came in on
 * Tuesday should not have to remember whether they tapped the alert.
 */
export function Notifications() {
  const { data, isLoading, isError } = useNotifications();
  const markAll = useMarkAllRead();

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <ScreenHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : undefined}
      />

      <div className="px-4 pb-6">
        {unread > 0 && (
          <button
            onClick={() => void markAll.mutateAsync()}
            disabled={markAll.isPending}
            className="mb-3 text-[13px] font-bold text-brand disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}

        {isLoading && (
          <p className="py-10 text-center text-[13px] text-ink-soft">Loading…</p>
        )}

        {isError && (
          <p className="py-10 text-center text-[13px] text-ink-soft">
            Couldn&apos;t load your notifications.
          </p>
        )}

        {data && items.length === 0 && (
          <p className="py-10 text-center text-[13px] leading-relaxed text-ink-soft">
            Nothing yet. New orders, payments and withdrawals show up here — and
            stay, so you can always come back to them.
          </p>
        )}

        <ul className="space-y-2">
          {items.map((notification) => (
            <Row key={notification.id} notification={notification} />
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Where tapping one should take you, when there is somewhere useful. */
function destinationFor(notification: VendorNotification): string | null {
  const orderId = notification.data?.orderId;

  switch (notification.type) {
    case 'NEW_ORDER':
    case 'ORDER_PAID':
    case 'ORDER_CANCELLED':
      return typeof orderId === 'string' ? `/orders/${orderId}` : '/orders';
    case 'WALLET_CREDITED':
    case 'WITHDRAWAL_SETTLED':
    case 'WITHDRAWAL_FAILED':
      return '/wallet';
    case 'KYC_APPROVED':
    case 'KYC_REJECTED':
      return '/kyc';
    default:
      return null;
  }
}

/** A dot per kind, so the list is scannable without reading every line. */
const TONE: Record<NotificationType, string> = {
  NEW_ORDER: 'bg-accent',
  ORDER_PAID: 'bg-brand',
  ORDER_CANCELLED: 'bg-ink-faint',
  KYC_APPROVED: 'bg-brand',
  KYC_REJECTED: 'bg-accent',
  WALLET_CREDITED: 'bg-brand',
  WITHDRAWAL_SETTLED: 'bg-brand',
  WITHDRAWAL_FAILED: 'bg-accent',
};

function Row({ notification }: { notification: VendorNotification }) {
  const navigate = useNavigate();
  const markRead = useMarkRead();

  const unread = !notification.readAt;
  const destination = destinationFor(notification);

  const open = () => {
    // Marked read on the way out rather than awaited — the vendor came here to see the
    // thing, and a round trip in front of that is a round trip for our bookkeeping.
    if (unread) markRead.mutate(notification.id);
    if (destination) navigate(destination);
  };

  return (
    <li>
      <button
        onClick={open}
        className={[
          'flex w-full items-start gap-3 rounded-2xl p-3.5 text-left shadow-sm transition active:scale-[0.995]',
          unread ? 'bg-surface' : 'bg-surface/60',
        ].join(' ')}
      >
        <span
          aria-hidden
          className={[
            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
            unread ? TONE[notification.type] : 'bg-transparent',
          ].join(' ')}
        />

        <span className="min-w-0 flex-1">
          <span
            className={[
              'block text-[14px]',
              unread ? 'font-extrabold text-ink' : 'font-bold text-ink-soft',
            ].join(' ')}
          >
            {notification.title}
          </span>
          <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">
            {notification.body}
          </span>
          <span className="mt-1 block text-[12px] text-ink-faint">
            {formatAgo(notification.createdAt)}
          </span>
        </span>
      </button>
    </li>
  );
}
