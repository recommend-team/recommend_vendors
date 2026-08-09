import { request } from './api';

/**
 * Web push, for the one notification that matters: a new paid order.
 *
 * A vendor who misses an order is a buyer who paid for nothing, so this is the closest
 * thing the app has to a critical feature. It reuses the VAPID setup already running in
 * `recommend-be` — `push.service.ts`, the `push_subscriptions` table, and the
 * `checkout.paid` listener that already notifies vendors.
 *
 * Everything here degrades rather than throws. Push is best-effort by nature: a denied
 * permission, an unsupported browser or a missing VAPID key all end with the vendor
 * simply not subscribed, and the in-app list remains the durable record.
 *
 * **None of this survives the React Native port.** FCM and APNs share nothing with web
 * push — budget it as new work when that happens.
 */

export type PushState =
  /** The browser cannot do this at all — no service worker, or an iOS tab. */
  | 'unsupported'
  /** Push is not configured on the server; there is nothing to subscribe to. */
  | 'unconfigured'
  /** Available, not yet asked for. */
  | 'available'
  | 'granted'
  /** Refused. Browsers will not re-prompt, so this is effectively permanent. */
  | 'denied';

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** Whether the server has VAPID keys. Null means push is switched off there. */
export async function getPublicKey(): Promise<string | null> {
  try {
    const { publicKey } = await request<{ publicKey: string | null }>(
      '/notifications/push/public-key',
      { anonymous: true },
    );
    return publicKey ?? null;
  } catch {
    return null;
  }
}

export async function currentState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';

  const key = await getPublicKey();
  if (!key) return 'unconfigured';

  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    // Permission alone is not enough — a subscription can be dropped by the browser
    // while the permission stays granted, which reads as "on" and delivers nothing.
    return existing ? 'granted' : 'available';
  }

  return 'available';
}

/**
 * Ask, subscribe, and register with the server.
 *
 * Call this from a tap, never on load. A permission prompt a vendor did not ask for is
 * the fastest route to a permanent "no", and browsers do not offer a second chance.
 */
export async function subscribe(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';

  const key = await getPublicKey();
  if (!key) return 'unconfigured';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();

  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      // Chrome refuses a subscription that is not user-visible, and rightly so.
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    }));

  const json = subscription.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return 'available';
  }

  await request<null>('/notifications/push/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      userAgent: navigator.userAgent.slice(0, 300),
    }),
  });

  return 'granted';
}

/**
 * VAPID keys travel as base64url; `PushManager` wants raw bytes.
 *
 * Not a formality — passing the string through unconverted produces an
 * `InvalidCharacterError` that reads as though the key itself is wrong.
 */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalised);

  // Backed by an explicit ArrayBuffer: `applicationServerKey` will not accept a view
  // that TypeScript thinks might sit on a SharedArrayBuffer.
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
