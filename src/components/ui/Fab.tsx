import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

/**
 * The round action button the references float above the tab bar.
 *
 * Positioning note: it is `fixed` to the viewport so it survives scrolling, but centred
 * inside a `max-w-md` row rather than pinned to `right-0`. The app shell is a phone-width
 * column centred on desktop, and a viewport-pinned button would sit alone in the margin,
 * hundreds of pixels from the UI it belongs to. The row itself ignores pointer events so
 * it never swallows a tap meant for the page beneath.
 */
export function Fab({
  to,
  onClick,
  label,
  children,
}: {
  to?: string;
  onClick?: () => void;
  label: string;
  children?: ReactNode;
}) {
  const glyph = children ?? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );

  const styles =
    'pointer-events-auto grid h-14 w-14 place-items-center rounded-full bg-accent text-white shadow-lg transition active:scale-95';

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-30 flex w-full max-w-md -translate-x-1/2 justify-end px-5">
      {to ? (
        <Link to={to} aria-label={label} className={styles}>
          {glyph}
        </Link>
      ) : (
        <button onClick={onClick} aria-label={label} className={styles}>
          {glyph}
        </button>
      )}
    </div>
  );
}
