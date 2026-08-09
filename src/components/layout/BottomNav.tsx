import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

/**
 * The tab bar from the reference.
 *
 * Every tab is live as of V4.
 */
const TABS: {
  to: string;
  label: string;
  icon: ReactNode;
  ready: boolean;
}[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    ready: true,
    icon: (
      <path
        d="M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h7v7H4v-7zm9-3h7v10h-7V10z"
        fill="currentColor"
      />
    ),
  },
  {
    to: '/products',
    label: 'Products',
    ready: true,
    icon: (
      <path
        d="M4 7l8-4 8 4v10l-8 4-8-4V7zm8 0l6-3M4 7l8 4 8-4M12 11v10"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
      />
    ),
  },
  {
    to: '/orders',
    label: 'Orders',
    ready: true,
    icon: (
      <path
        d="M5 4h14v16H5V4zm3 4h8v1.7H8V8zm0 4h8v1.7H8V12zm0 4h5v1.7H8V16z"
        fill="currentColor"
      />
    ),
  },
  {
    to: '/kyc',
    label: 'KYC',
    ready: true,
    icon: (
      <path
        d="M12 3l8 3v6c0 4.4-3.4 8.3-8 9-4.6-.7-8-4.6-8-9V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
      />
    ),
  },
];

export function BottomNav() {
  return (
    <nav
      className="flex items-stretch justify-around border-t border-hairline bg-surface"
      // Reaches under the home indicator without putting a tap target beneath it.
      style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
    >
      {TABS.map((tab) =>
        tab.ready ? (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center gap-1 px-2 pt-2.5 pb-1.5 text-[10px] font-bold',
                isActive ? 'text-accent' : 'text-ink-faint',
              ].join(' ')
            }
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
              {tab.icon}
            </svg>
            {tab.label}
          </NavLink>
        ) : (
          <span
            key={tab.to}
            aria-disabled
            className="flex flex-1 flex-col items-center gap-1 px-2 pt-2.5 pb-1.5 text-[10px] font-bold text-ink-faint opacity-40"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
              {tab.icon}
            </svg>
            {tab.label}
          </span>
        ),
      )}
    </nav>
  );
}
