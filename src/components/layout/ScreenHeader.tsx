import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

/** A title and a way back, on every screen below the tab bar. */
export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center gap-3 px-4 pt-6 pb-4">
      <button
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-extrabold text-ink">{title}</h1>
        {subtitle && (
          <p className="truncate text-[12px] text-ink-soft">{subtitle}</p>
        )}
      </div>
    </header>
  );
}
