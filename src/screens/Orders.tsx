import { useState } from 'react';
import { OrderCard } from '../components/orders/OrderCard';
import { AlertsPrompt } from '../components/AlertsPrompt';
import { useMarkReady, useOrders, type OrdersTab } from '../hooks/useOrders';
import { useSession } from '../hooks/useSession';

/**
 * The home screen, and the reason the app exists.
 *
 * A worklist, not a dashboard — no summary cards, no charts, no "welcome back". The
 * first thing on screen is the thing that needs doing, because this is read standing up
 * mid-service and anything above it is something to scroll past.
 */
export function Orders() {
  const { user } = useSession();
  const [tab, setTab] = useState<OrdersTab>('active');
  const { orders, awaitingCount, isLoading, isError, refetch } = useOrders(tab);
  const markReady = useMarkReady();

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <header className="px-4 pt-5 pb-3">
        <p className="text-[11px] font-extrabold tracking-widest text-ink-soft uppercase">
          Merchant portal
        </p>
        <h1 className="mt-0.5 text-[28px] leading-tight font-extrabold text-ink">
          Orders
        </h1>
        {user?.businessName && (
          <p className="mt-1 truncate text-[13px] text-ink-soft">
            {user.businessName}
          </p>
        )}
      </header>

      {/* A segmented control rather than two loose chips: it reads as one choice with
          two settings, which is what it is. */}
      <div className="mx-4 flex gap-1 rounded-full bg-amber p-1">
        <Tab
          active={tab === 'active'}
          onClick={() => setTab('active')}
          // The count is on Active because it is the only number that should nag: how
          // many orders are waiting on this vendor right now.
          badge={awaitingCount || undefined}
        >
          Active
        </Tab>
        <Tab active={tab === 'past'} onClick={() => setTab('past')}>
          Past
        </Tab>
      </div>

      {/* Install is offered from the first visit; the notification ask waits until an
          order has actually arrived, because browsers only ever ask once. */}
      <AlertsPrompt askForPush={!isLoading && !isError && orders.length > 0} />

      <div className="flex-1 space-y-3 px-4 py-4">
        {isLoading && (
          <p className="py-10 text-center text-[13px] text-ink-soft">
            Loading your orders…
          </p>
        )}

        {isError && (
          <div className="py-10 text-center">
            <p className="text-[13px] text-ink-soft">
              Couldn&apos;t load your orders.
            </p>
            <button
              onClick={() => void refetch()}
              className="mt-3 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-[14px] font-bold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <p className="py-10 text-center text-[13px] leading-relaxed text-ink-soft">
            {tab === 'active'
              ? 'Nothing waiting. New orders land here the moment a customer pays.'
              : 'No past orders yet.'}
          </p>
        )}

        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            busy={markReady.isPending && markReady.variables === order.id}
            onMarkReady={(id) => markReady.mutate(id)}
          />
        ))}

        {markReady.isError && (
          <p
            role="alert"
            className="rounded-2xl bg-accent/10 px-4 py-3 text-[13px] text-accent"
          >
            Couldn&apos;t update that order. Nothing has changed — try again.
          </p>
        )}
      </div>
    </div>
  );
}

function Tab({
  active,
  badge,
  onClick,
  children,
}: {
  active: boolean;
  badge?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-bold transition',
        active ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft',
      ].join(' ')}
    >
      {children}
      {badge !== undefined && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-extrabold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
