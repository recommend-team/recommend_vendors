import { Link, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

export function ApprovalBanner() {
  const { user } = useSession();
  const location = useLocation();

  if (!user || user.status === 'APPROVED') return null;
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
