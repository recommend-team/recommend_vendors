import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from '../../hooks/useNotifications';
import { readMuted } from '../../hooks/useAlertSound';
import {
  SW_NAVIGATE,
  SW_PUSH_RECEIVED,
  destinationFor,
  freshAlerts,
  newestTimestamp,
  safePath,
} from '../../lib/alerts';
import type { VendorNotification } from '../../lib/contract';
import { armChime, playChime } from './chime';

/**
 * How long the app must have been on screen before news is announced in it.
 *
 * A vendor coming back to the app has usually just been alerted by the phone — often they
 * tapped that very notification to get here. The refetch on return would otherwise chime
 * a second time for the same order.
 */
const SETTLE_MS = 3_000;

const BANNER_MS = 8_000;

/**
 * Sound and a banner for news that arrives while the app is open.
 *
 * One rule, whatever carried the news: when the feed gains an unread notification of a
 * kind worth interrupting for (`ALERTING_TYPES`), chime once and show it. A push only
 * makes the feed refresh sooner; the badge's own poll does the same a little later, which
 * is how a vendor who refused notifications still hears an order.
 *
 * Mounted once, in the signed-in shell.
 */
export function NotificationAlerts() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const markRead = useMarkRead();
  const { data: unread } = useUnreadCount();
  const { data: feed } = useNotifications();
  const [banner, setBanner] = useState<VendorNotification | null>(null);

  // Server timestamps only — never compared with this device's clock, which may be wrong.
  const seenUpTo = useRef<number | null>(null);
  const lastUnread = useRef<number | undefined>(undefined);
  const visibleSince = useRef<number | null>(
    document.visibilityState === 'visible' ? Date.now() : null,
  );

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    void queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
  }, [queryClient]);

  useEffect(() => armChime(), []);

  useEffect(() => {
    const onVisibility = () => {
      visibleSince.current =
        document.visibilityState === 'visible' ? Date.now() : null;
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // From the service worker: a push arrived while we are on screen, or a notification was
  // tapped and we are the window it chose.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: unknown } | null;
      if (data?.type === SW_PUSH_RECEIVED) refresh();
      else if (data?.type === SW_NAVIGATE) navigate(safePath(data.url));
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [navigate, refresh]);

  // The badge went up on its own poll: fetch the feed, which decides below.
  useEffect(() => {
    if (unread === undefined) return;
    if (lastUnread.current !== undefined && unread > lastUnread.current) {
      refresh();
    }
    lastUnread.current = unread;
  }, [unread, refresh]);

  // The decision.
  useEffect(() => {
    if (!feed) return;

    // The first load is the baseline. Anything already there is not news.
    if (seenUpTo.current === null) {
      seenUpTo.current = newestTimestamp(feed.items, 0);
      return;
    }

    const fresh = freshAlerts(feed.items, seenUpTo.current);
    seenUpTo.current = newestTimestamp(feed.items, seenUpTo.current);
    if (fresh.length === 0) return;

    const settled =
      visibleSince.current !== null &&
      Date.now() - visibleSince.current >= SETTLE_MS;
    if (!settled) return;

    setBanner(fresh[0]);
    if (!readMuted()) playChime();
  }, [feed]);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), BANNER_MS);
    return () => window.clearTimeout(timer);
  }, [banner]);

  if (!banner) return null;

  const open = () => {
    if (!banner.readAt) markRead.mutate(banner.id);
    navigate(destinationFor(banner) ?? '/notifications');
    setBanner(null);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3">
      <div
        role="status"
        className="pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-2xl bg-ink p-1.5 text-white shadow-lg"
      >
        <button
          onClick={open}
          className="min-w-0 flex-1 rounded-xl px-2.5 py-1.5 text-left transition active:bg-white/10"
        >
          <span className="block text-[14px] font-extrabold">
            {banner.title}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-white/75">
            {banner.body}
          </span>
        </button>

        <button
          onClick={() => setBanner(null)}
          aria-label="Dismiss"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/60 transition active:opacity-60"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path
              d="M1 1l10 10M11 1L1 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
