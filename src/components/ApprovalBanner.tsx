import { Link, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useSuspended } from '../hooks/useSuspended';
import { SUPPORT_PHONE_HREF } from '../lib/support';

/**
 * The account's state, when it is not simply "approved": waiting for review, or
 * suspended. Shown on every screen, so nobody wonders why a button does nothing.
 */
export function ApprovalBanner() {
  const { user } = useSession();
  // Signed out: nothing to say, and nothing to fetch.
  if (!user) return null;
  return <AccountBanner sessionStatus={user.status} />;
}

function AccountBanner({ sessionStatus }: { sessionStatus: string }) {
  const location = useLocation();
  const suspended = useSuspended();

  if (suspended) {
    return (
      <div
        role="status"
        className="flex items-center gap-3 bg-accent/10 px-4 py-2.5"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-white">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 7.5v5.5M12 16.5h.01"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </span>

        <p className="min-w-0 flex-1 text-[12px] leading-snug text-ink">
          <span className="font-extrabold">Your account is suspended.</span> You
          can look around, but changes and withdrawals are paused.
        </p>

        <a
          href={SUPPORT_PHONE_HREF}
          className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-[12px] font-bold text-white"
        >
          Call us
        </a>
      </div>
    );
  }

  if (sessionStatus === 'APPROVED') return null;
  if (location.pathname === '/kyc') return null;

  return (
    <div className="flex items-center gap-3 bg-amber px-4 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <p className="min-w-0 flex-1 text-[12px] leading-snug text-ink">
        <span className="font-extrabold">
          We&apos;re reviewing your account.
        </span>{' '}
        You can&apos;t list products until we approve you.
      </p>

      <Link
        to="/kyc"
        className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-[12px] font-bold text-white"
      >
        Documents
      </Link>
    </div>
  );
}
