import { usePush } from '../hooks/usePush';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

/**
 * The one place that answers "why am I not being told about orders?".
 *
 * Installing and enabling notifications used to be separate concerns, and on iOS that
 * left a dead end: Safari cannot grant push to a browser tab at all, so `usePush` reports
 * `unsupported`, the old prompt rendered nothing, and an iPhone vendor was given silence
 * and no explanation. Since installing is the *precondition* for alerts rather than a
 * parallel suggestion, both live behind one decision here, in priority order:
 *
 * 1. **Installable by hand** — iOS, or a Chrome whose prompt we have already spent.
 *    Nothing else can be offered as a button, so say where the menu is.
 * 2. **Push available** — ask, and offer one-tap install alongside if Chrome allows it.
 *    Push works in an Android tab, so installing is never made a barrier to it.
 * 3. **One-tap install, push already settled** — a slim nudge, no notification talk.
 * 4. **Denied** — explain, because a vendor who refused once assumes it is broken.
 *
 * **Installing and being notified are gated differently, and that matters.** Browsers ask
 * for notification permission once ever, so asking before a vendor knows what the app is
 * for is the fastest route to a permanent refusal — `askForPush` waits until they have
 * seen an order. Installing carries no such penalty: it is a button, refusing it costs
 * nothing, and it can be offered from the first screen.
 *
 * They were behind one gate before, which meant a vendor with no orders yet was shown
 * neither — and a vendor with no orders is precisely the one waiting to be told about one.
 *
 * Dismissal is checked here rather than read off `kind`, because it means "stop asking
 * me", not "I can no longer install". The drawer still installs on demand.
 */
export function AlertsPrompt({ askForPush }: { askForPush: boolean }) {
  const { state, canAsk, enable, dismiss, busy } = usePush();
  const install = useInstallPrompt();
  const offerInstall = !install.dismissed;

  // 1. No prompt to replay. On iOS push is impossible until this is done, so it is the
  //    only ask; on Chrome it is the way back after the native dialog was backed out of.
  if (offerInstall && (install.kind === 'ios' || install.kind === 'manual')) {
    return (
      <Card
        title="Add Recommend to your home screen"
        body={
          install.kind === 'ios'
            ? 'On iPhone, we can only alert you about new orders once the app is on your home screen. Tap Share at the bottom of Safari, then “Add to Home Screen”.'
            : 'Open your browser menu (⋮) and tap “Install app” to keep Recommend on your home screen — it opens straight to your orders.'
        }
        onDismiss={install.dismiss}
      />
    );
  }

  // 2. Push can be asked for, and they have earned the right to be asked.
  if (canAsk && askForPush) {
    return (
      <Card
        title="Get told when an order comes in"
        body="We'll notify you the moment a customer pays, so nothing sits waiting."
        onDismiss={dismiss}
        action={{
          label: busy ? 'Just a moment…' : 'Turn on notifications',
          onClick: () => void enable(),
          disabled: busy,
        }}
        secondary={
          offerInstall && install.kind === 'native'
            ? { label: 'Add to home screen', onClick: install.install }
            : undefined
        }
      />
    );
  }

  // 3. Nothing to ask about, but it can still be installed — worth it on its own.
  if (offerInstall && install.kind === 'native') {
    return (
      <Card
        title="Add Recommend to your home screen"
        body="Opens like an app, straight to your orders — no browser, no typing the address."
        onDismiss={install.dismiss}
        action={{ label: 'Add to home screen', onClick: install.install }}
      />
    );
  }

  // 4. Refused. Browsers never re-prompt, so this is the only way they learn why — but
  // only once they would have been asked, or it is an answer to a question never put.
  if (state === 'denied' && askForPush) {
    return (
      <p className="mx-4 mt-3 rounded-2xl bg-black/5 px-4 py-3 text-[12px] leading-snug text-ink-soft">
        Notifications are blocked for this site. Turn them back on in your
        browser settings to be told when an order comes in.
      </p>
    );
  }

  return null;
}

function Card({
  title,
  body,
  action,
  secondary,
  onDismiss,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void; disabled?: boolean };
  secondary?: { label: string; onClick: () => void };
  onDismiss: () => void;
}) {
  return (
    <div className="mx-4 mt-3 rounded-2xl bg-surface p-4 shadow-sm">
      <p className="text-[14px] font-extrabold text-ink">{title}</p>
      <p className="mt-1 text-[13px] leading-snug text-ink-soft">{body}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {action && (
          <button
            onClick={action.onClick}
            disabled={action.disabled}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-accent px-4 text-[14px] font-bold text-white transition active:scale-[0.99] disabled:opacity-50"
          >
            {action.label}
          </button>
        )}

        {secondary && (
          <button
            onClick={secondary.onClick}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-mint px-4 text-[14px] font-bold text-brand transition active:scale-[0.99]"
          >
            {secondary.label}
          </button>
        )}

        <button
          onClick={onDismiss}
          className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[14px] font-bold text-ink-soft transition active:opacity-60"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
