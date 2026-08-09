import { usePush } from '../hooks/usePush';

/**
 * "Get told when an order comes in."
 *
 * Shown only once the vendor has orders on screen and understands what they would be
 * agreeing to. A permission prompt fired on load is the fastest route to a permanent
 * refusal — browsers do not ask twice — and this is the one notification where a miss
 * means a buyer paid for nothing.
 *
 * `visible` is the caller's decision, not this component's, so the rule about *when* to
 * ask lives next to the thing that knows.
 */
export function PushPrompt({ visible }: { visible: boolean }) {
  const { state, canAsk, enable, dismiss, busy } = usePush();

  if (!visible || !canAsk) {
    // Worth saying out loud, because a vendor who refused once will otherwise assume
    // notifications are broken rather than switched off.
    if (visible && state === 'denied') {
      return (
        <p className="mx-4 mt-3 rounded-2xl bg-black/5 px-4 py-3 text-[12px] leading-snug text-ink-soft">
          Notifications are blocked for this site. Turn them back on in your
          browser settings to be told when an order comes in.
        </p>
      );
    }
    return null;
  }

  return (
    <div className="mx-4 mt-3 rounded-2xl bg-surface p-4 shadow-sm">
      <p className="text-[14px] font-extrabold text-ink">
        Get told when an order comes in
      </p>
      <p className="mt-1 text-[13px] leading-snug text-ink-soft">
        We&apos;ll notify you the moment a customer pays, so nothing sits
        waiting.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => void enable()}
          disabled={busy}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-accent px-4 text-[14px] font-bold text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? 'Just a moment…' : 'Turn on notifications'}
        </button>
        <button
          onClick={dismiss}
          className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[14px] font-bold text-ink-soft transition active:opacity-60"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
