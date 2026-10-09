import type { NotificationType, VendorNotification } from './contract';

/**
 * What decides that a notification is worth interrupting someone for, and where it leads.
 *
 * Shared by the service worker (`sw.ts`) and the page, so a push in the background and a
 * chime in the foreground can never disagree about either.
 */

/**
 * The kinds that make a sound — the same ones the server pushes for.
 *
 * Everything else still lands on the badge and in the feed, silently. A wallet credit is
 * deliberately not here: a vendor with twenty orders a day would hear twenty chimes for
 * money they watched arrive (`recommend-be` → `wallet-notifications.spec.ts`).
 */
export const ALERTING_TYPES: ReadonlySet<string> = new Set<NotificationType>([
  'NEW_ORDER',
  'WITHDRAWAL_SETTLED',
  'WITHDRAWAL_FAILED',
]);

/** Messages between the service worker and the page. */
export const SW_PUSH_RECEIVED = 'recommend:push-received';
export const SW_NAVIGATE = 'recommend:navigate';

export interface PushMessage {
  title: string;
  body: string;
  type: string | null;
  /** An in-app path. Never a full URL — see `safePath`. */
  url: string;
  tag: string | null;
}

const FALLBACK_PATH = '/notifications';

/**
 * Read a push payload defensively. It comes off the network into code that opens windows,
 * so a missing field gets a sensible default and a URL is only ever honoured as a path.
 */
export function parsePushPayload(raw: unknown): PushMessage {
  const value = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const text = (field: unknown) =>
    typeof field === 'string' && field.trim() ? field : null;

  return {
    title: text(value.title) ?? 'Recommend',
    body: text(value.body) ?? '',
    type: text(value.type),
    url: safePath(value.url),
    tag: text(value.tag),
  };
}

/**
 * Only a same-app path survives. `//evil.example` is protocol-relative and `https://…` is
 * somewhere else entirely — neither may be opened from a notification tap.
 */
export function safePath(candidate: unknown): string {
  if (typeof candidate !== 'string') return FALLBACK_PATH;
  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return FALLBACK_PATH;
  }
  if (candidate.includes('\\')) return FALLBACK_PATH;
  return candidate;
}

/**
 * Unread notifications that are new since `seenUpTo` and worth a sound, newest first.
 *
 * Driven by the feed rather than by push, so the rule is the same whether the news came
 * by push or by the badge's own poll — a vendor who refused notifications still hears it.
 */
export function freshAlerts(
  items: readonly VendorNotification[],
  seenUpTo: number,
): VendorNotification[] {
  return items
    .filter(
      (item) =>
        !item.readAt &&
        ALERTING_TYPES.has(item.type) &&
        Date.parse(item.createdAt) > seenUpTo,
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** The newest timestamp in a feed, or `fallback` for an empty one. */
export function newestTimestamp(
  items: readonly VendorNotification[],
  fallback: number,
): number {
  return items.reduce(
    (latest, item) => Math.max(latest, Date.parse(item.createdAt) || 0),
    fallback,
  );
}

/** Where tapping a notification should take you, when there is somewhere useful. */
export function destinationFor(
  notification: VendorNotification,
): string | null {
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
