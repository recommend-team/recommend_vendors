import { useCallback, useEffect, useState } from 'react';
import { currentState, subscribe, type PushState } from '../lib/push';

const DISMISSED_KEY = 'recommend.vendor.pushPromptDismissed';

export interface UsePush {
  state: PushState;
  /** True when it is worth asking — supported, configured, and not already answered. */
  canAsk: boolean;
  dismissed: boolean;
  enable: () => Promise<void>;
  dismiss: () => void;
  busy: boolean;
}

/**
 * Push, and whether to ask for it.
 *
 * Asking is a one-shot: browsers do not re-prompt after a refusal, so a prompt fired on
 * load — before the vendor knows what it is for — permanently costs them the one
 * notification that matters. Callers gate this behind having seen an order.
 */
export function usePush(): UsePush {
  const [state, setState] = useState<PushState>('available');
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1',
  );

  useEffect(() => {
    let cancelled = false;
    void currentState().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      setState(await subscribe());
    } finally {
      setBusy(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    // Remembered, so a vendor who said "not now" is not asked on every single visit.
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  }, []);

  return {
    state,
    canAsk: state === 'available' && !dismissed,
    dismissed,
    enable,
    dismiss,
    busy,
  };
}
