import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  forgetDismissed,
  getInstallState,
  promptInstall,
  rememberDismissed,
  resetInstallStoreForTests,
  subscribe,
  type InstallPromptEvent,
} from './install';

/**
 * The store, not the components — because the bug was never in a component.
 *
 * `beforeinstallprompt` fires once per document, early, and the old code listened for it
 * from inside a hook. Whichever screen happened to be mounted at that moment decided
 * whether the app could ever be installed, and on a cold start that screen was the login
 * page. These cases pin down the property that fixes it: the event is caught at import
 * time and stays available afterwards, regardless of what mounts or unmounts.
 */

/** Chrome's event, as far as anything here is concerned. */
function fireBeforeInstallPrompt(
  outcome: 'accepted' | 'dismissed' = 'accepted',
) {
  const event = new Event('beforeinstallprompt') as InstallPromptEvent;
  const prompt = vi.fn().mockResolvedValue(undefined);
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome }) });
  window.dispatchEvent(event);
  return { event, prompt };
}

describe('install store', () => {
  beforeEach(() => {
    resetInstallStoreForTests();
    localStorage.clear();
  });

  it('holds an event that arrived before anything subscribed', () => {
    // The real sequence: Chrome fires while the vendor is still on /login, and the
    // component that installs does not mount until /orders, several taps later.
    fireBeforeInstallPrompt();

    expect(getInstallState().kind).toBe('native');
  });

  it('keeps offering install after a subscriber comes and goes', () => {
    fireBeforeInstallPrompt();

    // Navigating to Orders and away again — the old hook lost the event right here and
    // never got another, because Chrome does not re-fire on client-side navigation.
    const unsubscribe = subscribe(vi.fn());
    unsubscribe();

    expect(getInstallState().kind).toBe('native');
  });

  it('notifies every subscriber when the event arrives', () => {
    const a = vi.fn();
    const b = vi.fn();
    subscribe(a);
    subscribe(b);

    fireBeforeInstallPrompt();

    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });

  it('hands out the same snapshot until something changes', () => {
    // useSyncExternalStore compares by identity; a fresh object per read renders forever.
    expect(getInstallState()).toBe(getInstallState());
  });

  it('replays the captured prompt on demand', async () => {
    const { prompt } = fireBeforeInstallPrompt('accepted');

    await expect(promptInstall()).resolves.toBe('accepted');
    expect(prompt).toHaveBeenCalledOnce();
  });

  it('stops offering a button once the event is accepted', async () => {
    fireBeforeInstallPrompt('accepted');
    await promptInstall();

    expect(getInstallState().kind).toBeNull();
  });

  /**
   * The prompt is single-use: calling it twice throws. Rather than leaving a button that
   * would fail, the state falls back to instructions the vendor can still act on.
   */
  it('falls back to menu instructions once the prompt is spent', async () => {
    fireBeforeInstallPrompt('dismissed');
    await promptInstall();

    expect(getInstallState().kind).toBe('manual');
    await expect(promptInstall()).resolves.toBe('unavailable');
  });

  it('takes a fresh event as a fresh chance', async () => {
    fireBeforeInstallPrompt('dismissed');
    await promptInstall();
    expect(getInstallState().kind).toBe('manual');

    // Chrome re-fires on a later load for someone who backed out.
    fireBeforeInstallPrompt('accepted');

    expect(getInstallState().kind).toBe('native');
  });

  it('does not hold a backed-out dialog against them', async () => {
    fireBeforeInstallPrompt('dismissed');
    await promptInstall();

    // Only our own banner's "Not now" is a refusal worth remembering.
    expect(getInstallState().dismissed).toBe(false);
  });

  it('clears on appinstalled, however they got there', () => {
    fireBeforeInstallPrompt();
    window.dispatchEvent(new Event('appinstalled'));

    expect(getInstallState()).toMatchObject({ kind: null, installed: true });
  });

  it('leaves install possible after the banner is dismissed', () => {
    fireBeforeInstallPrompt();
    rememberDismissed();

    // The banner hides itself on `dismissed`; the drawer keeps installing on `kind`.
    expect(getInstallState()).toMatchObject({
      kind: 'native',
      dismissed: true,
    });
  });

  it('propagates a reset to everyone, not just the caller', () => {
    const listener = vi.fn();
    rememberDismissed();
    subscribe(listener);

    forgetDismissed();

    expect(listener).toHaveBeenCalled();
    expect(getInstallState().dismissed).toBe(false);
  });
});
