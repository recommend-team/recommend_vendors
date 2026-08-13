/**
 * Getting Recommend onto a vendor's home screen.
 *
 * Ported from `recommend_customer_app/src/lib/install.ts` and deliberately identical: it
 * is `lib/`, so it depends on nothing but the DOM. The only change is the storage key,
 * namespaced per app so a vendor testing both on one phone does not inherit the other's
 * dismissal.
 *
 * It matters more here than it did there. A PWA cannot send a notification until it is
 * installed, and on iOS it cannot even *ask* until the app has been added to the home
 * screen by hand — so for an iPhone vendor, installing is not a nicety, it is the
 * precondition for ever being told an order came in. A missed order is a buyer who has
 * already paid for nothing.
 *
 * **This file does not survive the React Native port**, and is not meant to: a native app
 * is installed by definition. Sixty lines, budgeted as such.
 *
 * The two platforms need entirely different handling:
 *
 * - **Chrome/Android** fires `beforeinstallprompt`, which can be captured and replayed
 *   later against a tap of our own.
 * - **iOS Safari** fires nothing and offers no API at all. The only route is Share →
 *   Add to Home Screen, so the best we can do is say so, at a moment it makes sense.
 *
 * Storage-only and framework-agnostic, like everything else in `lib/`.
 */

const DISMISSED_KEY = 'recommend.vendor.install.dismissed';

/** Private mode throws on localStorage rather than returning null. */
function safeStorage(): Storage | null {
  try {
    const probe = '__recommend_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Chrome's deferred prompt. Not in TypeScript's DOM lib — it is not a standard. */
export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** True once the app is running from the home screen rather than a browser tab. */
export function isInstalled(): boolean {
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // iOS predates the display-mode media query and uses its own flag.
  return (navigator as { standalone?: boolean }).standalone === true;
}

/**
 * iOS Safari, where installing is a manual gesture we can only describe.
 *
 * Chrome and Firefox on iOS are also WebKit, but they cannot install at all — telling
 * their users to look for a Share menu that will not work would be worse than silence.
 */
export function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS reports as a Mac; the touch points give it away.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIos) return false;

  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

export function wasDismissed(): boolean {
  return safeStorage()?.getItem(DISMISSED_KEY) === '1';
}

/**
 * Remember a "no".
 *
 * Only for an explicit dismissal of our own banner — never for backing out of the
 * browser's install dialog, which is a hesitation rather than a refusal.
 *
 * Permanent rather than a cooling-off period: someone who declined once and is asked
 * again every week learns to distrust the app, and the browser's own install button
 * stays available to anyone who changes their mind.
 */
export function rememberDismissed(): void {
  safeStorage()?.setItem(DISMISSED_KEY, '1');
}

/**
 * Undo a "no".
 *
 * The customer app has no equivalent, and does not need one: a buyer who declines still
 * has the browser's own install button, and the cost of never installing is that they
 * have to navigate back themselves. For a vendor the cost is missed orders, and on iOS
 * there is no browser install button to fall back on — so the drawer keeps a permanent
 * way back in, and this is what it calls.
 */
export function forgetDismissed(): void {
  safeStorage()?.removeItem(DISMISSED_KEY);
}
