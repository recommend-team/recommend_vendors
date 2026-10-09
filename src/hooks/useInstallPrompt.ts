import { useCallback, useSyncExternalStore } from 'react';
import {
  forgetDismissed,
  getInstallState,
  getServerInstallState,
  promptInstall,
  rememberDismissed,
  subscribe,
  type InstallKind,
} from '../lib/install';

export interface UseInstallPrompt {
  /**
   * How installing is possible right now — a capability, not a suggestion.
   *
   * Deliberately independent of `dismissed`: waving the banner away should quieten the
   * banner, not remove the drawer's ability to install. Callers that render a *prompt*
   * check `dismissed` themselves; callers that render a *control* do not.
   */
  kind: InstallKind;
  /** True once it runs from the home screen — the gate iOS push sits behind. */
  installed: boolean;
  /** Whether our banner was waved away. Shared across every caller, live. */
  dismissed: boolean;
  /** Replay Chrome's prompt. Call from a tap; a no-op unless `kind` is `'native'`. */
  install: () => void;
  dismiss: () => void;
  /** Undo a dismissal, so the banner comes back. */
  reset: () => void;
}

/**
 * Whether — and how — this vendor can put Recommend on their home screen.
 *
 * All of the state lives in `lib/install`, which starts listening at import time. This
 * is only a subscription, and that is the fix: `beforeinstallprompt` fires once per
 * document, so a listener that came and went with a component missed it outright. Every
 * caller here now sees the same event, whenever it arrived and whatever was on screen.
 */
export function useInstallPrompt(): UseInstallPrompt {
  const state = useSyncExternalStore(
    subscribe,
    getInstallState,
    getServerInstallState,
  );

  const install = useCallback(() => {
    void promptInstall();
  }, []);

  const dismiss = useCallback(() => rememberDismissed(), []);
  const reset = useCallback(() => forgetDismissed(), []);

  return { ...state, install, dismiss, reset };
}
