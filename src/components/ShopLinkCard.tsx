import { useState } from 'react';

/**
 * The vendor's own shop link — the one they put in their Instagram bio and WhatsApp
 * status. Buyers who open it can order and pay there without the chat.
 *
 * Copy is the main action; Share opens the phone's share sheet where there is one.
 */
export function ShopLinkCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  const shown = url.replace(/^https?:\/\//, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard (an old browser, or permission refused): the link is on screen to
      // select by hand.
    }
  };

  const share = () => {
    navigator.share({ title: 'My shop on Recommend', url }).catch(() => {
      // Dismissed the share sheet.
    });
  };

  return (
    <section className="flex items-center gap-2 rounded-2xl bg-surface py-2.5 pr-2.5 pl-4 shadow-sm">
      <a href={url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
        <span className="block text-[11px] font-extrabold tracking-widest text-ink-soft uppercase">
          Your shop link
        </span>
        <span className="block truncate text-[13px] font-bold text-brand">
          {shown}
        </span>
      </a>

      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        title={copied ? 'Link copied' : 'Copy link'}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white active:scale-95"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={share}
          aria-label="Share shop link"
          title="Share"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint text-brand active:scale-95"
        >
          <ShareIcon />
        </button>
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? 'Shop link copied' : ''}
      </span>
    </section>
  );
}

function CopyIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 15V5a1 1 0 0 1 1-1h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
