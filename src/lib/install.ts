/**
 * Getting Recommend onto a vendor's home screen.
 *
 * It matters more here than in the customer app. A PWA cannot send a notification until
 * it is installed, and on iOS it cannot even *ask* until the app has been added to the
 * home screen by hand — so for an iPhone vendor, installing is not a nicety, it is the
 * precondition for ever being told an order came in. A missed order is a buyer who has
 * already paid for nothing.
 *
 * **This is a module-level store, not React state, and that is the whole point.**
 *
 * Chrome fires `beforeinstallprompt` exactly once, early, on page load — and never again
 * for that document, including across client-side navigations. When the listener lived
 * inside a component the event was gone before anything could use it: the only consumer
 * mounted on `/orders`, behind auth, so a vendor signing in at `/login` had the event
 * fire into an empty room, and every later navigation remounted that consumer with
 * nothing to replay. The install button was therefore dead in practice, which is exactly
 * how it was reported.
 *
 * So the listener is attached here, at import time, before React renders a single node,
 * and the event is held for the life of the document. Components subscribe; mounting and
 * unmounting no longer decides whether installing is possible. A vendor can open the
 * drawer on any screen, at any point in the session, and install.
 *
 * **This file does not survive the React Native port**, and is not meant to: a native app
 * is installed by definition.
 *
 * The platforms need entirely different handling:
 *
 * - **Chrome/Android** fires `beforeinstallprompt`, captured here and replayed against a
 *   tap of our own.
 * - **iOS Safari** fires nothing and offers no API at all. The only route is Share →
 *   Add to Home Screen, so the best we can do is say so.
 * - **A spent event** — a captured event can be prompted with once. After a vendor backs
 *   out of the native dialog there may be nothing left to replay, but the browser's own
 *   menu still installs, so we say where it is rather than going quiet.
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

/**
 * How — if at all — this vendor can install right now.
 *
 * - `native` — one tap, we hold a live prompt.
 * - `ios` — Safari's Share sheet, described.
 * - `manual` — provably installable (an event did arrive) but with nothing left to
 *   replay; the browser's own menu is the route.
 * - `null` — already installed, or a browser that cannot install at all.
 */
export type InstallKind = 'native' | 'ios' | 'manual' | null;

export interface InstallState {
  kind: InstallKind;
  /** True once it runs from the home screen — the gate iOS push sits behind. */
  installed: boolean;
  /** Whether our banner was waved away. Suppresses the banner; `kind` still stands. */
  dismissed: boolean;
}

/** True once the app is running from the home screen rather than a browser tab. */
export function isInstalled(): boolean {
  if (typeof window === 'undefined') return false;
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
  if (typeof navigator === 'undefined') return false;
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

// ---------------------------------------------------------------------------------
// The store
// ---------------------------------------------------------------------------------

/** The captured event, held for the life of the document. */
let deferred: InstallPromptEvent | null = null;
/** `prompt()` has been spent on `deferred`; a second call on it would throw. */
let spent = false;
let installed = isInstalled();

const listeners = new Set<() => void>();

function computeKind(): InstallKind {
  if (installed) return null;
  if (deferred && !spent) return 'native';
  // Ahead of `manual`: an iPhone has no browser install menu to point at, so the Share
  // sheet is the only truthful instruction even if an event somehow arrived.
  if (isIosSafari()) return 'ios';
  if (deferred) return 'manual';
  return null;
}

function compute(): InstallState {
  return { kind: computeKind(), installed, dismissed: wasDismissed() };
}

// `useSyncExternalStore` compares snapshots by identity and would loop forever on a
// fresh object per read, so one is built per change and handed out until the next.
let snapshot: InstallState = { kind: null, installed: false, dismissed: false };

function emit(): void {
  snapshot = compute();
  for (const listener of listeners) listener();
}

if (typeof window !== 'undefined') {
  snapshot = compute();

  window.addEventListener('beforeinstallprompt', (event) => {
    // Chrome would otherwise show its own mini-infobar at a moment of its choosing.
    // Holding the event lets us ask once the vendor has seen what the app does.
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    // Chrome re-fires after a dismissed dialog on a later load. A fresh event is a fresh
    // chance, so the spent flag lifts with it.
    spent = false;
    emit();
  });

  // Fires whether they installed from our button or the browser's own menu.
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    spent = false;
    emit();
  });

  // Launching from the home screen is a new document and re-runs `isInstalled`, but a
  // tab can also become standalone underneath us. Cheap to follow, wrong to miss.
  window
    .matchMedia?.('(display-mode: standalone)')
    ?.addEventListener?.('change', (event) => {
      installed = event.matches;
      emit();
    });
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInstallState(): InstallState {
  return snapshot;
}

/** Any future SSR pass reads this; it never has a captured event. */
const SERVER_STATE: InstallState = {
  kind: null,
  installed: false,
  dismissed: false,
};

export function getServerInstallState(): InstallState {
  return SERVER_STATE;
}

/**
 * Replay the captured prompt against a tap of our own.
 *
 * Must be called from a user gesture — Chrome rejects it otherwise, which is why this is
 * wired to a button rather than fired on arrival.
 *
 * Notably we do *not* remember a "no" here: backing out of the browser's own dialog is
 * not the same as declining ours. Someone who tapped Add and then mis-tapped, got
 * interrupted, or simply hesitated has shown interest, and holding that against them
 * forever would be the wrong reading. The event is only marked spent, so we stop
 * offering a button that would throw and `kind` falls back to `manual` — still a route,
 * just a described one.
 */
export async function promptInstall(): Promise<
  'accepted' | 'dismissed' | 'unavailable'
> {
  if (!deferred || spent) return 'unavailable';

  const event = deferred;
  spent = true;

  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    // `appinstalled` clears this too, but it is not guaranteed to arrive promptly and an
    // install button still on screen after a successful install reads as a failure.
    if (outcome === 'accepted') deferred = null;
    emit();
    return outcome;
  } catch {
    // Already prompted, or the browser refused the gesture. Either way it is not
    // replayable — drop it and let `kind` fall through to instructions.
    deferred = null;
    emit();
    return 'unavailable';
  }
}

/**
 * Remember a "no".
 *
 * Only for an explicit dismissal of our own banner — never for backing out of the
 * browser's install dialog, which is a hesitation rather than a refusal.
 *
 * Permanent rather than a cooling-off period: someone who declined once and is asked
 * again every week learns to distrust the app. It suppresses the banner only — the
 * drawer still installs on demand, which is what "anytime they want" has to mean.
 */
export function rememberDismissed(): void {
  safeStorage()?.setItem(DISMISSED_KEY, '1');
  emit();
}

/** Undo a "no" — everywhere at once, not just where it was tapped. */
export function forgetDismissed(): void {
  safeStorage()?.removeItem(DISMISSED_KEY);
  emit();
}

/** Tests only: drop the captured event and every subscriber between cases. */
export function resetInstallStoreForTests(): void {
  deferred = null;
  spent = false;
  installed = isInstalled();
  listeners.clear();
  snapshot = compute();
}
