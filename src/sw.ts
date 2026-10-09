/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import {
  SW_NAVIGATE,
  SW_PUSH_RECEIVED,
  parsePushPayload,
  type PushMessage,
} from './lib/alerts';

/**
 * The vendor app's service worker.
 *
 * Ours rather than the one `vite-plugin-pwa` generates, because the generated one has no
 * `push` handler: the server was pushing every paid order to subscribed vendors and nothing
 * here displayed it, so Chrome put up its own "This site has been updated in the
 * background" instead. Everything the generated worker did, this one still does.
 */

declare const self: ServiceWorkerGlobalScope;

// ─── What the generated worker did ────────────────────────────────────────────

// The app shell, precached. Only the shell: orders change by the minute and money must
// never be read from a cache.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Deep links work offline and on refresh. `/api` is never answered with the shell.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api/],
  }),
);

// `registerType: 'prompt'`: a new version waits until `UpdateToast` asks for it, rather
// than reloading a vendor mid-service.
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

// ─── Push ─────────────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  event.waitUntil(deliver(parsePushPayload(readJson(event.data))));
});

/**
 * In front of the vendor: hand it to the page, which chimes and shows its own banner — a
 * system notification on top would be a second alert for the same thing. Otherwise the
 * system notification is the alert, and the phone's own tone is the sound.
 *
 * Chrome accepts a push that shows no notification only while a page of ours is visible,
 * which is exactly the case where none is shown.
 */
async function deliver(message: PushMessage): Promise<void> {
  const windows = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  const visible = windows.filter(
    (client) => client.visibilityState === 'visible',
  );

  if (visible.length > 0) {
    for (const client of visible) {
      client.postMessage({ type: SW_PUSH_RECEIVED, message });
    }
    return;
  }

  await self.registration.showNotification(message.title, {
    body: message.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: message.url },
    // Same event twice replaces rather than stacks.
    ...(message.tag ? { tag: message.tag } : {}),
  });
}

function readJson(data: PushMessageData | null): unknown {
  if (!data) return null;
  try {
    return data.json();
  } catch {
    // Not JSON — treat the text as the body rather than drop the alert.
    return { body: data.text() };
  }
}

// ─── Tapping a notification ───────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url } = parsePushPayload(event.notification.data);
  event.waitUntil(open(url));
});

/**
 * Bring an existing window forward and let the app route there itself — a client-side
 * navigation, so a vendor mid-task does not get a full reload. No window: open one.
 */
async function open(path: string): Promise<void> {
  const windows = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  const existing = windows[0];

  if (existing) {
    await existing.focus();
    existing.postMessage({ type: SW_NAVIGATE, url: path });
    return;
  }

  await self.clients.openWindow(path);
}
