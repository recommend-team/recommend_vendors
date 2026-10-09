import { useCallback, useSyncExternalStore } from 'react';

const MUTED_KEY = 'recommend.vendor.alertSoundMuted';
const CHANGED = 'recommend:alert-sound-changed';

/**
 * Whether this device chimes.
 *
 * Per device, in local storage, on purpose: muting the tablet by the stove should not
 * silence the owner's phone. Shared across every component on the page, and across tabs.
 */
export function useAlertSound(): {
  muted: boolean;
  setMuted: (muted: boolean) => void;
} {
  const muted = useSyncExternalStore(subscribe, readMuted, () => false);

  const setMuted = useCallback((next: boolean) => {
    try {
      if (next) localStorage.setItem(MUTED_KEY, '1');
      else localStorage.removeItem(MUTED_KEY);
    } catch {
      // Storage unavailable (private mode). The choice lasts for this page only.
    }
    window.dispatchEvent(new Event(CHANGED));
  }, []);

  return { muted, setMuted };
}

/** For code outside React that needs the current answer. */
export function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGED, onChange);
  // Another tab changed it.
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener('storage', onChange);
  };
}
