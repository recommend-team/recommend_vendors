import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * "+ Add product" or "+ Add extra", spelled out at the top of each list — never a bare
 * "+", which left vendors guessing what it would add.
 *
 * Always drawn. A vendor who cannot find the button does not conclude "I must not be
 * approved yet", they conclude the app is broken; so when it cannot work, tapping it says
 * why instead of opening a form that will fail.
 */
export function AddButton({
  label,
  to,
  blockedBecause,
}: {
  label: string;
  to: string;
  /** Why adding isn't possible right now — null when it is. */
  blockedBecause: string | null;
}) {
  const [explained, setExplained] = useState(false);
  const styles =
    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-4 text-[15px] font-bold text-white active:scale-[0.99]';

  return (
    <div className="space-y-2">
      {blockedBecause ? (
        <button
          type="button"
          onClick={() => setExplained(true)}
          className={`${styles} opacity-60`}
        >
          + {label}
        </button>
      ) : (
        <Link to={to} className={styles}>
          + {label}
        </Link>
      )}
      {blockedBecause && explained && (
        <p
          role="status"
          className="rounded-2xl bg-amber px-4 py-3 text-[13px] leading-snug text-ink"
        >
          {blockedBecause}
        </p>
      )}
    </div>
  );
}
