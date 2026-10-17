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
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <p className="text-[15px] font-extrabold text-ink">Your shop link</p>
      <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">
        Share it on Instagram, WhatsApp or TikTok — buyers can order and pay
        right there.
      </p>

      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 block truncate rounded-xl bg-canvas px-3 py-2.5 text-[13px] font-bold text-brand"
      >
        {shown}
      </a>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 text-[14px] font-bold text-white active:scale-[0.99]"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Link copied' : 'Copy link'}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={share}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-mint px-4 text-[14px] font-bold text-brand active:scale-[0.99]"
          >
            <ShareIcon />
            Share
          </button>
        )}
      </div>
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
